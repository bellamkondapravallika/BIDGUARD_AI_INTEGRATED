from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class AnalysisRun(Base):
    __tablename__ = "analysis_runs"

    id = Column(Integer, primary_key=True, index=True)
    bid_case_id = Column(String(50), ForeignKey("bid_cases.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    version = Column(Integer, default=1, nullable=False)
    score = Column(Float, default=0.0, nullable=False)
    risk_level = Column(String(50), default="Pending", nullable=False)  # Low, Medium, High, Critical
    clauses_analyzed = Column(Integer, default=0, nullable=False)
    evidence_found = Column(Integer, default=0, nullable=False)
    exceptions_count = Column(Integer, default=0, nullable=False)
    summary = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    # Relationships
    bid_case = relationship("BidCase", back_populates="analysis_runs")
    user = relationship("User", back_populates="analysis_runs")
    findings = relationship("ComplianceFinding", back_populates="analysis_run", cascade="all, delete-orphan")
    risk_alerts = relationship("RiskAlert", back_populates="analysis_run")


class ComplianceFinding(Base):
    __tablename__ = "compliance_findings"

    id = Column(Integer, primary_key=True, index=True)
    analysis_run_id = Column(Integer, ForeignKey("analysis_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    bid_case_id = Column(String(50), ForeignKey("bid_cases.id", ondelete="CASCADE"), nullable=False, index=True)
    requirement_code = Column(String(50), nullable=False)  # "CL-01", "REQ-01"
    requirement_title = Column(String(255), nullable=False)
    category = Column(String(100), default="Technical", nullable=False)
    is_mandatory = Column(Boolean, default=True, nullable=False)
    status = Column(String(50), nullable=False)  # "PASS", "REVIEW", "FAIL"
    confidence = Column(Integer, default=90, nullable=False)  # 0 to 100
    evidence_text = Column(Text, default="", nullable=False)
    document_name = Column(String(255), nullable=True)
    page_number = Column(Integer, nullable=True)
    reason = Column(Text, default="", nullable=False)
    risk_points = Column(Integer, default=0, nullable=False)
    recommendation = Column(Text, default="", nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    analysis_run = relationship("AnalysisRun", back_populates="findings")


class RiskAlert(Base):
    __tablename__ = "risk_alerts"

    id = Column(Integer, primary_key=True, index=True)
    analysis_run_id = Column(Integer, ForeignKey("analysis_runs.id", ondelete="SET NULL"), nullable=True, index=True)
    bid_case_id = Column(String(50), ForeignKey("bid_cases.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    severity = Column(String(50), nullable=False)  # "CRITICAL", "HIGH", "MEDIUM", "LOW"
    category = Column(String(100), default="Compliance", nullable=False)
    description = Column(Text, nullable=False)
    evidence_explanation = Column(Text, default="", nullable=False)
    recommended_action = Column(Text, default="", nullable=False)
    status = Column(String(50), default="Open", nullable=False)  # "Open", "In Review", "Resolved", "Dismissed"
    reviewer_notes = Column(Text, nullable=True)
    assigned_to = Column(String(100), default="Procurement Reviewer", nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    bid_case = relationship("BidCase", back_populates="risk_alerts")
    user = relationship("User", back_populates="risk_alerts")
    analysis_run = relationship("AnalysisRun", back_populates="risk_alerts")
