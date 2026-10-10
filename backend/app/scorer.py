def calculate_risk(status: str, severity: int = 1) -> int:
    """
    Deterministic risk scoring.

    PASS   = 0 points
    REVIEW = 5 x severity
    FAIL   = 10 x severity
    """

    if status == "PASS":
        return 0

    if status == "REVIEW":
        return 5 * severity

    if status == "FAIL":
        return 10 * severity

    raise ValueError("Invalid status")


def confidence_for(status: str, evidence_count: int) -> float:
    """
    Deterministic confidence calculation.
    """

    if evidence_count == 0:
        return 0.0

    base = {
        "PASS": 0.95,
        "REVIEW": 0.70,
        "FAIL": 0.95
    }[status]

    return min(base, 0.50 + evidence_count * 0.15)