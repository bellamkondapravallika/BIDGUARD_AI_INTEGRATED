from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ReportGenerateRequest(BaseModel):
    report_type: str = Field(default="full_compliance", pattern="^(full_compliance|compliance_matrix|risk_register|audit_trail)$")
    file_format: str = Field(default="pdf", pattern="^(pdf|csv)$")


class ReportResponse(BaseModel):
    id: int
    bid_case_id: str
    report_name: str
    report_type: str
    file_format: str
    file_size: int
    score: Optional[float] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
