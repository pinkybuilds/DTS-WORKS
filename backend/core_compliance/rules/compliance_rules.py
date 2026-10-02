
# backend/core_compliance/rules/compliance_rules.py

MOVEMENT_RULES = {
    "api_code": {"required": True, "format": "uuid"},
    "date_time_received": {"required": True, "format": "iso_8601_datetime"},
    "hazardous_waste_consignment_code": {
        "required_when": "any_ewc_is_hazardous",
        "format": "XXXXXX/YYYYY",
    },
    "reason_for_no_consignment_code": {
        "required_when": (
            "any_ewc_is_hazardous"
            " and hazardous_waste_consignment_code_missing"
        ),
        "allowed_values": [
            "NON_HAZ_WASTE_TRANSFER",
            "NO_DOC_WITH_WASTE",
            "HWRC_RECEIPT",
        ],
        "case_sensitive": True,
    },
    "unique_reference_id": {"required": False},
    "other_references": {
        "required": False,
        "items": {
            "label": {"required": True, "min_length": 1},
            "reference": {"required": True, "min_length": 1},
        },
    },
    "special_handling_requirements": {
        "required": False,
        "max_length": 5000,
    },
}


WASTE_ITEMS = {
    "required": True,
    "min_items": 1,
}


WASTE_ITEM_RULES = {
    "ewc_codes": {
        "required": True,
        "min_items": 1,
        "max_items": 5,
        "format": "6_digits",
        "registry": "ewc",
    },
    "waste_description": {
        "required": True,
        "min_length": 1,
    },
    "physical_form": {
        "required": True,
        "allowed_values": [
            "Gas",
            "Liquid",
            "Solid",
            "Powder",
            "Sludge",
            "Mixed",
        ],
        "case_sensitive": True,
    },
    "number_of_containers": {
        "required": True,
        "type": "integer",
        "minimum": 0,
    },
    "type_of_containers": {
        "required": True,
        "registry": "container_types",
        "case_sensitive": True,
    },
    "weight": {
        "required": True,
        "metric": {
            "required": True,
            "allowed_values": [
                "Grams",
                "Kilograms",
                "Tonnes",
            ],
            "case_sensitive": True,
        },
        "amount": {
            "required": True,
            "type": "number",
            "exclusive_minimum": 0,
        },
        "is_estimate": {
            "required": True,
            "type": "boolean",
        },
    },
}


POPS_RULES = {
    "contains_pops": {
        "required": True,
        "type": "boolean",
    },
    "pops": {
        "required_when": "contains_pops == true",
        "source_of_components": {
            "required": True,
            "allowed_values": [
                "NOT_PROVIDED",
                "PROVIDED_WITH_WASTE",
                "GUIDANCE",
                "OWN_TESTING",
            ],
            "case_sensitive": True,
        },
        "components": {
            "conditions": {
                "NOT_PROVIDED": {
                    "required": False,
                    "allow_empty": True,
                },
                "PROVIDED_WITH_WASTE": {
                    "required": False,
                    "allow_empty": True,
                    "empty_result": "WARNING",
                },
                "GUIDANCE": {
                    "required": True,
                    "allow_empty": False,
                    "empty_result": "ERROR",
                },
                "OWN_TESTING": {
                    "required": True,
                    "allow_empty": False,
                    "empty_result": "ERROR",
                },
            },
            "item": {
                "code": {
                    "required": True,
                    "registry": "pops",
                    "case_sensitive": True,
                },
                "concentration": {
                    "required": False,
                    "type": "number",
                    "exclusive_minimum": 0,
                },
            },
        },
    },
}


