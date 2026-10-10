from .models import ComplianceInput, ComplianceResult

from .rules import (
    check_missing_document,
    check_expiry,
    check_entity_name,
    check_registration,
    check_turnover,
    check_experience,
    check_eligibility,
    check_date_match,
)

from .scorer import (
    calculate_risk,
    confidence_for,
)


class ComplianceEngine:

    def run(self, data: ComplianceInput):

        results = []

        for requirement in data.tender_requirements:

            # -------------------------------------------------
            # 1. Missing document check
            # -------------------------------------------------

            missing = check_missing_document(
                requirement,
                data.documents
            )

            if missing:

                results.append(
                    self._result(
                        "MISSING_DOCUMENT",
                        requirement.requirement,
                        missing
                    )
                )

                continue

            # -------------------------------------------------
            # 2. Document checks
            # -------------------------------------------------

            for required_doc in requirement.required_documents:

                document = next(
                    (
                        d for d in data.documents
                        if d.document_type.lower()
                        == required_doc.lower()
                    ),
                    None
                )

                if document is None:
                    continue

                document_type = document.document_type.lower()

                # -------------------------------------------------
                # Document expiry check
                # -------------------------------------------------

                expiry_result = check_expiry(document)

                if expiry_result:

                    results.append(
                        self._result(
                            "DOC_EXPIRY",
                            requirement.requirement,
                            expiry_result
                        )
                    )

                # -------------------------------------------------
                # Entity name check
                # -------------------------------------------------

                entity_result = check_entity_name(
                    data.bidder,
                    document
                )

                if entity_result:

                    results.append(
                        self._result(
                            "ENTITY_NAME",
                            requirement.requirement,
                            entity_result
                        )
                    )

                # -------------------------------------------------
                # Registration number check
                # -------------------------------------------------

                if "registration" in document_type:

                    registration_result = check_registration(
                        data.bidder,
                        document
                    )

                    if registration_result:

                        results.append(
                            self._result(
                                "REGISTRATION_MATCH",
                                requirement.requirement,
                                registration_result
                            )
                        )

                # -------------------------------------------------
                # Turnover check
                # -------------------------------------------------

                if "turnover" in document_type:

                    turnover_result = check_turnover(
                        requirement,
                        data.bidder,
                        document
                    )

                    if turnover_result:

                        results.append(
                            self._result(
                                "TURNOVER_MATCH",
                                requirement.requirement,
                                turnover_result
                            )
                        )

                # -------------------------------------------------
                # Date check
                # -------------------------------------------------

                if requirement.required_date:

                    date_result = check_date_match(
                        requirement.required_date,
                        document
                    )

                    if date_result:

                        results.append(
                            self._result(
                                "DATE_MATCH",
                                requirement.requirement,
                                date_result
                            )
                        )

            # -------------------------------------------------
            # 3. Tender eligibility check
            # -------------------------------------------------

            if requirement.eligibility_required:

                eligibility_document = next(
                    (
                        d for d in data.documents
                        if "eligibility" in d.document_type.lower()
                    ),
                    None
                )

                if eligibility_document is None:

                    eligibility_result = {
                        "status": "FAIL",
                        "evidence": [
                            "Required eligibility evidence was not provided."
                        ],
                        "reason": (
                            "Tender eligibility could not be satisfied "
                            "because required eligibility evidence is missing."
                        ),
                        "severity": 3
                    }

                    results.append(
                        self._result(
                            "ELIGIBILITY",
                            requirement.requirement,
                            eligibility_result
                        )
                    )

                else:

                    eligibility_result = check_eligibility(
                        requirement,
                        eligibility_document
                    )

                    if eligibility_result:

                        results.append(
                            self._result(
                                "ELIGIBILITY",
                                requirement.requirement,
                                eligibility_result
                            )
                        )

            # -------------------------------------------------
            # 4. Experience check
            # -------------------------------------------------

            experience_result = check_experience(
                requirement,
                data.bidder
            )

            if experience_result:

                results.append(
                    self._result(
                        "EXPERIENCE",
                        requirement.requirement,
                        experience_result
                    )
                )

        return results

    # ---------------------------------------------------------
    # Convert rule result into ComplianceResult
    # ---------------------------------------------------------

    def _result(
        self,
        check_id,
        requirement,
        result
    ):

        status = result["status"]

        evidence = result["evidence"]

        return ComplianceResult(
            check_id=check_id,
            requirement=requirement,
            status=status,
            confidence=confidence_for(
                status,
                len(evidence)
            ),
            evidence=evidence,
            reason=result["reason"],
            risk_points=calculate_risk(
                status,
                result["severity"]
            ),
            recommendation=self._recommendation(
                status
            )
        )

    # ---------------------------------------------------------
    # Recommendation
    # ---------------------------------------------------------

    @staticmethod
    def _recommendation(status):

        if status == "PASS":
            return "No action required."

        if status == "REVIEW":
            return (
                "Manually verify the missing or ambiguous "
                "evidence before making a compliance decision."
            )

        return (
            "Resolve the compliance failure or reject the bidder "
            "for this requirement according to tender rules."
        )