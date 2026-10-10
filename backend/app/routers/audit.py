from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.audit import AuditLog
from app.schemas.audit import AuditLogResponse
from app.security import get_current_user

router = APIRouter(tags=["Audit Trail"])


@router.get("/api/v1/audit-logs")
@router.get("/api/v1/audit")
def get_audit_trail(
    entity_type: Optional[str] = None,
    action: Optional[str] = None,
    outcome: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(AuditLog).filter(
        (AuditLog.user_id == current_user.id) | (AuditLog.user_id.is_(None))
    )

    if entity_type:
        query = query.filter(AuditLog.entity_type.ilike(entity_type))
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    if outcome:
        query = query.filter(AuditLog.outcome == outcome.upper())

    logs = query.order_by(AuditLog.created_at.desc()).limit(limit).all()

    # Format for UI
    return [
        {
            "id": log.id,
            "time": log.created_at.strftime("%d %b %Y, %H:%M"),
            "actor": log.actor_name,
            "action": log.action,
            "caseId": log.entity_id or "System",
            "result": log.change_summary or log.outcome,
            "outcome": log.outcome,
            "entityType": log.entity_type,
        }
        for log in logs
    ]
