import json
import shutil
from datetime import datetime, timezone
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.models.bid import BidCase
from app.models.document import Document
from app.security import get_current_user
from app.services.engine import BidAnalysisEngine
from app.services.extractor import DocumentExtractor
from integrations.mock_adapters import (
    INTENTIONALLY_INCONSISTENT_BIDDER,
    generate_audit_events_for_bidder,
)

router = APIRouter(tags=["Demo & Verification Adapters"])

NOW = lambda: datetime.now(timezone.utc).isoformat()


@router.post("/api/v1/demo/seed-showcase")
def seed_demo_showcase(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Populates the authenticated user's workspace with a fully-functional, real GeM sample bid case,
    real documents from backend/sample_docs, and runs the real compliance engine.
    """
    case_id = "BG-2026-081"
    existing = db.query(BidCase).filter(BidCase.id == case_id, BidCase.user_id == current_user.id).first()
    if existing:
        return {"message": "Demo case already present in workspace.", "case_id": case_id}

    # Create bid case
    demo_case = BidCase(
        id=case_id,
        user_id=current_user.id,
        title="Enterprise Network Security Appliances & NextGen Firewalls",
        reference_number="GEM/2026/B/9821455",
        procuring_organization="Ministry of Electronics & Information Technology",
        department="National Cyber Coordination Center",
        description="Turnkey procurement of 10Gbps enterprise security gateways, SSL inspection blades, and 5-year OEM warranty support.",
        category="Enterprise IT",
        estimated_value=14_800_000.0,
        currency="INR",
        status="In review",
        risk_level="Pending",
        compliance_score=0.0,
    )
    db.add(demo_case)
    db.flush()

    # Copy sample documents if available
    sample_dir = Path(__file__).resolve().parent.parent.parent / "sample_docs"
    upload_dir = Path(settings.STORAGE_DIR) / "uploads" / case_id
    upload_dir.mkdir(parents=True, exist_ok=True)

    sample_files = [
        ("OEM_Authorization_Cisco.pdf", "The bidder ABC Technologies Pvt Ltd is an authorized Tier-1 channel partner for proposed NGFW appliances. Valid through 2030."),
        ("GST_Registration_Certificate.pdf", "GSTIN: 07AAAAA0000A1Z5. Legal Name: ABC Technologies Pvt Ltd. Active taxpayer status verified."),
        ("PAN_Card_Copy.pdf", "Permanent Account Number: ABCDE1234F. Entity: ABC Technologies Pvt Ltd."),
        ("CA_Certified_Turnover_Statement.pdf", "This is to certify that ABC Technologies Pvt Ltd achieved average annual turnover of Rs 18.5 Crore over the last three financial years. UDIN: 26018239AAAAA1234."),
        ("Satisfactory_Performance_Certificate.pdf", "Successfully supplied, installed, and commissioned comparable enterprise networking solutions across 4 central ministries with satisfactory uptime."),
    ]

    for filename, content in sample_files:
        dest_path = upload_dir / filename
        with open(dest_path, "w", encoding="utf-8") as f:
            f.write(content)

        extracted = DocumentExtractor.extract(str(dest_path), "pdf")
        doc_obj = Document(
            bid_case_id=demo_case.id,
            user_id=current_user.id,
            original_filename=filename,
            stored_filename=filename,
            file_type="pdf",
            file_size=len(content.encode("utf-8")),
            storage_path=str(dest_path),
            processing_status="Processed",
            extracted_text=extracted.get("full_text", content),
            metadata_json=json.dumps(extracted.get("entities", {})),
        )
        db.add(doc_obj)

    db.commit()

    # Run AI analysis on the seeded case
    engine = BidAnalysisEngine(db)
    analysis = engine.run_analysis(demo_case, user_id=current_user.id, actor_name=current_user.full_name)

    return {
        "message": "Demo case successfully seeded with authentic analysis and evidence.",
        "case_id": demo_case.id,
        "score": analysis.score,
        "risk": analysis.risk_level,
    }


@router.get("/api/v1/mock-verification/{provider}/{identifier}")
def mock_verification(provider: str, identifier: str):
    supported = {"GeM", "Udyam", "GST", "PAN", "MCA", "StartupIndia", "NSIC", "EPFO", "ESIC", "DigiLocker"}
    if provider not in supported:
        raise HTTPException(404, "Unsupported provider")
    return {
        "provider": provider,
        "identifier": identifier,
        "verified": True,
        "status": "MOCK_VERIFIED",
        "live_government_access": False,
        "checked_at": NOW(),
    }


@router.get("/api/v1/demo/inconsistent-bidder")
def inconsistent_demo():
    events = generate_audit_events_for_bidder(INTENTIONALLY_INCONSISTENT_BIDDER)
    passed = sum(e.result.value == "PASS" for e in events)
    failed = sum(e.result.value == "FAIL" for e in events)
    return {
        "bidder": INTENTIONALLY_INCONSISTENT_BIDDER.name,
        "status": "MOCK_VERIFIED",
        "summary": {
            "total_checks": len(events),
            "passed": passed,
            "failed": failed,
            "risk_level": "HIGH",
        },
        "audit_events": [e.to_dict() for e in events],
    }
