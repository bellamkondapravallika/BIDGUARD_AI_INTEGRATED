from datetime import date
from typing import List

from .models import (
    TenderRequirement,
    BidderDetails,
    DocumentField,
)


def normalize(value):
    if value is None:
        return None

    return str(value).strip().lower()


def find_document(
    documents: List[DocumentField],
    document_type: str
):
    target = normalize(document_type)

    for document in documents:
        if normalize(document.document_type) == target:
            return document

    return None


def check_missing_document(
    requirement: TenderRequirement,
    documents: List[DocumentField]
):
    for required_doc in requirement.required_documents:

        document = find_document(documents, required_doc)

        if document is None:
            return {
                "status": "FAIL",
                "evidence": [
                    f"Required document '{required_doc}' was not found."
                ],
                "reason": "Mandatory document is missing.",
                "severity": 2
            }

    return None


def check_expiry(document: DocumentField):

    if not document.expiry_date:
        return {
            "status": "REVIEW",
            "evidence": [
                "Document expiry date is not available."
            ],
            "reason": "Expiry cannot be verified.",
            "severity": 1
        }

    try:
        expiry = date.fromisoformat(document.expiry_date)
    except ValueError:
        return {
            "status": "REVIEW",
            "evidence": [
                f"Invalid expiry date format: {document.expiry_date}"
            ],
            "reason": "Expiry date could not be parsed.",
            "severity": 1
        }

    today = date.today()

    if expiry < today:
        return {
            "status": "FAIL",
            "evidence": [
                f"Expiry date: {document.expiry_date}",
                f"Current date: {today.isoformat()}"
            ],
            "reason": "Document has expired.",
            "severity": 2
        }

    return {
        "status": "PASS",
        "evidence": [
            f"Expiry date: {document.expiry_date}",
            f"Current date: {today.isoformat()}"
        ],
        "reason": "Document is currently valid.",
        "severity": 1
    }


def check_entity_name(
    bidder: BidderDetails,
    document: DocumentField
):

    if not document.entity_name:
        return {
            "status": "REVIEW",
            "evidence": [
                "Document entity name is unavailable."
            ],
            "reason": "Entity name cannot be verified.",
            "severity": 1
        }

    if normalize(bidder.entity_name) != normalize(document.entity_name):
        return {
            "status": "FAIL",
            "evidence": [
                f"Bidder entity: {bidder.entity_name}",
                f"Document entity: {document.entity_name}"
            ],
            "reason": "Entity name mismatch detected.",
            "severity": 2
        }

    return {
        "status": "PASS",
        "evidence": [
            f"Bidder entity: {bidder.entity_name}",
            f"Document entity: {document.entity_name}"
        ],
        "reason": "Entity names match.",
        "severity": 1
    }


def check_registration(
    bidder: BidderDetails,
    document: DocumentField
):

    if not bidder.registration_number:
        return {
            "status": "REVIEW",
            "evidence": [
                "Bidder registration number is unavailable."
            ],
            "reason": "Registration cannot be verified.",
            "severity": 1
        }

    if not document.registration_number:
        return {
            "status": "REVIEW",
            "evidence": [
                "Document registration number is unavailable."
            ],
            "reason": "Registration number is missing from document.",
            "severity": 1
        }

    if bidder.registration_number != document.registration_number:
        return {
            "status": "FAIL",
            "evidence": [
                f"Bidder registration: {bidder.registration_number}",
                f"Document registration: {document.registration_number}"
            ],
            "reason": "Registration number mismatch.",
            "severity": 2
        }

    return {
        "status": "PASS",
        "evidence": [
            f"Registration number: {bidder.registration_number}"
        ],
        "reason": "Registration numbers match.",
        "severity": 1
    }


def check_turnover(
    requirement: TenderRequirement,
    bidder: BidderDetails,
    document: DocumentField
):

    if requirement.min_turnover is None:
        return None

    if bidder.turnover is None:
        return {
            "status": "REVIEW",
            "evidence": [
                "Bidder turnover is unavailable."
            ],
            "reason": "Turnover eligibility cannot be determined.",
            "severity": 1
        }

    if bidder.turnover < requirement.min_turnover:
        return {
            "status": "FAIL",
            "evidence": [
                f"Required turnover: {requirement.min_turnover}",
                f"Bidder turnover: {bidder.turnover}"
            ],
            "reason": "Bidder turnover is below the tender requirement.",
            "severity": 2
        }

    if document.turnover is not None:
        if document.turnover != bidder.turnover:
            return {
                "status": "FAIL",
                "evidence": [
                    f"Bidder turnover: {bidder.turnover}",
                    f"Document turnover: {document.turnover}"
                ],
                "reason": "Turnover values do not match.",
                "severity": 2
            }

    return {
        "status": "PASS",
        "evidence": [
            f"Required turnover: {requirement.min_turnover}",
            f"Bidder turnover: {bidder.turnover}"
        ],
        "reason": "Turnover requirement is satisfied.",
        "severity": 2
    }


def check_experience(
    requirement: TenderRequirement,
    bidder: BidderDetails
):

    if requirement.min_experience_years is None:
        return None

    if bidder.experience_years is None:
        return {
            "status": "REVIEW",
            "evidence": [
                "Bidder experience information is unavailable."
            ],
            "reason": "Experience eligibility cannot be determined.",
            "severity": 1
        }

    if bidder.experience_years < requirement.min_experience_years:
        return {
            "status": "FAIL",
            "evidence": [
                f"Required experience: {requirement.min_experience_years} years",
                f"Bidder experience: {bidder.experience_years} years"
            ],
            "reason": "Tender experience requirement is not satisfied.",
            "severity": 2
        }

    return {
        "status": "PASS",
        "evidence": [
            f"Required experience: {requirement.min_experience_years} years",
            f"Bidder experience: {bidder.experience_years} years"
        ],
        "reason": "Experience requirement is satisfied.",
        "severity": 1
    }


def check_eligibility(
    requirement: TenderRequirement,
    document: DocumentField
):

    if not requirement.eligibility_required:
        return None

    if document.eligible is None:
        return {
            "status": "REVIEW",
            "evidence": [
                "Eligibility status is unavailable."
            ],
            "reason": "Eligibility could not be determined from the supplied evidence.",
            "severity": 2
        }

    if document.eligible is False:
        return {
            "status": "FAIL",
            "evidence": [
                "Document eligibility field: false"
            ],
            "reason": "Tender eligibility requirement failed.",
            "severity": 3
        }

    return {
        "status": "PASS",
        "evidence": [
            "Document eligibility field: true"
        ],
        "reason": "Eligibility requirement is satisfied based on supplied evidence.",
        "severity": 3
    }
def check_date_match(
    required_date: str,
    document: DocumentField
):
    if not required_date:
        return None

    if not document.issue_date:
        return {
            "status": "REVIEW",
            "evidence": [
                "Required date is available, but document issue date is missing."
            ],
            "reason": "Date cannot be verified.",
            "severity": 1
        }

    if document.issue_date != required_date:
        return {
            "status": "FAIL",
            "evidence": [
                f"Required date: {required_date}",
                f"Document issue date: {document.issue_date}"
            ],
            "reason": "Date mismatch detected.",
            "severity": 2
        }

    return {
        "status": "PASS",
        "evidence": [
            f"Required date: {required_date}",
            f"Document issue date: {document.issue_date}"
        ],
        "reason": "Dates match.",
        "severity": 1
    }