import csv
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from sqlalchemy.orm import Session

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

from app.config import settings
from app.models.bid import BidCase
from app.models.analysis import AnalysisRun, ComplianceFinding, RiskAlert
from app.models.report import GeneratedReport
from app.models.audit import AuditLog
from app.services.audit import record_audit_log

logger = logging.getLogger(__name__)


class ReportGenerator:

    def __init__(self, db: Session):
        self.db = db
        self.reports_dir = Path(settings.STORAGE_DIR) / "reports"
        self.reports_dir.mkdir(parents=True, exist_ok=True)

    def generate_report(
        self,
        bid_case: BidCase,
        user_id: int,
        report_type: str = "full_compliance",
        file_format: str = "pdf",
        actor_name: str = "Procurement Officer",
    ) -> GeneratedReport:
        """
        Generate and persist an audit-ready compliance or risk report.
        """
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        sanitized_bid_id = bid_case.id.replace("/", "_").replace("-", "_")
        filename = f"{sanitized_bid_id}_{report_type}_{timestamp}.{file_format}"
        file_path = self.reports_dir / filename

        # Fetch latest analysis
        latest_analysis = (
            self.db.query(AnalysisRun)
            .filter(AnalysisRun.bid_case_id == bid_case.id)
            .order_by(AnalysisRun.version.desc())
            .first()
        )
        findings = []
        risks = []
        if latest_analysis:
            findings = self.db.query(ComplianceFinding).filter(ComplianceFinding.analysis_run_id == latest_analysis.id).all()
            risks = self.db.query(RiskAlert).filter(RiskAlert.analysis_run_id == latest_analysis.id).all()

        if file_format == "csv":
            self._generate_csv(file_path, report_type, bid_case, latest_analysis, findings, risks)
        else:
            self._generate_pdf(file_path, report_type, bid_case, latest_analysis, findings, risks)

        file_size = file_path.stat().st_size if file_path.exists() else 0

        # Create report record
        display_names = {
            "full_compliance": f"{bid_case.id} Full Compliance Assessment",
            "compliance_matrix": f"{bid_case.id} Detailed Compliance Matrix",
            "risk_register": f"{bid_case.id} Risk Register & Exception Report",
            "audit_trail": f"{bid_case.id} Assurance Audit Trail",
        }
        report_name = display_names.get(report_type, f"{bid_case.id} Compliance Report")

        report_obj = GeneratedReport(
            bid_case_id=bid_case.id,
            user_id=user_id,
            report_name=report_name,
            report_type=report_type,
            file_format=file_format,
            file_path=str(file_path),
            file_size=file_size,
            score=latest_analysis.score if latest_analysis else bid_case.compliance_score,
            status="Ready",
        )
        self.db.add(report_obj)
        self.db.commit()
        self.db.refresh(report_obj)

        record_audit_log(
            db=self.db,
            action="Generated Compliance Report",
            entity_type="Report",
            user_id=user_id,
            actor_name=actor_name,
            entity_id=str(report_obj.id),
            change_summary=f"Generated {report_name} ({file_format.upper()}) for {bid_case.id}.",
            outcome="SUCCESS",
        )

        return report_obj

    def _generate_csv(self, path: Path, report_type: str, bid: BidCase, analysis: Optional[AnalysisRun], findings: list, risks: list):
        with open(path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            if report_type == "risk_register":
                writer.writerow(["Risk ID", "Bid Case", "Severity", "Category", "Title", "Description", "Status", "Action"])
                for r in risks:
                    writer.writerow([r.id, bid.id, r.severity, r.category, r.title, r.description, r.status, r.recommended_action])
            elif report_type == "audit_trail":
                audit_logs = self.db.query(AuditLog).filter(AuditLog.entity_id == bid.id).all()
                writer.writerow(["Timestamp", "Actor", "Action", "Entity", "Change Summary", "Outcome"])
                for a in audit_logs:
                    writer.writerow([a.created_at.isoformat(), a.actor_name, a.action, a.entity_type, a.change_summary, a.outcome])
            else:  # compliance matrix or full compliance
                writer.writerow(["Clause ID", "Requirement", "Category", "Mandatory", "Status", "Confidence", "Evidence", "Document", "Reason", "Action"])
                for f_item in findings:
                    writer.writerow([
                        f_item.requirement_code,
                        f_item.requirement_title,
                        f_item.category,
                        "Yes" if f_item.is_mandatory else "No",
                        f_item.status,
                        f"{f_item.confidence}%",
                        f_item.evidence_text,
                        f_item.document_name or "N/A",
                        f_item.reason,
                        f_item.recommendation,
                    ])

    def _generate_pdf(self, path: Path, report_type: str, bid: BidCase, analysis: Optional[AnalysisRun], findings: list, risks: list):
        doc = SimpleDocTemplate(
            str(path),
            pagesize=A4,
            leftMargin=36,
            rightMargin=36,
            topMargin=36,
            bottomMargin=36,
        )

        styles = getSampleStyleSheet()
        normal = styles["Normal"]
        title_style = ParagraphStyle(
            "DocTitle",
            parent=normal,
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=22,
            textColor=colors.HexColor("#0B2042"),
        )
        subtitle_style = ParagraphStyle(
            "DocSubtitle",
            parent=normal,
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#059669"),
        )
        h2_style = ParagraphStyle(
            "Heading2Custom",
            parent=normal,
            fontName="Helvetica-Bold",
            fontSize=13,
            leading=17,
            textColor=colors.HexColor("#0B2042"),
            spaceBefore=12,
            spaceAfter=6,
        )
        meta_label = ParagraphStyle(
            "MetaLabel",
            parent=normal,
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#475569"),
        )
        meta_val = ParagraphStyle(
            "MetaVal",
            parent=normal,
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#0F172A"),
        )
        cell_style = ParagraphStyle(
            "Cell",
            parent=normal,
            fontName="Helvetica",
            fontSize=8,
            leading=10,
            textColor=colors.HexColor("#1E293B"),
        )
        cell_bold = ParagraphStyle(
            "CellBold",
            parent=normal,
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=colors.HexColor("#0B2042"),
        )

        elements = []

        # Header Banner
        elements.append(Paragraph("BIDGUARD AI — PROCUREMENT ASSURANCE SYSTEM", subtitle_style))
        elements.append(Spacer(1, 4))
        report_title_text = "Independent Bid Compliance & Assurance Report"
        if report_type == "risk_register":
            report_title_text = "Tender Risk Register & Exception Report"
        elif report_type == "compliance_matrix":
            report_title_text = "Clause-by-Clause Compliance Verification Matrix"
        elements.append(Paragraph(report_title_text, title_style))
        elements.append(Spacer(1, 10))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#24D39A"), spaceBefore=2, spaceAfter=12))

        # Metadata Box
        gen_time = datetime.now(timezone.utc).strftime("%d %b %Y, %H:%M UTC")
        score_display = f"{analysis.score}% ({analysis.risk_level} Risk)" if analysis else f"{bid.compliance_score}% ({bid.risk_level} Risk)"
        meta_data = [
            [Paragraph("Bid Case ID:", meta_label), Paragraph(bid.id, meta_val),
             Paragraph("Generated Date:", meta_label), Paragraph(gen_time, meta_val)],
            [Paragraph("Tender Title:", meta_label), Paragraph(bid.title[:45], meta_val),
             Paragraph("Compliance Score:", meta_label), Paragraph(score_display, meta_val)],
            [Paragraph("GeM Reference:", meta_label), Paragraph(bid.reference_number, meta_val),
             Paragraph("Category:", meta_label), Paragraph(bid.category, meta_val)],
            [Paragraph("Procuring Entity:", meta_label), Paragraph(f"{bid.department}, {bid.procuring_organization}", meta_val),
             Paragraph("Status:", meta_label), Paragraph(bid.status, meta_val)],
        ]
        meta_table = Table(meta_data, colWidths=[95, 175, 105, 150])
        meta_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#E2E8F0")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#F1F5F9")),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 14))

        # Executive Summary
        if analysis:
            elements.append(Paragraph("Executive Assurance Summary", h2_style))
            summary_p = Paragraph(analysis.summary, cell_style)
            elements.append(summary_p)
            elements.append(Spacer(1, 12))

        # Findings Table
        if findings and report_type in ["full_compliance", "compliance_matrix"]:
            elements.append(Paragraph("Clause Compliance Matrix", h2_style))
            header = [
                Paragraph("Clause", cell_bold),
                Paragraph("Requirement Title", cell_bold),
                Paragraph("Status", cell_bold),
                Paragraph("Evidence / Verification", cell_bold),
                Paragraph("Action Required", cell_bold),
            ]
            rows = [header]
            for f_item in findings:
                # Color code status
                color_hex = "#16A34A" if f_item.status == "PASS" else ("#DC2626" if f_item.status == "FAIL" else "#D97706")
                status_p = Paragraph(f"<font color='{color_hex}'><b>{f_item.status}</b></font>", cell_style)
                rows.append([
                    Paragraph(f_item.requirement_code, cell_style),
                    Paragraph(f_item.requirement_title[:38], cell_style),
                    status_p,
                    Paragraph((f_item.evidence_text[:65] + "...") if len(f_item.evidence_text) > 65 else (f_item.evidence_text or "No evidence"), cell_style),
                    Paragraph(f_item.recommendation[:45], cell_style),
                ])

            findings_table = Table(rows, colWidths=[50, 140, 55, 165, 115])
            findings_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]))
            elements.append(findings_table)
            elements.append(Spacer(1, 14))

        # Risks Section
        if risks and report_type in ["full_compliance", "risk_register"]:
            elements.append(Paragraph("Identified Risk Register", h2_style))
            risk_header = [
                Paragraph("Severity", cell_bold),
                Paragraph("Risk Description", cell_bold),
                Paragraph("Evidence Detail", cell_bold),
                Paragraph("Recommended Mitigation", cell_bold),
            ]
            risk_rows = [risk_header]
            for r in risks:
                sev_color = "#DC2626" if r.severity in ["CRITICAL", "HIGH"] else ("#D97706" if r.severity == "MEDIUM" else "#16A34A")
                sev_p = Paragraph(f"<font color='{sev_color}'><b>{r.severity}</b></font>", cell_style)
                risk_rows.append([
                    sev_p,
                    Paragraph(r.title, cell_style),
                    Paragraph(r.evidence_explanation[:65] if r.evidence_explanation else "N/A", cell_style),
                    Paragraph(r.recommended_action[:55] if r.recommended_action else "Review", cell_style),
                ])

            risks_table = Table(risk_rows, colWidths=[65, 160, 150, 150])
            risks_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]))
            elements.append(risks_table)
            elements.append(Spacer(1, 14))

        # Disclaimer
        disclaimer = Paragraph(
            "<font color='#64748B' size='7'><b>NOTICE & DISCLAIMER:</b> This report is generated by BIDGUARD AI for procurement decision-support and audit verification. "
            "All findings are grounded strictly in submitted vendor documentation. "
            "This report does not constitute a legal certification or substitute for statutory committee review.</font>",
            cell_style,
        )
        elements.append(disclaimer)

        doc.build(elements)