HAZARDOUS_RULES = {
    "contains_hazardous": {
        "required": True,
        "type": "boolean",
    },
    "hazardous": {
        "required_when": "contains_hazardous == true",
        "source_of_components": {
            "required": True,
            "allowed_values": [
                "NOT_PROVIDED",
                "PROVIDED_WITH_WASTE",
                "GUIDANCE",
                "OWN_TESTING",
            ],
            "case_sensitive": True,
        },
        "haz_codes": {
            "required": True,
            "registry": "hazardous_properties",
            "case_sensitive": True,
        },
        "components": {
            "conditions": {
                "NOT_PROVIDED": {
                    "required": False,
                    "allow_empty": True,
                },
                "PROVIDED_WITH_WASTE": {
                    "required": False,
                    "allow_empty": True,
                    "empty_result": "WARNING",
                },
                "GUIDANCE": {
                    "required": True,
                    "allow_empty": False,
                    "empty_result": "ERROR",
                },
                "OWN_TESTING": {
                    "required": True,
                    "allow_empty": False,
                    "empty_result": "ERROR",
                },
            },
            "item": {
    "name": {
        "required": False,
    },
    "concentration": {
        "required": False,
        "type": "number",
        "exclusive_minimum": 0,
    },
},
                },
            },
        },



DISPOSAL_OR_RECOVERY_RULES = {
    "disposal_or_recovery_codes": {
        "required": False,
        "item": {
            "code": {
                "required": True,
                "registry": "disposal_recovery",
                "case_sensitive": True,
            },
            "weight": {
                "required": True,
                "metric": {
                    "required": True,
                    "allowed_values": [
                        "Grams",
                        "Kilograms",
                        "Tonnes",
                    ],
                    "case_sensitive": True,
                },
                "amount": {
                    "required": True,
                    "type": "number",
                    "exclusive_minimum": 0,
                },
                "is_estimate": {
                    "required": True,
                    "type": "boolean",
                },
            },
        },
    },
}


CARRIER_RULES = {
    "registration_number": {
        "required": False,
        "nullable": True,
        "format_by_jurisdiction": True,
    },
    "reason_for_no_registration_number": {
        "required_when": (
            "registration_number is null "
            "or registration_number is empty"
        ),
        "allowed_values": [
            "ON_SITE",
            "HOUSEHOLD",
            "ONE_OFF",
            "MARINE",
        ],
        "case_sensitive": True,
        "forbidden_when": (
            "registration_number is provided"
        ),
    },
    "organisation_name": {
        "required": True,
        "min_length": 1,
    },
    "address": {
        "required": False,
        "postcode": {
            "required": True,
        },
    },
    "email_address": {
        "required": False,
        "format": "email",
    },
    "phone_number": {
        "required": False,
        "format": "phone",
    },
    "vehicle_registration": {
        "required_when": "means_of_transport == Road",
        "forbidden_when": "means_of_transport != Road",
        "max_length": 10,
    },
    "means_of_transport": {
        "required": True,
        "allowed_values": [
            "Road",
            "Rail",
            "Air",
            "Sea",
            "Inland Waterway",
            "Piped",
            "Other",
        ],
        "case_sensitive": True,
    },
}


BROKER_OR_DEALER_RULES = {
    "required": False,
}


BROKER_DEALER_RULES = {
    "organisation_name": {
        "required": True,
        "min_length": 1,
    },
    "address": {
        "required": False,
        "postcode": {
            "required": True,
        },
    },
    "email_address": {
        "required": False,
        "format": "email",
    },
    "phone_number": {
        "required": False,
        "format": "phone",
    },
    "registration_number": {
        "required": False,
        "format_by_jurisdiction": True,
    },
}


RECEIVER_RULES = {
    "site_name": {
        "required": True,
        "min_length": 1,
    },
    "email_address": {
        "required": False,
        "format": "email",
    },
    "phone_number": {
        "required": False,
        "format": "phone",
    },
    "authorisation_number": {
        "required": True,
        "format": "valid_uk_authorisation_number",
        "case_sensitive": False,
        "error": (
            "Site authorisation number must be in a valid UK format"
        ),
        
    },
    "regulatory_position_statements": {
        "required": False,
        "items": {
            "type": "integer",
            "minimum": 1,
        },
    },
}


