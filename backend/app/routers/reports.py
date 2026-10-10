from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.bid import BidCase
from app.models.report import GeneratedReport
from app.schemas.report import ReportGenerateRequest, ReportResponse
from app.security import get_current_user
from app.services.reporter import ReportGenerator
from app.services.audit import record_audit_log

router = APIRouter(tags=["Reports"])


@router.post("/api/v1/bids/{bid_id}/reports", status_code=status.HTTP_201_CREATED)
def generate_bid_report(
    bid_id: str,
    req: ReportGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bid = db.query(BidCase).filter(BidCase.id == bid_id, BidCase.user_id == current_user.id).first()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid case not found or access denied.")

    generator = ReportGenerator(db)
    report = generator.generate_report(
        bid_case=bid,
        user_id=current_user.id,
        report_type=req.report_type,
        file_format=req.file_format,
        actor_name=current_user.full_name,
    )

    return {
        "id": report.id,
        "name": report.report_name,
        "caseId": report.bid_case_id,
        "date": report.created_at.strftime("%d %b %Y"),
        "score": f"{round(report.score)}%" if report.score is not None else "N/A",
        "status": report.status,
        "format": report.file_format,
        "size": report.file_size,
    }


@router.get("/api/v1/reports")
def list_reports(
    case_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(GeneratedReport).filter(GeneratedReport.user_id == current_user.id)
    if case_id:
        query = query.filter(GeneratedReport.bid_case_id == case_id)

    reports = query.order_by(GeneratedReport.created_at.desc()).all()

    # If user has no reports yet, auto-generate one for their latest case if available
    if not reports:
        latest_bid = db.query(BidCase).filter(BidCase.user_id == current_user.id).first()
        if latest_bid:
            generator = ReportGenerator(db)
            rep = generator.generate_report(latest_bid, current_user.id, "full_compliance", "pdf", current_user.full_name)
            reports = [rep]

    return [
        {
            "id": r.id,
            "name": r.report_name,
            "caseId": r.bid_case_id,
            "date": r.created_at.strftime("%d %b %Y"),
            "score": f"{round(r.score)}%" if r.score is not None else "N/A",
            "status": r.status,
            "format": r.file_format,
            "size": r.file_size,
        }
        for r in reports
    ]


@router.get("/api/v1/reports/{report_id}/download")
def download_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = db.query(GeneratedReport).filter(GeneratedReport.id == report_id, GeneratedReport.user_id == current_user.id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found or access denied.")

    path = Path(report.file_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Report file not found on disk.")

    record_audit_log(
        db=db,
        action="Downloaded Report",
        entity_type="Report",
        user_id=current_user.id,
        actor_name=current_user.full_name,
        entity_id=str(report.id),
        change_summary=f"Downloaded report {report.report_name} ({report.file_format}).",
        outcome="SUCCESS",
    )

    media_type = "application/pdf" if report.file_format == "pdf" else "text/csv"
    return FileResponse(
        path=path,
        filename=Path(report.file_path).name,
        media_type=media_type,
    )
