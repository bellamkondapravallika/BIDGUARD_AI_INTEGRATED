from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class RequirementCreate(BaseModel):
    code: str = Field(min_length=1, max_length=50)
    title: str = Field(min_length=2, max_length=255)
    category: str = Field(default="Technical")
    description: str = Field(min_length=2)
    is_mandatory: bool = True
    threshold_value: Optional[float] = None
    threshold_years: Optional[int] = None
    required_document_types: str = Field(default="")


class RequirementResponse(BaseModel):
    id: int
    bid_case_id: str
    code: str
    title: str
    category: str
    description: str
    is_mandatory: bool
    threshold_value: Optional[float] = None
    threshold_years: Optional[int] = None
    required_document_types: str
    created_at: datetime

    class Config:
        from_attributes = True


class BidCaseCreate(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    reference_number: str = Field(min_length=2, max_length=100)
    procuring_organization: str = Field(min_length=2, max_length=255)
    department: str = Field(min_length=2, max_length=255)
    description: str = Field(min_length=5)
    category: str = Field(default="Enterprise IT")
    estimated_value: float = Field(default=0.0, ge=0)
    currency: str = Field(default="INR")
    submission_deadline: Optional[datetime] = None
    requirements: Optional[List[RequirementCreate]] = None


class BidCaseUpdate(BaseModel):
    title: Optional[str] = None
    procuring_organization: Optional[str] = None
    department: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    estimated_value: Optional[float] = None
    currency: Optional[str] = None
    submission_deadline: Optional[datetime] = None
    status: Optional[str] = None
    risk_level: Optional[str] = None


class BidCaseResponse(BaseModel):
    id: str
    user_id: int
    title: str
    reference_number: str
    procuring_organization: str
    department: str
    description: str
    category: str
    estimated_value: float
    currency: str
    submission_deadline: Optional[datetime] = None
    status: str
    risk_level: str
    compliance_score: float
    created_at: datetime
    updated_at: datetime
    requirements_count: int = 0
    documents_count: int = 0

    class Config:
        from_attributes = True


class BidCaseDetailResponse(BidCaseResponse):
    requirements: List[RequirementResponse] = []
