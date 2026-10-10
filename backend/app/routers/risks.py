from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.bid import BidCase
from app.models.analysis import RiskAlert
from app.schemas.analysis import RiskAlertResponse, RiskStatusUpdateRequest
from app.security import get_current_user
from app.services.audit import record_audit_log

router = APIRouter(prefix="/api/v1/risks", tags=["Risk Alerts"])


@router.get("")
def list_risks(
    severity: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    case_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(RiskAlert).filter(RiskAlert.user_id == current_user.id)

    if severity:
        query = query.filter(RiskAlert.severity.ilike(severity))
    if status_filter:
        query = query.filter(RiskAlert.status.ilike(status_filter))
    if case_id:
        query = query.filter(RiskAlert.bid_case_id == case_id)

    risks = query.order_by(RiskAlert.created_at.desc()).all()

    # Format response compatible with both modern and legacy frontend cards
    return [
        {
            "id": r.id,
            "severity": r.severity,
            "title": r.title,
            "caseId": r.bid_case_id,
            "owner": r.assigned_to or "Procurement",
            "age": r.created_at.strftime("%d %b"),
            "description": r.description,
            "action": r.recommended_action,
            "evidence": r.evidence_explanation,
            "status": r.status,
            "reviewerNotes": r.reviewer_notes,
            "category": r.category,
        }
        for r in risks
    ]


@router.patch("/{risk_id}")
def update_risk_status(
    risk_id: int,
    req: RiskStatusUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    risk = db.query(RiskAlert).filter(RiskAlert.id == risk_id, RiskAlert.user_id == current_user.id).first()
    if not risk:
        raise HTTPException(status_code=404, detail="Risk alert not found or access denied.")

    old_status = risk.status
    risk.status = req.status
    if req.reviewer_notes is not None:
        risk.reviewer_notes = req.reviewer_notes
    if req.assigned_to is not None:
        risk.assigned_to = req.assigned_to

    db.commit()
    db.refresh(risk)

    record_audit_log(
        db=db,
        action="Updated Risk Status",
        entity_type="RiskAlert",
        user_id=current_user.id,
        actor_name=current_user.full_name,
        entity_id=str(risk_id),
        change_summary=f"Risk alert {risk_id} status changed from '{old_status}' to '{req.status}'.",
        outcome="SUCCESS",
    )

    return {"message": "Risk alert updated successfully.", "id": risk.id, "status": risk.status}
