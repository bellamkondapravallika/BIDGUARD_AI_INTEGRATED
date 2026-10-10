from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class FindingResponse(BaseModel):
    id: int
    requirement_code: str
    requirement_title: str
    category: str
    is_mandatory: bool
    status: str
    confidence: int
    evidence_text: str
    document_name: Optional[str] = None
    page_number: Optional[int] = None
    reason: str
    risk_points: int
    recommendation: str
    created_at: datetime

    class Config:
        from_attributes = True


class AnalysisRunResponse(BaseModel):
    id: int
    bid_case_id: str
    version: int
    score: float
    risk_level: str
    clauses_analyzed: int
    evidence_found: int
    exceptions_count: int
    summary: str
    created_at: datetime
    findings: List[FindingResponse] = []

    class Config:
        from_attributes = True


class RiskAlertResponse(BaseModel):
    id: int
    analysis_run_id: Optional[int] = None
    bid_case_id: str
    case_title: Optional[str] = None
    title: str
    severity: str
    category: str
    description: str
    evidence_explanation: str
    recommended_action: str
    status: str
    reviewer_notes: Optional[str] = None
    assigned_to: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RiskStatusUpdateRequest(BaseModel):
    status: str = Field(pattern="^(Open|In Review|Resolved|Dismissed)$")
    reviewer_notes: Optional[str] = None
    assigned_to: Optional[str] = None
