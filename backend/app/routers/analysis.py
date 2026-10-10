from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.bid import BidCase
from app.models.analysis import AnalysisRun, ComplianceFinding, RiskAlert
from app.schemas.analysis import AnalysisRunResponse, FindingResponse, RiskAlertResponse
from app.security import get_current_user
from app.services.engine import BidAnalysisEngine

router = APIRouter(tags=["Bid Analysis"])


@router.post("/api/v1/bids/{bid_id}/analyze", response_model=AnalysisRunResponse)
def analyze_bid(
    bid_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bid = db.query(BidCase).filter(BidCase.id == bid_id, BidCase.user_id == current_user.id).first()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid case not found or access denied.")

    engine = BidAnalysisEngine(db)
    analysis_run = engine.run_analysis(bid, user_id=current_user.id, actor_name=current_user.full_name)

    findings = db.query(ComplianceFinding).filter(ComplianceFinding.analysis_run_id == analysis_run.id).all()
    res = AnalysisRunResponse.model_validate(analysis_run)
    res.findings = [FindingResponse.model_validate(f) for f in findings]
    return res


@router.post("/api/v1/analysis/run")
def analyze_run_compat(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Compatibility endpoint for existing frontend. Analyzes user's latest bid case.
    """
    latest_bid = (
        db.query(BidCase)
        .filter(BidCase.user_id == current_user.id)
        .order_by(BidCase.created_at.desc())
        .first()
    )

    if not latest_bid:
        # Create an initial bid case for user if none exists
        latest_bid = BidCase(
            id="BG-2026-081",
            user_id=current_user.id,
            title="Enterprise Network Security Appliances",
            reference_number="GEM/2026/B/891234",
            procuring_organization="Ministry of Electronics & IT",
            department="Cyber Security Directorate",
            description="Procurement of advanced next-generation firewalls and network security appliances.",
            category="Enterprise IT",
            estimated_value=12_500_000.0,
            currency="INR",
            status="In review",
            risk_level="Pending",
            compliance_score=0.0,
        )
        db.add(latest_bid)
        db.commit()
        db.refresh(latest_bid)

    engine = BidAnalysisEngine(db)
    analysis_run = engine.run_analysis(latest_bid, user_id=current_user.id, actor_name=current_user.full_name)

    findings = db.query(ComplianceFinding).filter(ComplianceFinding.analysis_run_id == analysis_run.id).all()

    return {
        "score": analysis_run.score,
        "risk": analysis_run.risk_level,
        "clausesAnalyzed": analysis_run.clauses_analyzed,
        "evidenceFound": analysis_run.evidence_found,
        "exceptions": analysis_run.exceptions_count,
        "summary": analysis_run.summary,
        "checks": [
            {
                "requirement": f.requirement_title,
                "status": f.status,
                "evidence": [f.evidence_text] if f.evidence_text else [],
                "confidence": f.confidence / 100.0,
                "recommendation": f.recommendation,
                "reason": f.reason,
            }
            for f in findings
        ],
    }


@router.get("/api/v1/bids/{bid_id}/analysis")
def get_bid_analysis(
    bid_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bid = db.query(BidCase).filter(BidCase.id == bid_id, BidCase.user_id == current_user.id).first()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid case not found.")

    latest_run = (
        db.query(AnalysisRun)
        .filter(AnalysisRun.bid_case_id == bid_id)
        .order_by(AnalysisRun.version.desc())
        .first()
    )
    if not latest_run:
        return {"hasAnalysis": False, "bid": bid.id}

    findings = db.query(ComplianceFinding).filter(ComplianceFinding.analysis_run_id == latest_run.id).all()
    risks = db.query(RiskAlert).filter(RiskAlert.analysis_run_id == latest_run.id).all()

    return {
        "hasAnalysis": True,
        "analysis": AnalysisRunResponse.model_validate(latest_run),
        "findings": [FindingResponse.model_validate(f) for f in findings],
        "risks": [RiskAlertResponse.model_validate(r) for r in risks],
    }


@router.get("/api/v1/compliance")
def get_compliance_matrix(
    case_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns compliance matrix items for user's selected or latest bid case.
    """
    query = db.query(AnalysisRun).filter(AnalysisRun.user_id == current_user.id)
    if case_id:
        query = query.filter(AnalysisRun.bid_case_id == case_id)
    latest_run = query.order_by(AnalysisRun.created_at.desc()).first()

    if not latest_run:
        # Check if user has any bid, if so run analysis on it
        bid = db.query(BidCase).filter(BidCase.user_id == current_user.id).first()
        if bid:
            engine = BidAnalysisEngine(db)
            latest_run = engine.run_analysis(bid, user_id=current_user.id)
        else:
            return []

    findings = (
        db.query(ComplianceFinding)
        .filter(ComplianceFinding.analysis_run_id == latest_run.id)
        .order_by(ComplianceFinding.requirement_code.asc())
        .all()
    )

    return [
        {
            "id": f.requirement_code,
            "requirement": f.requirement_title,
            "category": f.category,
            "mandatory": f.is_mandatory,
            "result": f.status,
            "evidence": f.evidence_text or "No matching evidence",
            "confidence": f.confidence,
            "action": f.recommendation,
            "document": f.document_name,
            "page": f.page_number or 1,
            "reason": f.reason,
            "caseId": latest_run.bid_case_id,
        }
        for f in findings
    ]
