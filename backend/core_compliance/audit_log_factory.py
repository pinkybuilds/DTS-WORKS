
from pydantic import ValidationError

from backend.core_compliance.audit_log_schema import AuditLogSchema
from backend.gateway.exceptions import SchemaValidationError


class AuditLogFactory:
    @staticmethod
    def create_log(raw_data: dict) -> AuditLogSchema:
        """
        Takes raw dictionary input, validates it against the
        AuditLogSchema, and returns a validated AuditLogSchema object.

        All schema validation errors are collected and translated
        into operator-readable messages before being raised as a
        SchemaValidationError.
        """

        try:
            return AuditLogSchema(**raw_data)

        except ValidationError as e:
            validation_issues = []

            for error in e.errors():
                location = error.get("loc", ())
                message = AuditLogFactory._humanise_validation_error(
                    location,
                    error,
                )

                validation_issues.append(
                    {
                        "field": AuditLogFactory._format_field_path(
                            location
                        ),
                        "message": message,
                    }
                )

            operator_messages = [
                issue["message"]
                for issue in validation_issues
            ]

            combined_message = (
                "This receipt needs attention:\n"
                + "\n".join(
                    f"• {message}"
                    for message in operator_messages
                )
            )

            raise SchemaValidationError(
                combined_message,
                extra_context={
                    "validation_issues": validation_issues,
                    "errors": e.errors(),
                },
            )

    @staticmethod
    def _humanise_validation_error(
        location,
        error,
    ) -> str:
        """
        Convert a Pydantic validation error location into a
        direct operator-readable message.
        """

        loc = list(location)

        error_type = error.get("type", "")
        error_message = error.get("msg", "")

        if not loc:
            return (
                "The receipt contains information that needs "
                "attention."
            )

        # -----------------------------------------------------
        # WASTE ITEMS
        # -----------------------------------------------------

        if loc[0] == "waste_items":
            return AuditLogFactory._humanise_waste_error(
                loc,
                error_type,
                error_message,
            )

        # -----------------------------------------------------
        # MOVEMENT
        # -----------------------------------------------------

        if loc[0] == "movement":
            field = loc[1] if len(loc) > 1 else None

            movement_fields = {
                "api_code": "API code",
                "date_time_received": "Date and time received",
                "unique_reference_id": "Unique reference ID",
                "other_references": "Other references",
                "special_handling_requirements": (
                    "Special handling requirements"
                ),
                "hazardous_waste_consignment_code": (
                    "Hazardous waste consignment code"
                ),
                "reason_for_no_consignment_code": (
                    "Reason for no consignment code"
                ),
            }

            if field in movement_fields:
                field_name = movement_fields[field]

                if error_type == "missing":
                    return f"Movement — {field_name} is required."

                if error_type == "string_too_short":
                    return f"Movement — {field_name} is required."

                return (
                    f"Movement — {field_name} is invalid."
                )

        # -----------------------------------------------------
        # CARRIER
        # -----------------------------------------------------

        if loc[0] == "carrier":
            field = loc[1] if len(loc) > 1 else None

            carrier_fields = {
                "registration_number": (
                    "Registration number"
                ),
                "reason_for_no_registration_number": (
                    "Reason for no registration number"
                ),
                "organisation_name": (
                    "Organisation name"
                ),
                "address": "Address",
                "email_address": "Email address",
                "phone_number": "Phone number",
                "vehicle_registration": (
                    "Vehicle registration"
                ),
                "means_of_transport": (
                    "Means of transport"
                ),
            }

            if field in carrier_fields:
                field_name = carrier_fields[field]

                if error_type == "missing":
                    return f"Carrier — {field_name} is required."

                if error_type == "string_too_short":
                    return f"Carrier — {field_name} is required."

                return (
                    f"Carrier — {field_name} is invalid."
                )

            if len(loc) == 1:
                return (
                    "Carrier information needs attention."
                )

        # -----------------------------------------------------
        # BROKER / DEALER
        # -----------------------------------------------------

        if loc[0] == "broker_dealer":
            field = loc[1] if len(loc) > 1 else None

            broker_fields = {
                "organisation_name": (
                    "Organisation name"
                ),
                "address": "Address",
                "email_address": "Email address",
                "phone_number": "Phone number",
                "registration_number": (
                    "Registration number"
                ),
            }

            if field in broker_fields:
                field_name = broker_fields[field]

                if error_type == "missing":
                    return (
                        f"Broker/dealer — "
                        f"{field_name} is required."
                    )

                if error_type == "string_too_short":
                    return (
                        f"Broker/dealer — "
                        f"{field_name} is required."
                    )

                return (
                    f"Broker/dealer — "
                    f"{field_name} is invalid."
                )

        # -----------------------------------------------------
        # RECEIVING SITE
        # -----------------------------------------------------

        if loc[0] == "receiver":
            field = loc[1] if len(loc) > 1 else None

            receiver_fields = {
                "site_name": "Site name",
                "email_address": "Email address",
                "phone_number": "Phone number",
                "authorisation_number": (
                    "Authorisation number"
                ),
                "regulatory_position_statements": (
                    "Regulatory position statements"
                ),
            }

            if field in receiver_fields:
                field_name = receiver_fields[field]

                if error_type == "missing":
                    return (
                        f"Receiving site — "
                        f"{field_name} is required."
                    )

                if error_type == "string_too_short":
                    return (
                        f"Receiving site — "
                        f"{field_name} is required."
                    )

                return (
                    f"Receiving site — "
                    f"{field_name} is invalid."
                )

        # -----------------------------------------------------
        # RECEIPT
        # -----------------------------------------------------

        if loc[0] == "receipt":
            field = loc[1] if len(loc) > 1 else None

            if field == "address":
                if len(loc) > 2:
                    address_field = loc[2]

                    address_fields = {
                        "full_address": "Full address",
                        "postcode": "Postcode",
                    }

                    if address_field in address_fields:
                        field_name = address_fields[
                            address_field
                        ]

                        if (
                            error_type == "missing"
                            or error_type == "string_too_short"
                        ):
                            return (
                                f"Receipt — "
                                f"{field_name} is required."
                            )

                        return (
                            f"Receipt — "
                            f"{field_name} is invalid."
                        )

                return "Receipt — Address is required."

        # -----------------------------------------------------
        # FALLBACK
        # -----------------------------------------------------

        field_path = AuditLogFactory._format_field_path(
            location
        )

        if error_type == "missing":
            return f"{field_path} is required."

        if error_type == "string_too_short":
            return f"{field_path} is required."

        return f"{field_path} is invalid."

    @staticmethod
    def _humanise_waste_error(
        location,
        error_type,
        error_message,
    ) -> str:
        """
        Convert waste-item validation errors into direct
        operator-readable messages.
        """

        if len(location) < 2:
            return "Waste items need attention."

        item_index = location[1]

        if not isinstance(item_index, int):
            return "Waste item information needs attention."

        item_number = item_index + 1

        # -----------------------------------------------------
        # WASTE ITEM FIELD
        # -----------------------------------------------------

        if len(location) == 2:
            return (
                f"Waste item {item_number} "
                f"needs attention."
            )

        field = location[2]

        waste_fields = {
            "ewc_codes": "EWC code",
            "waste_description": "Waste description",
            "physical_form": "Physical form",
            "number_of_containers": "Number of containers",
            "type_of_containers": "Container type",
            "contains_pops": "POPs information",
            "contains_hazardous": (
                "Hazardous waste information"
            ),
            "pops": "POPs information",
            "hazardous": "Hazardous waste information",
            "disposal_or_recovery_codes": (
                "Disposal/recovery information"
            ),
        }

        # -----------------------------------------------------
        # WEIGHT
        # -----------------------------------------------------

        if field == "weight":
            if len(location) > 3:
                weight_field = location[3]

                weight_fields = {
                    "metric": "Weight unit",
                    "amount": "Weight amount",
                    "is_estimate": "Weight estimate status",
                }

                if weight_field in weight_fields:
                    field_name = weight_fields[
                        weight_field
                    ]

                    if (
                        error_type == "missing"
                        or error_type == "float_type"
                        or error_type == "int_type"
                    ):
                        return (
                            f"Waste item {item_number} — "
                            f"{field_name} is required."
                        )

                    if (
                        weight_field == "amount"
                        and error_type
                        in {
                            "greater_than",
                            "greater_than_equal",
                        }
                    ):
                        return (
                            f"Waste item {item_number} — "
                            "Weight amount must be greater "
                            "than zero."
                        )

                    return (
                        f"Waste item {item_number} — "
                        f"{field_name} is invalid."
                    )

            return (
                f"Waste item {item_number} — "
                "Weight is required."
            )

        # -----------------------------------------------------
        # SIMPLE REQUIRED FIELDS
        # -----------------------------------------------------

        if field in waste_fields:
            field_name = waste_fields[field]

            if error_type == "missing":
                return (
                    f"Waste item {item_number} — "
                    f"{field_name} is required."
                )

            if error_type == "string_too_short":
                return (
                    f"Waste item {item_number} — "
                    f"{field_name} is required."
                )

            if error_type == "too_short":
                return (
                    f"Waste item {item_number} — "
                    f"{field_name} is required."
                )

            return (
                f"Waste item {item_number} — "
                f"{field_name} is invalid."
            )

        # -----------------------------------------------------
        # POPs COMPONENTS
        # -----------------------------------------------------

        if field == "pops":
            return (
                f"Waste item {item_number} — "
                "POPs information needs attention."
            )

        # -----------------------------------------------------
        # HAZARDOUS COMPONENTS
        # -----------------------------------------------------

        if field == "hazardous":
            return (
                f"Waste item {item_number} — "
                "Hazardous waste information needs attention."
            )

        # -----------------------------------------------------
        # DISPOSAL / RECOVERY
        # -----------------------------------------------------

        if field == "disposal_or_recovery_codes":
            return (
                f"Waste item {item_number} — "
                "Disposal/recovery information needs attention."
            )

        # -----------------------------------------------------
        # FALLBACK FOR NESTED WASTE FIELDS
        # -----------------------------------------------------

        field_path = AuditLogFactory._format_field_path(
            location
        )

        return (
            f"Waste item {item_number} — "
            f"{field_path} is invalid."
        )

    @staticmethod
    def _format_field_path(location) -> str:
        """
        Convert a Pydantic location tuple into a readable
        field path for debugging/context.
        """

        parts = []

        for part in location:
            if isinstance(part, int):
                parts.append(str(part + 1))
            else:
                parts.append(str(part).replace("_", " "))

        return " — ".join(parts).strip()
