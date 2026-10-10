from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.bid import BidCase
from app.models.document import Document
from app.models.analysis import AnalysisRun, RiskAlert
from app.models.notification import Notification
from app.security import get_current_user

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])


@router.get("/summary")
@router.get("/stats")
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Returns authentic, database-calculated metrics for the authenticated user's workspace.
    """
    user_id = current_user.id

    # 1. Total and Active Bid Cases
    total_cases = db.query(func.count(BidCase.id)).filter(BidCase.user_id == user_id).scalar() or 0
    active_cases = (
        db.query(func.count(BidCase.id))
        .filter(BidCase.user_id == user_id, BidCase.status.in_(["In review", "Action needed", "Analyzing", "Draft"]))
        .scalar() or 0
    )

    # 2. Completed Analyses
    analyzed_count = db.query(func.count(AnalysisRun.id)).filter(AnalysisRun.user_id == user_id).scalar() or 0

    # 3. Average Compliance Score
    avg_score_res = (
        db.query(func.avg(BidCase.compliance_score))
        .filter(BidCase.user_id == user_id, BidCase.compliance_score > 0)
        .scalar()
    )
    average_compliance = round(float(avg_score_res), 1) if avg_score_res is not None else 0.0

    # 4. Open Critical Risks
    critical_alerts = (
        db.query(func.count(RiskAlert.id))
        .filter(RiskAlert.user_id == user_id, RiskAlert.severity == "CRITICAL", RiskAlert.status.in_(["Open", "In Review"]))
        .scalar() or 0
    )

    # 5. Missing Documents
    missing_docs_cases = (
        db.query(func.count(BidCase.id))
        .filter(BidCase.user_id == user_id, ~BidCase.documents.any())
        .scalar() or 0
    )

    # 6. Risk distribution
    risk_counts = {
        "Critical": 0,
        "High": 0,
        "Medium": 0,
        "Low": 0,
    }
    risks_grouped = (
        db.query(RiskAlert.severity, func.count(RiskAlert.id))
        .filter(RiskAlert.user_id == user_id, RiskAlert.status.in_(["Open", "In Review"]))
        .group_by(RiskAlert.severity)
        .all()
    )
    for sev, cnt in risks_grouped:
        sev_title = sev.capitalize()
        if sev_title in risk_counts:
            risk_counts[sev_title] = cnt
        elif sev.upper() == "CRITICAL":
            risk_counts["Critical"] = cnt

    # 7. Compliance trends (from user's analysis history)
    recent_runs = (
        db.query(AnalysisRun.score, AnalysisRun.created_at)
        .filter(AnalysisRun.user_id == user_id)
        .order_by(AnalysisRun.created_at.asc())
        .limit(10)
        .all()
    )
    trend = [round(run.score) for run in recent_runs]
    if not trend:
        trend = [0]

    # 8. Status distribution
    status_counts = {}
    status_grouped = (
        db.query(BidCase.status, func.count(BidCase.id))
        .filter(BidCase.user_id == user_id)
        .group_by(BidCase.status)
        .all()
    )
    for stat, cnt in status_grouped:
        status_counts[stat] = cnt

    # 9. Recent Cases
    recent_cases = (
        db.query(BidCase)
        .filter(BidCase.user_id == user_id)
        .order_by(BidCase.updated_at.desc())
        .limit(5)
        .all()
    )
    cases_list = [
        {
            "id": c.id,
            "title": c.title,
            "department": c.department,
            "status": c.status,
            "score": round(c.compliance_score),
            "risk": c.risk_level,
            "updated": c.updated_at.strftime("%d %b %Y, %H:%M"),
        }
        for c in recent_cases
    ]

    # 10. Recent notifications
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .limit(5)
        .all()
    )
    notifications_list = [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "link": n.link,
            "is_read": n.is_read,
            "created_at": n.created_at.strftime("%d %b, %H:%M"),
        }
        for n in notifications
    ]

    return {
        "totalCases": total_cases,
        "activeCases": active_cases,
        "analyzed": analyzed_count,
        "averageCompliance": average_compliance,
        "criticalAlerts": critical_alerts,
        "missingDocuments": missing_docs_cases,
        "trend": trend,
        "riskDistribution": risk_counts,
        "statusDistribution": status_counts,
        "recentCases": cases_list,
        "recentNotifications": notifications_list,
    }


@router.get("/compliance-trends")
def get_compliance_trends(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    runs = (
        db.query(AnalysisRun)
        .filter(AnalysisRun.user_id == current_user.id)
        .order_by(AnalysisRun.created_at.asc())
        .limit(12)
        .all()
    )
    return [
        {
            "date": r.created_at.strftime("%b %d"),
            "score": r.score,
            "risk": r.risk_level,
            "caseId": r.bid_case_id,
        }
        for r in runs
    ]


@router.get("/risk-distribution")
def get_risk_distribution(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    counts = {
        "CRITICAL": 0,
        "HIGH": 0,
        "MEDIUM": 0,
        "LOW": 0,
    }
    rows = (
        db.query(RiskAlert.severity, func.count(RiskAlert.id))
        .filter(RiskAlert.user_id == current_user.id, RiskAlert.status.in_(["Open", "In Review"]))
        .group_by(RiskAlert.severity)
        .all()
    )
    for sev, cnt in rows:
        counts[sev.upper()] = cnt

    return counts
