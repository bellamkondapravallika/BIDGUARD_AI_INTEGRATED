import logging
from typing import Optional
from sqlalchemy.orm import Session
from app.models.audit import AuditLog

logger = logging.getLogger(__name__)


def record_audit_log(
    db: Session,
    action: str,
    entity_type: str,
    user_id: Optional[int] = None,
    actor_name: str = "System",
    entity_id: Optional[str] = None,
    change_summary: str = "",
    outcome: str = "SUCCESS",
    ip_address: Optional[str] = None,
) -> AuditLog:
    """
    Persist an audit log entry to the database.
    Never swallow critical governance traces.
    """
    try:
        log_entry = AuditLog(
            user_id=user_id,
            actor_name=actor_name,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id else None,
            change_summary=change_summary,
            outcome=outcome,
            ip_address=ip_address,
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        return log_entry
    except Exception as exc:
        logger.error("Failed to write audit log: %s", exc)
        db.rollback()
        return None
