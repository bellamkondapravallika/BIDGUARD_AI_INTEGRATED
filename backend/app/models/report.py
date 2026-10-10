from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class GeneratedReport(Base):
    __tablename__ = "generated_reports"

    id = Column(Integer, primary_key=True, index=True)
    bid_case_id = Column(String(50), ForeignKey("bid_cases.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    report_name = Column(String(255), nullable=False)
    report_type = Column(String(100), nullable=False)  # full_compliance, risk_register, compliance_matrix, audit_trail
    file_format = Column(String(20), default="pdf", nullable=False)  # pdf, csv
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, default=0, nullable=False)  # bytes
    score = Column(Float, nullable=True)
    status = Column(String(50), default="Ready", nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    bid_case = relationship("BidCase", back_populates="reports")
    user = relationship("User", back_populates="reports")
