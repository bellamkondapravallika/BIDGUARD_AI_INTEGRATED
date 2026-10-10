from typing import List, Literal, Optional
from pydantic import BaseModel


Status = Literal["PASS", "REVIEW", "FAIL"]


class TenderRequirement(BaseModel):
    requirement_id: str
    requirement: str

    mandatory: bool = True

    required_documents: List[str] = []

    min_turnover: Optional[float] = None
    min_experience_years: Optional[int] = None
    required_date: Optional[str] = None

    registration_required: Optional[str] = None


    eligibility_required: bool = False


class BidderDetails(BaseModel):
    entity_name: str
    registration_number: Optional[str] = None
    turnover: Optional[float] = None
    experience_years: Optional[int] = None


class DocumentField(BaseModel):
    document_type: str
    entity_name: Optional[str] = None
    registration_number: Optional[str] = None

    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None

    turnover: Optional[float] = None
    eligible: Optional[bool] = None


class ComplianceInput(BaseModel):
    tender_requirements: List[TenderRequirement]
    bidder: BidderDetails
    documents: List[DocumentField]


class ComplianceResult(BaseModel):
    check_id: str
    requirement: str
    status: Status
    confidence: float
    evidence: List[str]
    reason: str
    risk_points: int
    recommendation: str