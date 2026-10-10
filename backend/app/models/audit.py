from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    actor_name = Column(String(255), default="System", nullable=False)
    action = Column(String(255), nullable=False)
    entity_type = Column(String(100), nullable=False)  # BidCase, Document, AnalysisRun, RiskAlert, User, Report
    entity_id = Column(String(100), nullable=True)
    change_summary = Column(Text, default="", nullable=False)
    outcome = Column(String(50), default="SUCCESS", nullable=False)  # SUCCESS, FAILURE, WARNING
    ip_address = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False, index=True)

    user = relationship("User", back_populates="audit_logs")
