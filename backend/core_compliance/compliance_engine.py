
from typing import List, Optional

from .compliance_result import (
    ComplianceIssue,
    ComplianceResult,
    ComplianceStatus,
)
from .registry_loader import RegistryLoader
from ..authorisation_profile.schema.authorisation_profile import (
    AuthorisationProfile,
)


class ComplianceEngine:
    """
    Evaluates a structured waste movement against the
    application's established compliance checks and,
    where available, the site's authorisation profile.

    Principle:
        Strict detection, soft enforcement.

    The engine identifies objective problems and compliance
    concerns. It does not decide whether an operator is
    legally allowed to proceed.

    Operator-entered waste classification remains the
    operator's responsibility.

    The engine may compare operator declarations against
    authoritative reference data and flag discrepancies
    for review.

    Authorisation profile checks are advisory unless an
    existing hard compliance rule applies.
    """

    def __init__(
        self,
        authorisation_profile: Optional[AuthorisationProfile] = None,
    ):
        self.authorisation_profile = authorisation_profile

    # =========================================================
    # PUBLIC EVALUATION
    # =========================================================

    def evaluate(
        self,
        movement,
    ) -> ComplianceResult:
        """
        Run the complete compliance evaluation.

        Evaluation order:

            1. Confirm a movement exists
            2. Run established compliance checks
            3. Check EWC classification consistency
            4. Check site authorisation scope
            5. Return the resulting compliance status

        The engine does not independently determine the legal
        classification of waste. Where reference data and
        operator declarations disagree, the discrepancy is
        surfaced for operator review.
        """

        issues: List[ComplianceIssue] = []

        if movement is None:
            issues.append(
                ComplianceIssue(
                    code="MOVEMENT_REQUIRED",
                    title="Movement required",
                    message="A waste movement is required.",
                )
            )

            return self._build_result(issues)

        issues.extend(
            self._check_rules(movement)
        )

        issues.extend(
            self._check_ewc_classification(movement)
        )

        issues.extend(
            self._check_authorisation(movement)
        )

        return self._build_result(issues)

    # =========================================================
    # 1. COMPLIANCE RULES
    # =========================================================

    def _check_rules(
        self,
        movement,
    ) -> List[ComplianceIssue]:
        """
        Run the application's established compliance checks.

        Structural validation is expected to have already
        occurred when the movement was created by the
        AuditLogFactory and AuditLogSchema.

        This layer therefore focuses on compliance-related
        conditions that can be evaluated from the structured
        movement.
        """

        issues: List[ComplianceIssue] = []

        issues.extend(
            self._check_consignment_requirements(movement)
        )

        issues.extend(
            self._check_waste_requirements(movement)
        )

        issues.extend(
            self._check_evidence_requirements(movement)
        )

        return issues

    # ---------------------------------------------------------
    # Consignment requirements
    # ---------------------------------------------------------

    def _check_consignment_requirements(
        self,
        movement,
    ) -> List[ComplianceIssue]:
        """
        Check hazardous waste consignment information.
        """

        issues: List[ComplianceIssue] = []

        hazardous_waste_present = any(
            item.contains_hazardous
            for item in movement.waste_items
        )

        if not hazardous_waste_present:
            return issues

        consignment_code = (
            movement.movement.hazardous_waste_consignment_code
        )

        reason = (
            movement.movement.reason_for_no_consignment_code
        )

        if not consignment_code and not reason:
            issues.append(
                ComplianceIssue(
                    code="CONSIGNMENT_INFORMATION_REQUIRED",
                    title="Consignment information required",
                    message=(
                        "A hazardous waste consignment code is "
                        "required, or a reason is required for "
                        "not providing one."
                    ),
                    field=(
                        "movement."
                        "hazardous_waste_consignment_code"
                    ),
                )
            )

        if consignment_code and reason:
            issues.append(
                ComplianceIssue(
                    code="CONSIGNMENT_REASON_NOT_ALLOWED",
                    title="Reason not required",
                    message=(
                        "A reason for no hazardous waste "
                        "consignment code should not be provided "
                        "when a consignment code has been supplied."
                    ),
                    field=(
                        "movement."
                        "reason_for_no_consignment_code"
                    ),
                )
            )

        return issues

    # ---------------------------------------------------------
    # Waste requirements
    # ---------------------------------------------------------

    def _check_waste_requirements(
        self,
        movement,
    ) -> List[ComplianceIssue]:
        """
        Check compliance-related waste information.

        Basic field/type validation belongs to the schema.
        These checks cover information required for the
        compliance workflow.
        """

        issues: List[ComplianceIssue] = []

        for index, item in enumerate(
            movement.waste_items
        ):
            if not item.ewc_codes:
                issues.append(
                    ComplianceIssue(
                        code="EWC_CODE_REQUIRED",
                        title="EWC code required",
                        message=(
                            "An EWC code is required for "
                            "this waste item."
                        ),
                        field=(
                            f"waste_items[{index}].ewc_codes"
                        ),
                    )
                )

            if not item.waste_description:
                issues.append(
                    ComplianceIssue(
                        code="WASTE_DESCRIPTION_REQUIRED",
                        title="Waste description required",
                        message=(
                            "A waste description is required "
                            "for this waste item."
                        ),
                        field=(
                            f"waste_items[{index}]."
                            "waste_description"
                        ),
                    )
                )

        return issues

    # ---------------------------------------------------------
    # Evidence requirements
    # ---------------------------------------------------------

    def _check_evidence_requirements(
        self,
        movement,
    ) -> List[ComplianceIssue]:
        """
        Check whether supporting information has been
        supplied where the movement declares a relevant
        classification.
        """

        issues: List[ComplianceIssue] = []

        for index, item in enumerate(
            movement.waste_items
        ):
            if item.contains_pops and item.pops is None:
                issues.append(
                    ComplianceIssue(
                        code="POPS_EVIDENCE_REQUIRED",
                        title="Evidence required",
                        message=(
                            "Evidence is required for the "
                            "POPs classification of this "
                            "waste item."
                        ),
                        field=(
                            f"waste_items[{index}].pops"
                        ),
                    )
                )

            if (
                item.contains_hazardous
                and item.hazardous is None
            ):
                issues.append(
                    ComplianceIssue(
                        code="HAZARDOUS_EVIDENCE_REQUIRED",
                        title="Evidence required",
                        message=(
                            "Evidence is required for the "
                            "hazardous waste classification "
                            "of this waste item."
                        ),
                        field=(
                            f"waste_items[{index}]."
                            "hazardous"
                        ),
                    )
                )

        return issues

    # =========================================================
    # 2. EWC CLASSIFICATION CONSISTENCY
    # =========================================================

    def _check_ewc_classification(
        self,
        movement,
    ) -> List[ComplianceIssue]:
        """
        Compare the operator's hazardous waste declaration
        against the EWC registry.

        The registry does not override the operator's
        classification.

        Where the registry identifies an EWC as hazardous but
        the operator has declared the item as non-hazardous,
        or vice versa, the engine flags the discrepancy for
        review.

        This is a discrepancy check, not an automatic legal
        classification decision.
        """

        issues: List[ComplianceIssue] = []

        for index, item in enumerate(
            movement.waste_items
        ):
            registry_hazardous_values = []

            for ewc_code in item.ewc_codes:
                entry = RegistryLoader.find_by_code(
                    "ewc",
                    ewc_code,
                )

                if entry is None:
                    continue

                registry_hazardous = entry.get(
                    "isHazardous"
                )

                if isinstance(
                    registry_hazardous,
                    bool,
                ):
                    registry_hazardous_values.append(
                        registry_hazardous
                    )

            if not registry_hazardous_values:
                continue

            registry_says_hazardous = any(
                registry_hazardous_values
            )

            if (
                registry_says_hazardous
                != item.contains_hazardous
            ):
                issues.append(
                    ComplianceIssue(
                        code=(
                            "EWC_HAZARDOUS_CLASSIFICATION_REVIEW"
                        ),
                        title=(
                            "Review hazardous waste classification"
                        ),
                        message=(
                            "The selected EWC code is classified "
                            "as hazardous in the EWC registry, "
                            "but this movement has been marked "
                            "as non-hazardous. Please review the "
                            "waste classification before "
                            "continuing."
                            if registry_says_hazardous
                            else
                            "The selected EWC code is classified "
                            "as non-hazardous in the EWC registry, "
                            "but this movement has been marked "
                            "as hazardous. Please review the "
                            "waste classification before "
                            "continuing."
                        ),
                        field=(
                            f"waste_items[{index}]."
                            "contains_hazardous"
                        ),
                        value=str(
                            item.contains_hazardous
                        ),
                    )
                )

        return issues

    # =========================================================
    # 3. SITE AUTHORISATION
    # =========================================================

    def _check_authorisation(
        self,
        movement,
    ) -> List[ComplianceIssue]:
        """
        Check the movement against the site's authorisation
        profile when one is available.

        Current authorisation-profile checks are advisory
        warnings.

        Quantity limits, authorised operations, and
        conditions/restrictions are not evaluated here yet.
        """

        issues: List[ComplianceIssue] = []

        if self.authorisation_profile is None:
            return issues

        issues.extend(
            self._check_ewc_scope(movement)
        )

        issues.extend(
            self._check_hazardous_scope(movement)
        )

        issues.extend(
            self._check_pop_scope(movement)
        )

        issues.extend(
            self._check_exclusions(movement)
        )

        return issues

    # ---------------------------------------------------------
    # EWC scope
    # ---------------------------------------------------------

    def _check_ewc_scope(
        self,
        movement,
    ) -> List[ComplianceIssue]:
        """
        Check whether declared EWC codes appear within the
        site's configured permitted waste scope.
        """

        issues: List[ComplianceIssue] = []

        permitted_codes = set(
            self.authorisation_profile
            .waste_scope
            .permitted_ewc_codes
        )

        if not permitted_codes:
            return issues

        for index, item in enumerate(
            movement.waste_items
        ):
            for ewc_code in item.ewc_codes:
                if ewc_code not in permitted_codes:
                    issues.append(
                        self._authorisation_warning(
                            code="EWC_NOT_IN_SITE_SCOPE",
                            title="Review site authorisation",
                            message=(
                                "This doesn't look like it's "
                                "permitted on your site. "
                                "Please review before submitting."
                            ),
                            field=(
                                f"waste_items[{index}]."
                                "ewc_codes"
                            ),
                            value=ewc_code,
                        )
                    )

        return issues

    # ---------------------------------------------------------
    # Hazardous waste scope
    # ---------------------------------------------------------

    def _check_hazardous_scope(
        self,
        movement,
    ) -> List[ComplianceIssue]:
        """
        Check whether the site's authorisation profile
        permits hazardous waste.
        """

        issues: List[ComplianceIssue] = []

        hazardous_present = any(
            item.contains_hazardous
            for item in movement.waste_items
        )

        if (
            hazardous_present
            and not self.authorisation_profile
            .waste_scope
            .hazardous_waste_permitted
        ):
            issues.append(
                self._authorisation_warning(
                    code="HAZARDOUS_WASTE_SITE_SCOPE",
                    title="Review site authorisation",
                    message=(
                        "This doesn't look like it's "
                        "permitted on your site. "
                        "Please review before submitting."
                    ),
                    field="waste_items",
                )
            )

        return issues

    # ---------------------------------------------------------
    # POP scope
    # ---------------------------------------------------------

    def _check_pop_scope(
        self,
        movement,
    ) -> List[ComplianceIssue]:
        """
        Check whether the site's authorisation profile
        permits POP waste.
        """

        issues: List[ComplianceIssue] = []

        pops_present = any(
            item.contains_pops
            for item in movement.waste_items
        )

        if (
            pops_present
            and not self.authorisation_profile
            .waste_scope
            .pop_waste_permitted
        ):
            issues.append(
                self._authorisation_warning(
                    code="POP_WASTE_SITE_SCOPE",
                    title="Review site authorisation",
                    message=(
                        "This doesn't look like it's "
                        "permitted on your site. "
                        "Please review before submitting."
                    ),
                    field="waste_items",
                )
            )

        return issues

    # ---------------------------------------------------------
    # Authorisation exclusions
    # ---------------------------------------------------------

    def _check_exclusions(
        self,
        movement,
    ) -> List[ComplianceIssue]:
        """
        Check whether declared EWC codes appear in the
        site's explicit exclusion list.
        """

        issues: List[ComplianceIssue] = []

        excluded_codes = set(
            self.authorisation_profile
            .exclusions
            .excluded_ewc_codes
        )

        for index, item in enumerate(
            movement.waste_items
        ):
            for ewc_code in item.ewc_codes:
                if ewc_code in excluded_codes:
                    issues.append(
                        self._authorisation_warning(
                            code="WASTE_MATCHES_SITE_EXCLUSION",
                            title="Review site authorisation",
                            message=(
                                "This waste appears to match "
                                "an exclusion in your site "
                                "authorisation. Please review "
                                "before submitting."
                            ),
                            field=(
                                f"waste_items[{index}]."
                                "ewc_codes"
                            ),
                            value=ewc_code,
                        )
                    )

        return issues

    # =========================================================
    # RESULT
    # =========================================================

    @staticmethod
    def _build_result(
        issues: List[ComplianceIssue],
    ) -> ComplianceResult:
        """
        Convert compliance findings into the public
        compliance result.

        No issues:
            PASS

        One or more issues:
            WARNING
        """

        if not issues:
            return ComplianceResult(
                status=ComplianceStatus.PASS,
                issues=[],
            )

        return ComplianceResult(
            status=ComplianceStatus.WARNING,
            issues=issues,
        )

    # =========================================================
    # AUTHORISATION WARNING FACTORY
    # =========================================================

    @staticmethod
    def _authorisation_warning(
        code: str,
        title: str,
        message: str,
        field: Optional[str] = None,
        value: Optional[str] = None,
    ) -> ComplianceIssue:
        """
        Create a standard authorisation-related warning.
        """

        return ComplianceIssue(
            code=code,
            title=title,
            message=message,
            field=field,
            value=value,
        )





