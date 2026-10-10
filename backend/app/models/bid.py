from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class BidCase(Base):
    __tablename__ = "bid_cases"

    id = Column(String(50), primary_key=True, index=True)  # e.g. "BG-2026-081"
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    reference_number = Column(String(100), nullable=False, index=True)
    procuring_organization = Column(String(255), nullable=False)
    department = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False)
    estimated_value = Column(Float, default=0.0, nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    submission_deadline = Column(DateTime, nullable=True)
    status = Column(String(50), default="In review", nullable=False)  # "Draft", "In review", "Action needed", "Compliant", "Analyzing", "Archived"
    risk_level = Column(String(50), default="Pending", nullable=False)  # "Pending", "Low", "Medium", "High", "Critical"
    compliance_score = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    user = relationship("User", back_populates="bid_cases")
    requirements = relationship("BidRequirement", back_populates="bid_case", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="bid_case", cascade="all, delete-orphan")
    analysis_runs = relationship("AnalysisRun", back_populates="bid_case", cascade="all, delete-orphan")
    risk_alerts = relationship("RiskAlert", back_populates="bid_case", cascade="all, delete-orphan")
    reports = relationship("GeneratedReport", back_populates="bid_case", cascade="all, delete-orphan")


class BidRequirement(Base):
    __tablename__ = "bid_requirements"

    id = Column(Integer, primary_key=True, index=True)
    bid_case_id = Column(String(50), ForeignKey("bid_cases.id", ondelete="CASCADE"), nullable=False, index=True)
    code = Column(String(50), nullable=False)  # e.g. "REQ-01", "CL-01"
    title = Column(String(255), nullable=False)
    category = Column(String(100), default="Technical", nullable=False)  # Technical, Financial, Statutory, OEM, Experience
    description = Column(Text, nullable=False)
    is_mandatory = Column(Boolean, default=True, nullable=False)
    threshold_value = Column(Float, nullable=True)  # min turnover
    threshold_years = Column(Integer, nullable=True)  # min experience
    required_document_types = Column(String(255), default="", nullable=False)  # e.g. "OEM_AUTHORIZATION,PAN,GST"
    created_at = Column(DateTime, default=utc_now, nullable=False)

    bid_case = relationship("BidCase", back_populates="requirements")
