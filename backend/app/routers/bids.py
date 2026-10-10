import random
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, desc, asc
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.bid import BidCase, BidRequirement
from app.models.document import Document
from app.schemas.bid import (
    BidCaseCreate,
    BidCaseUpdate,
    BidCaseResponse,
    BidCaseDetailResponse,
    RequirementCreate,
    RequirementResponse,
)
from app.security import get_current_user
from app.services.audit import record_audit_log

router = APIRouter(tags=["Bid Cases"])


def _generate_case_id(db: Session) -> str:
    year = datetime.now(timezone.utc).year
    count = db.query(BidCase).count() + 1
    # Try unique generation
    for _ in range(10):
        case_id = f"BG-{year}-{count:03d}"
        if not db.query(BidCase).filter(BidCase.id == case_id).first():
            return case_id
        count += 1
    return f"BG-{year}-{random.randint(100, 999)}"


@router.get("/api/v1/bids", response_model=List[BidCaseResponse])
@router.get("/api/v1/bid-cases")
def list_bids(
    search: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    category: Optional[str] = None,
    risk: Optional[str] = None,
    sort_by: str = "updated_at",
    order: str = "desc",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(BidCase).filter(BidCase.user_id == current_user.id)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                BidCase.id.ilike(search_term),
                BidCase.title.ilike(search_term),
                BidCase.reference_number.ilike(search_term),
                BidCase.procuring_organization.ilike(search_term),
                BidCase.department.ilike(search_term),
            )
        )

    if status_filter:
        query = query.filter(BidCase.status.ilike(status_filter))

    if category:
        query = query.filter(BidCase.category.ilike(category))

    if risk:
        query = query.filter(BidCase.risk_level.ilike(risk))

    # Order
    order_col = getattr(BidCase, sort_by, BidCase.updated_at)
    if order.lower() == "asc":
        query = query.order_by(asc(order_col))
    else:
        query = query.order_by(desc(order_col))

    cases = query.all()

    # Format response
    results = []
    for c in cases:
        req_count = len(c.requirements)
        doc_count = len(c.documents)
        item = {
            "id": c.id,
            "user_id": c.user_id,
            "title": c.title,
            "reference_number": c.reference_number,
            "procuring_organization": c.procuring_organization,
            "department": c.department,
            "description": c.description,
            "category": c.category,
            "estimated_value": c.estimated_value,
            "currency": c.currency,
            "submission_deadline": c.submission_deadline,
            "status": c.status,
            "risk_level": c.risk_level,
            "compliance_score": c.compliance_score,
            "created_at": c.created_at,
            "updated_at": c.updated_at,
            "requirements_count": req_count,
            "documents_count": doc_count,
            # for backwards frontend compatibility:
            "score": round(c.compliance_score),
            "risk": c.risk_level,
            "updated": c.updated_at.strftime("%d %b %Y"),
        }
        results.append(item)

    return results


@router.post("/api/v1/bids", status_code=status.HTTP_201_CREATED)
@router.post("/api/v1/bid-cases", status_code=status.HTTP_201_CREATED)
def create_bid(
    req: BidCaseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    case_id = _generate_case_id(db)

    bid = BidCase(
        id=case_id,
        user_id=current_user.id,
        title=req.title,
        reference_number=req.reference_number,
        procuring_organization=req.procuring_organization,
        department=req.department,
        description=req.description,
        category=req.category,
        estimated_value=req.estimated_value,
        currency=req.currency,
        submission_deadline=req.submission_deadline,
        status="In review",
        risk_level="Pending",
        compliance_score=0.0,
    )
    db.add(bid)
    db.flush()

    # If explicit requirements supplied, add them
    if req.requirements:
        for r in req.requirements:
            requirement = BidRequirement(
                bid_case_id=bid.id,
                code=r.code,
                title=r.title,
                category=r.category,
                description=r.description,
                is_mandatory=r.is_mandatory,
                threshold_value=r.threshold_value,
                threshold_years=r.threshold_years,
                required_document_types=r.required_document_types,
            )
            db.add(requirement)

    db.commit()
    db.refresh(bid)

    record_audit_log(
        db=db,
        action="Created Bid Case",
        entity_type="BidCase",
        user_id=current_user.id,
        actor_name=current_user.full_name,
        entity_id=bid.id,
        change_summary=f"Created bid case {bid.id} ('{bid.title}').",
        outcome="SUCCESS",
    )

    return {
        "id": bid.id,
        "title": bid.title,
        "department": bid.department,
        "reference": bid.reference_number,
        "status": bid.status,
        "score": round(bid.compliance_score),
        "risk": bid.risk_level,
        "updated": "Just now",
        "created_at": bid.created_at.isoformat(),
    }


@router.get("/api/v1/bids/{bid_id}", response_model=BidCaseDetailResponse)
def get_bid_detail(
    bid_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bid = db.query(BidCase).filter(BidCase.id == bid_id, BidCase.user_id == current_user.id).first()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid case not found or access denied.")

    return BidCaseDetailResponse(
        id=bid.id,
        user_id=bid.user_id,
        title=bid.title,
        reference_number=bid.reference_number,
        procuring_organization=bid.procuring_organization,
        department=bid.department,
        description=bid.description,
        category=bid.category,
        estimated_value=bid.estimated_value,
        currency=bid.currency,
        submission_deadline=bid.submission_deadline,
        status=bid.status,
        risk_level=bid.risk_level,
        compliance_score=bid.compliance_score,
        created_at=bid.created_at,
        updated_at=bid.updated_at,
        requirements_count=len(bid.requirements),
        documents_count=len(bid.documents),
        requirements=[RequirementResponse.model_validate(r) for r in bid.requirements],
    )


@router.patch("/api/v1/bids/{bid_id}")
def update_bid(
    bid_id: str,
    req: BidCaseUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bid = db.query(BidCase).filter(BidCase.id == bid_id, BidCase.user_id == current_user.id).first()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid case not found or access denied.")

    if req.title is not None:
        bid.title = req.title
    if req.procuring_organization is not None:
        bid.procuring_organization = req.procuring_organization
    if req.department is not None:
        bid.department = req.department
    if req.description is not None:
        bid.description = req.description
    if req.category is not None:
        bid.category = req.category
    if req.estimated_value is not None:
        bid.estimated_value = req.estimated_value
    if req.currency is not None:
        bid.currency = req.currency
    if req.submission_deadline is not None:
        bid.submission_deadline = req.submission_deadline
    if req.status is not None:
        bid.status = req.status
    if req.risk_level is not None:
        bid.risk_level = req.risk_level

    db.commit()
    db.refresh(bid)

    record_audit_log(
        db=db,
        action="Updated Bid Case",
        entity_type="BidCase",
        user_id=current_user.id,
        actor_name=current_user.full_name,
        entity_id=bid.id,
        change_summary=f"Updated properties on bid case {bid.id}.",
        outcome="SUCCESS",
    )

    return {"message": "Bid case updated successfully.", "id": bid.id}


@router.delete("/api/v1/bids/{bid_id}")
def delete_bid(
    bid_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bid = db.query(BidCase).filter(BidCase.id == bid_id, BidCase.user_id == current_user.id).first()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid case not found or access denied.")

    db.delete(bid)
    db.commit()

    record_audit_log(
        db=db,
        action="Deleted Bid Case",
        entity_type="BidCase",
        user_id=current_user.id,
        actor_name=current_user.full_name,
        entity_id=bid_id,
        change_summary=f"Permanently removed bid case {bid_id}.",
        outcome="SUCCESS",
    )

    return {"message": f"Bid case {bid_id} deleted successfully."}
