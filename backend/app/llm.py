from typing import List


def optional_llm_reasoning(
    requirement: str,
    evidence: List[str],
    deterministic_status: str
):
    """
    Optional LLM reasoning layer.

    The LLM must use only the evidence supplied by
    the deterministic rule engine.

    It must never fabricate:
    - government verification
    - documents
    - registration details
    - dates
    - financial values
    """

    if deterministic_status in ["PASS", "FAIL"]:
        return {
            "status": deterministic_status,
            "reason": "Deterministic rule result retained.",
            "evidence": evidence
        }

    # REVIEW cases can optionally be sent to an LLM.
    # The LLM should only explain the existing evidence.

    return {
        "status": "REVIEW",
        "reason": (
            "Evidence is ambiguous or incomplete. "
            "Manual verification is required."
        ),
        "evidence": evidence
    }
