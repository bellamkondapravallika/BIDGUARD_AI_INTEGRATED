"""
MOCK ADAPTERS FOR BIDGUARD AI INTEGRATIONS (MODULE M5)
MOCK_VERIFIED

NOTICE: BIDGUARD AI operates exclusively on simulated/mock regulatory interfaces.
NO LIVE GOVERNMENT PORTAL ACCESS is claimed or attempted.
"""

import json
import re
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict

# Universal Header / Stamp
STATUS_STAMP = "MOCK_VERIFIED"
DISCLAIMER = "MOCK_VERIFIED: Simulated interface. No live government portal access."


class CheckResult(Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    WARNING = "WARNING"
    INFO = "INFO"


@dataclass
class AuditEvent:
    """
    Normalized Audit Event Schema (M5 Requirement):
    - source
    - timestamp
    - user
    - check
    - result
    - evidence
    - rule_id
    - status_stamp (MOCK_VERIFIED)
    """
    source: str
    timestamp: str
    user: str
    check: str
    result: CheckResult
    evidence: Dict[str, Any]
    rule_id: str
    status: str = STATUS_STAMP

    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['result'] = self.result.value
        return data


class MockAdapterBase:
    """Base class for all mock adapters - Guarantees MOCK_VERIFIED responses."""
    def __init__(self, source_name: str):
        self.source = source_name
        self.latest_events: List[AuditEvent] = []

    def _create_event(self, user: str, check: str, result: CheckResult,
                     evidence: Dict[str, Any], rule_id: str) -> AuditEvent:
        # Guarantee MOCK_VERIFIED stamp in evidence payload
        evidence_payload = dict(evidence)
        evidence_payload["status_stamp"] = STATUS_STAMP
        evidence_payload["notice"] = DISCLAIMER

        event = AuditEvent(
            source=self.source,
            timestamp=datetime.now(timezone.utc).isoformat(),
            user=user,
            check=check,
            result=result,
            evidence=evidence_payload,
            rule_id=rule_id,
            status=STATUS_STAMP
        )
        self.latest_events.append(event)
        return event


# =====================================================================
# MOCK ADAPTER IMPLEMENTATIONS (8 GOVERNMENT PLATFORMS)
# =====================================================================

class GeMAdapter(MockAdapterBase):
    """1. Mock Government e-Marketplace (GeM) Adapter"""
    def __init__(self):
        super().__init__("GeM")

    def check_seller_verification(self, user: str, bidder_id: str) -> AuditEvent:
        is_inconsistent = bidder_id == "BID003"
        evidence = {
            "bidder_id": bidder_id,
            "gem_seller_id": f"GEM{bidder_id[-6:]}" if bidder_id else None,
            "verification_status": "SUSPENDED" if is_inconsistent else "verified",
            "blacklisted": is_inconsistent,
            "last_updated": (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
        }
        return self._create_event(
            user=user,
            check="seller_verification",
            result=CheckResult.FAIL if is_inconsistent else CheckResult.PASS,
            evidence=evidence,
            rule_id="GEM_SELLER_VER_001"
        )

    def check_bank_details(self, user: str, bidder_id: str) -> AuditEvent:
        evidence = {
            "bidder_id": bidder_id,
            "account_verified": True,
            "ifsc_valid": True,
            "account_type": "Current",
            "bank_name": "State Bank of India"
        }
        return self._create_event(
            user=user,
            check="bank_details_verification",
            result=CheckResult.PASS,
            evidence=evidence,
            rule_id="GEM_BANK_VER_002"
        )


class UdyamAdapter(MockAdapterBase):
    """2. Mock Udyam MSME Registration Adapter"""
    def __init__(self):
        super().__init__("Udyam")

    def check_udyam_registration(self, user: str, udyam_number: str) -> AuditEvent:
        # State 'XX' or short format triggers invalid/fail result
        is_valid = bool(udyam_number and udyam_number.startswith("UDYAM-") and "XX" not in udyam_number and len(udyam_number) >= 12)
        evidence = {
            "udyam_number": udyam_number,
            "registration_date": (datetime.now(timezone.utc) - timedelta(days=365)).isoformat() if is_valid else None,
            "status": "Active" if is_valid else "Invalid State Code / Format",
            "enterprise_type": "Private Limited" if is_valid else None
        }
        return self._create_event(
            user=user,
            check="udyam_registration",
            result=CheckResult.PASS if is_valid else CheckResult.FAIL,
            evidence=evidence,
            rule_id="UDYAM_REG_001"
        )


class GSTAdapter(MockAdapterBase):
    """3. Mock Goods & Services Tax (GST) Adapter"""
    def __init__(self):
        super().__init__("GST")

    def check_gstin_validity(self, user: str, gstin: str) -> AuditEvent:
        is_valid = bool(gstin and len(gstin) == 15 and gstin.isalnum() and not gstin.startswith("XX"))
        evidence = {
            "gstin": gstin,
            "state_code": gstin[:2] if len(gstin) >= 2 else None,
            "pan": gstin[2:12] if len(gstin) >= 12 else None,
            "registration_status": "Active" if is_valid else "CANCELLED_SUO_MOTU",
            "cancelled_date": None if is_valid else "2023-01-15T00:00:00Z"
        }
        return self._create_event(
            user=user,
            check="gstin_validity",
            result=CheckResult.PASS if is_valid else CheckResult.FAIL,
            evidence=evidence,
            rule_id="GST_GSTIN_001"
        )

    def check_gst_returns_filing(self, user: str, gstin: str) -> AuditEvent:
        # Deterministic check based on GSTIN validity
        is_compliant = bool(gstin and not gstin.startswith("XX") and gstin != "07AABCU9603R1Z5")
        evidence = {
            "gstin": gstin,
            "last_return_period": "03/2026",
            "return_type": "GSTR-3B",
            "filed_on": (datetime.now(timezone.utc) - timedelta(days=15)).isoformat() if is_compliant else None,
            "status": "Filed" if is_compliant else "Defaulter / Pending",
            "tax_paid": 250000 if is_compliant else 0
        }
        return self._create_event(
            user=user,
            check="gst_returns_filing",
            result=CheckResult.PASS if is_compliant else CheckResult.FAIL,
            evidence=evidence,
            rule_id="GST_RETURN_002"
        )


class PANIncomeTaxAdapter(MockAdapterBase):
    """4. Mock CBDT PAN & Income Tax Adapter"""
    def __init__(self):
        super().__init__("PAN_IncomeTax")

    def check_pan_validity(self, user: str, pan: str) -> AuditEvent:
        pan_pattern = r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$'
        is_valid = bool(pan and re.match(pan_pattern, pan))
        evidence = {
            "pan": pan,
            "name_as_per_pan": "TEST COMPANY PVT LTD" if is_valid else "INVALID ENTITY",
            "status": "Active" if is_valid else "Invalid Format (Missing Characters)",
            "area_code": pan[:3] if is_valid else None,
            "range_code": pan[3:5] if is_valid and len(pan) >= 5 else None
        }
        return self._create_event(
            user=user,
            check="pan_validity",
            result=CheckResult.PASS if is_valid else CheckResult.FAIL,
            evidence=evidence,
            rule_id="PAN_VALID_001"
        )

    def check_income_tax_filing(self, user: str, pan: str) -> AuditEvent:
        is_valid = bool(pan and len(pan) == 10)
        evidence = {
            "pan": pan,
            "assessment_year": "2025-26",
            "return_filed": is_valid,
            "filing_date": (datetime.now(timezone.utc) - timedelta(days=60)).isoformat() if is_valid else None,
            "income_declared": 2500000 if is_valid else 0,
            "tax_paid": 450000 if is_valid else 0,
            "status": "Assessment Completed" if is_valid else "Non-Filer"
        }
        return self._create_event(
            user=user,
            check="income_tax_filing",
            result=CheckResult.PASS if is_valid else CheckResult.FAIL,
            evidence=evidence,
            rule_id="IT_RETURN_001"
        )


class MCAAdapter(MockAdapterBase):
    """5. Mock Ministry of Corporate Affairs (MCA21) Adapter"""
    def __init__(self):
        super().__init__("MCA")

    def check_cin_validity(self, user: str, cin: str) -> AuditEvent:
        is_valid = bool(cin and len(cin) == 21 and cin.isalnum() and "XX" not in cin)
        evidence = {
            "cin": cin,
            "company_name": "BIDGUARD TECHNOLOGIES PVT LTD" if is_valid else "UNVERIFIED ENTITY",
            "status": "Active" if is_valid else "STRIKEN_OFF",
            "registration_number": cin[-6:] if is_valid and len(cin) >= 6 else None,
            "date_of_incorporation": "2020-05-15T00:00:00Z" if is_valid else None,
            "state_code": cin[5:7] if is_valid and len(cin) >= 7 else None
        }
        return self._create_event(
            user=user,
            check="cin_validity",
            result=CheckResult.PASS if is_valid else CheckResult.FAIL,
            evidence=evidence,
            rule_id="MCA_CIN_001"
        )

    def check_annual_filing(self, user: str, cin: str) -> AuditEvent:
        is_valid = bool(cin and len(cin) == 21 and "XX" not in cin)
        evidence = {
            "cin": cin,
            "annual_return_filed": is_valid,
            "financial_statements_filed": is_valid,
            "last_agm_date": (datetime.now(timezone.utc) - timedelta(days=200)).isoformat() if is_valid else None,
            "audit_status": "Clean" if is_valid else "DEFAULTED",
            "pending_litigations": 0 if is_valid else 3
        }
        return self._create_event(
            user=user,
            check="annual_filing_compliance",
            result=CheckResult.PASS if is_valid else CheckResult.FAIL,
            evidence=evidence,
            rule_id="MCA_FILING_002"
        )


class StartupIndiaNSICAdapter(MockAdapterBase):
    """6. Mock DPIIT Startup India / NSIC Adapter"""
    def __init__(self):
        super().__init__("StartupIndia_NSIC")

    def check_startup_recognition(self, user: str, startup_id: str) -> AuditEvent:
        is_valid = bool(startup_id and startup_id.startswith("SU0") or startup_id == "DPIIT-ST-12345")
        evidence = {
            "startup_id": startup_id,
            "recognition_number": f"DIPP{startup_id[-6:]}" if is_valid else "NONE",
            "certificate_date": (datetime.now(timezone.utc) - timedelta(days=400)).isoformat() if is_valid else None,
            "status": "Recognized" if is_valid else "UNRECOGNIZED",
            "tax_benefits_eligible": is_valid
        }
        return self._create_event(
            user=user,
            check="startup_recognition",
            result=CheckResult.PASS if is_valid else CheckResult.FAIL,
            evidence=evidence,
            rule_id="STARTUP_REC_001"
        )

    def check_nsic_registration(self, user: str, nsic_id: str) -> AuditEvent:
        is_valid = bool(nsic_id and (nsic_id.startswith("NSIC0") or nsic_id == "NSIC-CERT-887"))
        evidence = {
            "nsic_id": nsic_id,
            "registration_date": (datetime.now(timezone.utc) - timedelta(days=200)).isoformat() if is_valid else None,
            "status": "Active" if is_valid else "INACTIVE / EXPIRED",
            "enterprise_category": "Micro" if is_valid else "UNQUALIFIED"
        }
        return self._create_event(
            user=user,
            check="nsic_registration",
            result=CheckResult.PASS if is_valid else CheckResult.FAIL,
            evidence=evidence,
            rule_id="NSIC_REG_001"
        )


class EPFOESICAdapter(MockAdapterBase):
    """7. Mock EPFO & ESIC Compliance Adapter"""
    def __init__(self):
        super().__init__("EPFO_ESIC")

    def check_epfo_registration(self, user: str, epfo_code: str) -> AuditEvent:
        is_valid = bool(epfo_code and not epfo_code.startswith("EPFOFAKE"))
        evidence = {
            "epfo_code": epfo_code,
            "establishment_name": "BIDGUARD SOLUTIONS" if is_valid else "UNKNOWN",
            "status": "Covered" if is_valid else "NON_PAYMENT_PROCEEDINGS",
            "members_count": 45 if is_valid else 0,
            "last_contribution_month": "07/2026" if is_valid else "N/A"
        }
        return self._create_event(
            user=user,
            check="epfo_registration",
            result=CheckResult.PASS if is_valid else CheckResult.FAIL,
            evidence=evidence,
            rule_id="EPFO_REG_001"
        )

    def check_esic_registration(self, user: str, esic_code: str) -> AuditEvent:
        is_valid = bool(esic_code and not esic_code.startswith("ESICFAKE"))
        evidence = {
            "esic_code": esic_code,
            "establishment_name": "BIDGUARD SOLUTIONS" if is_valid else "UNKNOWN",
            "status": "Covered" if is_valid else "INACTIVE",
            "insured_persons": 38 if is_valid else 0
        }
        return self._create_event(
            user=user,
            check="esic_registration",
            result=CheckResult.PASS if is_valid else CheckResult.FAIL,
            evidence=evidence,
            rule_id="ESIC_REG_001"
        )


class DigiLockerAdapter(MockAdapterBase):
    """8. Mock DigiLocker Verification Adapter"""
    def __init__(self):
        super().__init__("DigiLocker")

    def check_document_available(self, user: str, document_type: str, document_id: str) -> AuditEvent:
        is_valid = bool(document_id and not document_id.startswith("DOC_FAKE"))
        evidence = {
            "document_type": document_type,
            "document_id": document_id,
            "issuer": "Government of India" if is_valid else "UNVERIFIED_ISSUER",
            "issue_date": (datetime.now(timezone.utc) - timedelta(days=365)).isoformat() if is_valid else None,
            "status": "Available" if is_valid else "TAMPERED / UNVERIFIED_HASH",
            "access_count": 5 if is_valid else 0
        }
        return self._create_event(
            user=user,
            check=f"document_available_{document_type}",
            result=CheckResult.PASS if is_valid else CheckResult.FAIL,
            evidence=evidence,
            rule_id=f"DIGILOCKER_{document_type.upper()}_001"
        )


# =====================================================================
# BIDDER PROFILES FOR DEMONSTRATION DATA (M5 REQUIREMENT)
# =====================================================================

class BidderProfile:
    """Defines a bidder profile for demonstration evaluation."""
    def __init__(self, name: str, user_id: str, attributes: Dict[str, Any]):
        self.name = name
        self.user_id = user_id
        self.attributes = attributes


# Profile 1: Fully Compliant Bidder
FULLY_COMPLIANT_BIDDER = BidderProfile(
    name="Fully Compliant Bidder",
    user_id="user_compliant_001",
    attributes={
        "bidder_id": "BID001",
        "udyam_number": "UDYAM-MH-00-0001234",
        "gstin": "27AABCU9603R1Z5",
        "pan": "AABCU9603R",
        "cin": "U72900MH2020PTC123456",
        "startup_id": "SU001",
        "nsic_id": "NSIC001",
        "epfo_code": "MHGR1234567",
        "esic_code": "MHDL1234567",
        "documents": {
            "incorporation_cert": "DOC001",
            "pan_card": "DOC002",
            "gst_certificate": "DOC003"
        }
    }
)

# Profile 2: Partially Compliant Bidder
PARTIALLY_COMPLIANT_BIDDER = BidderProfile(
    name="Partially Compliant Bidder",
    user_id="user_partial_002",
    attributes={
        "bidder_id": "BID002",
        "udyam_number": "UDYAM-DL-00-0005678",
        "gstin": "07AABCU9603R1Z5",          # GST filing defaulted
        "pan": "AABCU9603R",
        "cin": "U72900DL2020PTC999999",
        "startup_id": "SU002",
        "nsic_id": "",
        "epfo_code": "",
        "esic_code": "MHDL9999999",
        "documents": {
            "incorporation_cert": "DOC004",
            "pan_card": "DOC005",
            "gst_certificate": ""
        }
    }
)

# Profile 3: Intentionally Inconsistent Bidder (Impressive Red-Flag Demo)
INTENTIONALLY_INCONSISTENT_BIDDER = BidderProfile(
    name="Intentionally Inconsistent Bidder (Red Flag Demo)",
    user_id="user_inconsistent_003",
    attributes={
        "bidder_id": "BID003",                 # Blacklisted on GeM
        "udyam_number": "UDYAM-XX-99-9999999",  # Invalid state code 'XX'
        "gstin": "XXAABCU9603R1Z5",             # Cancelled GSTIN with state 'XX'
        "pan": "AABCU9603",                     # Missing 10th character (Invalid PAN)
        "cin": "U72900XX2020PTC12345",          # Invalid CIN (20 chars, state 'XX')
        "startup_id": "SU999999",               # Unrecognized Startup ID
        "nsic_id": "NSICFAKE",                  # Fake NSIC ID
        "epfo_code": "EPFOFAKE123",             # Non-payment EPFO proceedings
        "esic_code": "ESICFAKE456",             # Inactive ESIC
        "documents": {
            "incorporation_cert": "DOC_FAKE_001",
            "pan_card": "DOC_FAKE_002",
            "gst_certificate": "DOC_FAKE_003"
        },
        "red_flags": [
            "🚨 CRITICAL: GeM Seller Status SUSPENDED & Blacklisted",
            "🚨 CRITICAL: Multiple Invalid Government IDs (Invalid State Code 'XX')",
            "🚨 CRITICAL: GSTIN Cancelled Suo-Motu with Filing Defaults",
            "🚨 CRITICAL: Invalid PAN (Format Mismatch - Missing Last Character)",
            "🚨 CRITICAL: MCA Company Status STRIKEN_OFF",
            "🚨 CRITICAL: EPFO Legal Proceedings for Non-Payment",
            "🚨 CRITICAL: DigiLocker Cryptographic Hash Tampering Detected"
        ]
    }
)


def generate_audit_events_for_bidder(bidder: BidderProfile) -> List[AuditEvent]:
    """Generate normalized audit events across all 8 mock adapters."""
    events = []
    adapters = [
        GeMAdapter(),
        UdyamAdapter(),
        GSTAdapter(),
        PANIncomeTaxAdapter(),
        MCAAdapter(),
        StartupIndiaNSICAdapter(),
        EPFOESICAdapter(),
        DigiLockerAdapter()
    ]

    def get_attr(key, default=None):
        return bidder.attributes.get(key, default)

    # 1. GeM
    events.append(adapters[0].check_seller_verification(bidder.user_id, get_attr("bidder_id")))
    events.append(adapters[0].check_bank_details(bidder.user_id, get_attr("bidder_id")))

    # 2. Udyam
    events.append(adapters[1].check_udyam_registration(bidder.user_id, get_attr("udyam_number")))

    # 3. GST
    events.append(adapters[2].check_gstin_validity(bidder.user_id, get_attr("gstin")))
    events.append(adapters[2].check_gst_returns_filing(bidder.user_id, get_attr("gstin")))

    # 4. PAN/Income Tax
    events.append(adapters[3].check_pan_validity(bidder.user_id, get_attr("pan")))
    events.append(adapters[3].check_income_tax_filing(bidder.user_id, get_attr("pan")))

    # 5. MCA
    events.append(adapters[4].check_cin_validity(bidder.user_id, get_attr("cin")))
    events.append(adapters[4].check_annual_filing(bidder.user_id, get_attr("cin")))

    # 6. Startup India/NSIC
    events.append(adapters[5].check_startup_recognition(bidder.user_id, get_attr("startup_id")))
    events.append(adapters[5].check_nsic_registration(bidder.user_id, get_attr("nsic_id")))

    # 7. EPFO/ESIC
    events.append(adapters[6].check_epfo_registration(bidder.user_id, get_attr("epfo_code")))
    events.append(adapters[6].check_esic_registration(bidder.user_id, get_attr("esic_code")))

    # 8. DigiLocker
    docs = get_attr("documents", {})
    for doc_type, doc_id in docs.items():
        if doc_id:
            events.append(adapters[7].check_document_available(bidder.user_id, doc_type, doc_id))

    return events


def print_audit_summary(events: List[AuditEvent], bidder_name: str):
    """Print formatted audit trail summary with status stamps."""
    print(f"\n{'='*70}")
    print(f"AUDIT SUMMARY: {bidder_name} [{STATUS_STAMP}]")
    print(f"{'='*70}")

    passed = sum(1 for e in events if e.result == CheckResult.PASS)
    failed = sum(1 for e in events if e.result == CheckResult.FAIL)
    warnings = sum(1 for e in events if e.result == CheckResult.WARNING)

    print(f"Total Audit Checks: {len(events)}")
    print(f"Passed: {passed} | Failed: {failed} | Warnings: {warnings}")
    print(f"Status Stamp: {STATUS_STAMP}")
    print(f"\nDetailed Results:")
    print(f"{'-'*70}")

    for event in events:
        status_symbol = "✓" if event.result == CheckResult.PASS else "✗"
        print(f"{status_symbol} [{event.source}] {event.check}: {event.result.value} (Rule: {event.rule_id}) [{event.status}]")
        if event.evidence:
            key_points = [f"{k}={v}" for k, v in list(event.evidence.items())[:3] if v and k not in ("notice", "status_stamp")]
            if key_points:
                print(f"    Evidence: {', '.join(key_points)}")

    if bidder_name == "Intentionally Inconsistent Bidder (Red Flag Demo)":
        print(f"\n{'-'*70}")
        print("RED FLAGS DETECTED (HIGH RISK SUSPECT):")
        for flag in INTENTIONALLY_INCONSISTENT_BIDDER.attributes["red_flags"]:
            print(f"  {flag}")


def main():
    """Main execution function for BidGuard AI Mock Integrations Suite."""
    print("=" * 70)
    print(f"BIDGUARD AI - GOVERNMENT INTEGRATIONS & AUDIT SUITE ({STATUS_STAMP})")
    print(DISCLAIMER)
    print("=" * 70)

    bidders = [
        FULLY_COMPLIANT_BIDDER,
        PARTIALLY_COMPLIANT_BIDDER,
        INTENTIONALLY_INCONSISTENT_BIDDER
    ]

    for bidder in bidders:
        events = generate_audit_events_for_bidder(bidder)
        print_audit_summary(events, bidder.name)

    print(f"\n{'='*70}")
    print(f"DEMO COMPLETE - ALL RESPONSES VERIFIED [{STATUS_STAMP}]")
    print(DISCLAIMER)
    print("=" * 70)


if __name__ == "__main__":
    main()