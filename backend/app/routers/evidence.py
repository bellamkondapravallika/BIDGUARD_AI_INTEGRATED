from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.bid import BidCase
from app.models.analysis import AnalysisRun, ComplianceFinding
from app.models.document import Document
from app.security import get_current_user

router = APIRouter(prefix="/api/v1/evidence", tags=["Evidence"])


@router.get("")
def list_evidence(
    case_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = (
        db.query(ComplianceFinding)
        .join(AnalysisRun, ComplianceFinding.analysis_run_id == AnalysisRun.id)
        .filter(AnalysisRun.user_id == current_user.id)
    )
    if case_id:
        query = query.filter(ComplianceFinding.bid_case_id == case_id)

    findings = query.order_by(ComplianceFinding.created_at.desc()).all()

    evidence_list = []
    for f in findings:
        doc_name = f.document_name or f"{f.requirement_code}_supporting_doc.pdf"
        status_label = "Verified" if f.status == "PASS" else ("Needs review" if f.status == "REVIEW" else "Non-compliant")
        evidence_list.append({
            "id": f.id,
            "name": doc_name,
            "type": f.category,
            "page": f.page_number or 1,
            "status": status_label,
            "confidence": f.confidence,
            "text": f.evidence_text or f.reason,
            "clause": f.requirement_title,
            "caseId": f.bid_case_id,
            "risk": f.risk_points,
            "recommendation": f.recommendation,
        })

    return evidence_list


@router.get("/{evidence_id}")
def get_evidence_detail(
    evidence_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    finding = (
        db.query(ComplianceFinding)
        .join(AnalysisRun, ComplianceFinding.analysis_run_id == AnalysisRun.id)
        .filter(ComplianceFinding.id == evidence_id, AnalysisRun.user_id == current_user.id)
        .first()
    )
    if not finding:
        raise HTTPException(status_code=404, detail="Evidence record not found.")

    return {
        "id": finding.id,
        "name": finding.document_name or "Supporting Evidence Document",
        "type": finding.category,
        "page": finding.page_number or 1,
        "status": finding.status,
        "confidence": finding.confidence,
        "text": finding.evidence_text,
        "clause": finding.requirement_title,
        "caseId": finding.bid_case_id,
        "reason": finding.reason,
        "recommendation": finding.recommendation,
    }