RECEIPT_RULES = {
    "required": True,
    "address": {
        "required": True,
        "full_address": {
            "required": True,
            "min_length": 1,
        },
        "postcode": {
            "required": True,
            "format": "uk_postcode",
        },
    },
}


AUTHORISATION_RULES = {
    "authorisation_profile": {
        "required": True,
    },
    "ewc_scope": {
        "check": True,
        "condition": "movement_ewc_must_be_authorised",
        "outcomes": {
            "authorised": "PASS",
            "not_authorised": "WARNING",
            "unclear": "WARNING",
        },
        "warning_code": "EWC_NOT_IN_SITE_SCOPE",
        "warning_message": (
            "This waste does not appear to be within the "
            "authorised EWC scope for this site. Please "
            "review the site's permit before proceeding."
        ),
    },
    "hazardous_waste": {
        "check": True,
        "condition": "hazardous_waste_must_be_authorised",
        "outcomes": {
            "authorised": "PASS",
            "not_authorised": "WARNING",
            "unclear": "WARNING",
        },
        "warning_code": "HAZARDOUS_WASTE_SITE_SCOPE",
        "warning_message": (
            "This movement contains hazardous waste, but "
            "the site's authorisation does not appear to "
            "cover it. Please review the site's permit "
            "before proceeding."
        ),
    },
    "pop_waste": {
        "check": True,
        "condition": "pop_waste_must_be_authorised",
        "outcomes": {
            "authorised": "PASS",
            "not_authorised": "WARNING",
            "unclear": "WARNING",
        },
        "warning_code": "POP_WASTE_SITE_SCOPE",
        "warning_message": (
            "This movement contains POP waste, but the "
            "site's authorisation does not appear to cover "
            "it. Please review the site's permit before "
            "proceeding."
        ),
    },
    "operations": {
        "check": True,
        "condition": "required_operation_must_be_authorised",
        "outcomes": {
            "authorised": "PASS",
            "not_authorised": "WARNING",
            "unclear": "WARNING",
        },
        "warning_code": "OPERATION_NOT_IN_SITE_SCOPE",
        "warning_message": (
            "The required waste operation does not appear "
            "to be authorised at this site. Please review "
            "the permit conditions before proceeding."
        ),
    },
    "quantity_limits": {
        "check": True,
        "condition": (
            "movement_quantity_must_not_exceed_authorised_limit"
        ),
        "outcomes": {
            "within_limit": "PASS",
            "exceeds_limit": "WARNING",
            "unclear": "WARNING",
        },
        "warning_code": "QUANTITY_LIMIT_EXCEEDED",
        "warning_message": (
            "This movement appears to exceed an authorised "
            "quantity limit. Please review the permit "
            "conditions before proceeding."
        ),
    },
    "exclusions": {
        "check": True,
        "condition": (
            "movement_must_not_match_authorisation_exclusion"
        ),
        "outcomes": {
            "not_excluded": "PASS",
            "excluded": "WARNING",
            "unclear": "WARNING",
        },
        "warning_code": "WASTE_MATCHES_SITE_EXCLUSION",
        "warning_message": (
            "This waste appears to match an exclusion in "
            "the site's authorisation. Please review the "
            "permit before proceeding."
        ),
    },
    "conditions_and_restrictions": {
        "check": True,
        "condition": (
            "authorisation_conditions_must_be_satisfied"
        ),
        "outcomes": {
            "satisfied": "PASS",
            "not_satisfied": "WARNING",
            "requires_review": "WARNING",
            "unclear": "WARNING",
        },
        "warning_code": "AUTHORISATION_CONDITION_REVIEW",
        "warning_message": (
            "This movement may be affected by a condition "
            "or restriction in the site's authorisation. "
            "Please review the permit conditions before "
            "proceeding."
        ),
    },
}



