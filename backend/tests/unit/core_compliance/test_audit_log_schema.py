
import unittest

from pydantic import ValidationError

from backend.core_compliance.audit_log_schema import AuditLogSchema


class TestAuditLogSchema(unittest.TestCase):

    def setUp(self):
        self.valid_data = {
            "movement": {
                "api_code": "550e8400-e29b-41d4-a716-446655440000",
                "date_time_received": "2026-09-05T10:00:00+01:00",
                "unique_reference_id": "MOVE-001",
                "other_references": [
                    {
                        "label": "Customer Reference",
                        "reference": "CUST-123",
                    }
                ],
                "special_handling_requirements": "Handle with care.",
                "hazardous_waste_consignment_code": None,
                "reason_for_no_consignment_code": "NON_HAZ_WASTE_TRANSFER",
            },
            "waste_items": [
                {
                    "ewc_codes": ["010101"],
                    "waste_description": "Metal waste",
                    "physical_form": "Solid",
                    "number_of_containers": 2,
                    "type_of_containers": "BAG",
                    "weight": {
                        "metric": "Kilograms",
                        "amount": 100.0,
                        "is_estimate": False,
                    },
                    "contains_pops": False,
                    "pops": None,
                    "contains_hazardous": False,
                    "hazardous": None,
                    "disposal_or_recovery_codes": None,
                }
            ],
            "carrier": {
                "registration_number": "CBDU123456",
                "reason_for_no_registration_number": None,
                "organisation_name": "Test Carrier Ltd",
                "address": {
                    "full_address": "1 Test Street, London",
                    "postcode": "SW1A 1AA",
                },
                "email_address": "carrier@example.com",
                "phone_number": "02012345678",
                "vehicle_registration": "AB12 CDE",
                "means_of_transport": "Road",
            },
            "broker": None,
            "receiver": {
                "site_name": "Test Waste Site",
                "email_address": "receiver@example.com",
                "phone_number": "02087654321",
                "authorisation_number": "EPR/AB1234CD",
                "regulatory_position_statements": None,
            },
            "receipt": {
                "address": {
                    "full_address": "1 Test Waste Road, London",
                    "postcode": "SW1A 1AA",
                }
            },
        }

    # ==========================================================
    # MOVEMENT - VALID TESTS
    # ==========================================================

    def test_movement_required_fields_pass(self):
        movement = {
            "api_code": self.valid_data["movement"]["api_code"],
            "date_time_received": self.valid_data["movement"]["date_time_received"],
        }

        valid_data = {
            **self.valid_data,
            "movement": movement,
        }

    # ==========================================================
    # WASTE ITEM - REMAINING VALID TESTS
    # ==========================================================

    def test_waste_item_with_multiple_ewc_codes_passes(self):
        waste_item = {
            **self.valid_data["waste_items"][0],
            "ewc_codes": [
                "010101",
                "010102",
            ],
        }

        valid_data = {
            **self.valid_data,
            "waste_items": [waste_item],
        }

        AuditLogSchema(**valid_data)

    def test_waste_item_with_different_physical_form_passes(self):
        waste_item = {
            **self.valid_data["waste_items"][0],
            "physical_form": "Liquid",
        }

        valid_data = {
            **self.valid_data,
            "waste_items": [waste_item],
        }

        AuditLogSchema(**valid_data)

    def test_waste_item_with_multiple_containers_passes(self):
        waste_item = {
            **self.valid_data["waste_items"][0],
            "number_of_containers": 10,
        }

        valid_data = {
            **self.valid_data,
            "waste_items": [waste_item],
        }

        AuditLogSchema(**valid_data)

    def test_waste_item_with_hazardous_pops_and_recovery_data_passes(self):
        waste_item = {
            **self.valid_data["waste_items"][0],
            "contains_pops": True,
            "pops": {
                "source_of_components": "PROVIDED_WITH_WASTE",
                "components": [
                    {
                        "code": "PCB",
                        "concentration": 10.0,
                    }
                ],
            },
            "contains_hazardous": True,
            "hazardous": {
                "source_of_components": "PROVIDED_WITH_WASTE",
                "haz_codes": ["HP_1"],
                "components": [
                    {
                        "name": "Test hazardous component",
                        "concentration": 10.0,
                    }
                ],
            },
            "disposal_or_recovery_codes": [
                {
                    "code": "R1",
                    "weight": {
                        "metric": "Kilograms",
                        "amount": 100.0,
                        "is_estimate": False,
                    },
                }
            ],
        }

        valid_data = {
            **self.valid_data,
            "waste_items": [waste_item],
        }

        AuditLogSchema(**valid_data)

    # ==========================================================
    # WASTE ITEM - INVALID TESTS
    # ==========================================================

    def test_waste_item_without_ewc_codes_fails(self):
        waste_item = {
            **self.valid_data["waste_items"][0],
            "ewc_codes": [],
        }

        invalid_data = {
            **self.valid_data,
            "waste_items": [waste_item],
        }

        with self.assertRaises(ValidationError):
            AuditLogSchema(**invalid_data)

    def test_waste_item_with_more_than_five_ewc_codes_fails(self):
        waste_item = {
            **self.valid_data["waste_items"][0],
            "ewc_codes": [
                "010101",
                "010102",
                "010103",
                "010104",
                "010105",
                "010106",
            ],
        }

        invalid_data = {
            **self.valid_data,
            "waste_items": [waste_item],
        }

        with self.assertRaises(ValidationError):
            AuditLogSchema(**invalid_data)

    def test_waste_item_without_waste_description_fails(self):
        waste_item = {
            **self.valid_data["waste_items"][0],
            "waste_description": "",
        }

        invalid_data = {
            **self.valid_data,
            "waste_items": [waste_item],
        }

        with self.assertRaises(ValidationError):
            AuditLogSchema(**invalid_data)

    def test_waste_item_with_zero_weight_fails(self):
        waste_item = {
            **self.valid_data["waste_items"][0],
            "weight": {
                "metric": "Kilograms",
                "amount": 0,
                "is_estimate": False,
            },
        }

        invalid_data = {
            **self.valid_data,
            "waste_items": [waste_item],
        }

        with self.assertRaises(ValidationError):
            AuditLogSchema(**invalid_data)

    def test_waste_item_with_invalid_physical_form_fails(self):
        waste_item = {
            **self.valid_data["waste_items"][0],
            "physical_form": "UnknownForm",
        }

        invalid_data = {
            **self.valid_data,
            "waste_items": [waste_item],
        }

        with self.assertRaises(ValidationError):
            AuditLogSchema(**invalid_data)


    # ==========================================================
    # OTHER REFERENCE - VALID
    # ==========================================================

    def test_other_reference_with_valid_fields_passes(self):
        movement = {
            **self.valid_data["movement"],
            "other_references": [
                {
                    "label": "Customer Reference",
                    "reference": "CUSTOMER-001",
                }
            ],
        }

        valid_data = {
            **self.valid_data,
            "movement": movement,
        }

        AuditLogSchema(**valid_data)

    def test_other_reference_with_multiple_references_passes(self):
        movement = {
            **self.valid_data["movement"],
            "other_references": [
                {
                    "label": "Customer Reference",
                    "reference": "CUSTOMER-001",
                },
                {
                    "label": "Internal Reference",
                    "reference": "INTERNAL-001",
                },
            ],
        }

        valid_data = {
            **self.valid_data,
            "movement": movement,
        }

        AuditLogSchema(**valid_data)

    # ==========================================================
    # OTHER REFERENCE - INVALID
    # ==========================================================

    def test_other_reference_without_label_fails(self):
        movement = {
            **self.valid_data["movement"],
            "other_references": [
                {
                    "reference": "CUSTOMER-001",
                }
            ],
        }

        invalid_data = {
            **self.valid_data,
            "movement": movement,
        }

        with self.assertRaises(ValidationError):
            AuditLogSchema(**invalid_data)

    def test_other_reference_without_reference_fails(self):
        movement = {
            **self.valid_data["movement"],
            "other_references": [
                {
                    "label": "Customer Reference",
                }
            ],
        }

        invalid_data = {
            **self.valid_data,
            "movement": movement,
        }

        with self.assertRaises(ValidationError):
            AuditLogSchema(**invalid_data)

    # ==========================================================
    # WEIGHT - VALID
    # ==========================================================

    def test_weight_in_grams_passes(self):
        waste_item = {
            **self.valid_data["waste_items"][0],
            "weight": {
                "metric": "Grams",
                "amount": 500.0,
                "is_estimate": False,
            },
        }

        valid_data = {
            **self.valid_data,
            "waste_items": [waste_item],
        }

        AuditLogSchema(**valid_data)

    def test_weight_in_tonnes_as_estimate_passes(self):
        waste_item = {
            **self.valid_data["waste_items"][0],
            "weight": {
                "metric": "Tonnes",
                "amount": 2.5,
                "is_estimate": True,
            },
        }

        valid_data = {
            **self.valid_data,
            "waste_items": [waste_item],
        }

        AuditLogSchema(**valid_data)

    # ==========================================================
    # WEIGHT - INVALID
    # ==========================================================

    def test_weight_with_zero_amount_fails(self):
        waste_item = {
            **self.valid_data["waste_items"][0],
            "weight": {
                "metric": "Kilograms",
                "amount": 0,
                "is_estimate": False,
            },
        }

        invalid_data = {
            **self.valid_data,
            "waste_items": [waste_item],
        }

        with self.assertRaises(ValidationError):
            AuditLogSchema(**invalid_data)

    def test_weight_with_negative_amount_fails(self):
        waste_item = {
            **self.valid_data["waste_items"][0],
            "weight": {
                "metric": "Kilograms",
                "amount": -10,
                "is_estimate": False,
            },
        }

        invalid_data = {
            **self.valid_data,
            "waste_items": [waste_item],
        }

        with self.assertRaises(ValidationError):
            AuditLogSchema(**invalid_data)

    # ==========================================================
    # POPS - VALID
    # ==========================================================

    def test_pops_with_valid_component_passes(self):
        waste_item = {
            **self.valid_data["waste_items"][0],
            "contains_pops": True,
            "pops": {
                "source_of_components": "PROVIDED_WITH_WASTE",
                "components": [
                    {
                        "code": "PCB",
                        "concentration": 10.0,
                    }
                ],
            },
        }

        valid_data = {
            **self.valid_data,
            "waste_items": [waste_item],
        }

        AuditLogSchema(**valid_data)

    def test_pops_with_guidance_source_passes(self):
        waste_item = {
            **self.valid_data["waste_items"][0],
            "contains_pops": True,
            "pops": {
                "source_of_components": "GUIDANCE",
                "components": [
                    {
                        "code": "PFOS",
                        "concentration": 5.0,
                    }
                ],
            },
        }

        valid_data = {
            **self.valid_data,
            "waste_items": [waste_item],
        }

        AuditLogSchema(**valid_data)

    # ==========================================================
    # POPS - INVALID
    # ==========================================================

    def test_pops_component_without_code_fails(self):
        waste_item = {
            **self.valid_data["waste_items"][0],
            "contains_pops": True,
            "pops": {
                "source_of_components": "PROVIDED_WITH_WASTE",
                "components": [
                    {
                        "concentration": 10.0,
                    }
                ],
            },
        }

        invalid_data = {
            **self.valid_data,
            "waste_items": [waste_item],
        }

        with self.assertRaises(ValidationError):
            AuditLogSchema(**invalid_data)

    def test_pops_component_with_zero_concentration_fails(self):
        waste_item = {
            **self.valid_data["waste_items"][0],
            "contains_pops": True,
            "pops": {
                "source_of_components": "PROVIDED_WITH_WASTE",
                "components": [
                    {
                        "code": "PCB",
                        "concentration": 0,
                    }
                ],
            },
        }

        invalid_data = {
            **self.valid_data,
            "waste_items": [waste_item],
        }

        with self.assertRaises(ValidationError):
            AuditLogSchema(**invalid_data)

    # ==========================================================
    # HAZARDOUS WASTE - VALID
    # ==========================================================

    def test_hazardous_waste_with_valid_data_passes(self):
        waste_item = {
            **self.valid_data["waste_items"][0],
            "contains_hazardous": True,
            "hazardous": {
                "source_of_components": "PROVIDED_WITH_WASTE",
                "haz_codes": ["HP_1"],
                "components": [
                    {
                        "name": "Test hazardous component",
                        "concentration": 10.0,
                    }
                ],
            },
        }

        valid_data = {
            **self.valid_data,
            "waste_items": [waste_item],
        }

        AuditLogSchema(**valid_data)

    def test_hazardous_waste_with_multiple_hazard_codes_passes(self):
        waste_item = {
            **self.valid_data["waste_items"][0],
            "contains_hazardous": True,
            "hazardous": {
                "source_of_components": "GUIDANCE",
                "haz_codes": [
                    "HP_1",
                    "HP_3",
                ],
                "components": [
                    {
                        "name": "Hazardous component",
                        "concentration": 15.0,
                    }
                ],
            },
        }

        valid_data = {
            **self.valid_data,
            "waste_items": [waste_item],
        }

        AuditLogSchema(**valid_data)

    # ==========================================================
    # HAZARDOUS WASTE - INVALID
    # ==========================================================

    def test_hazardous_waste_without_hazard_codes_fails(self):
        waste_item = {
            **self.valid_data["waste_items"][0],
            "contains_hazardous": True,
            "hazardous": {
                "source_of_components": "PROVIDED_WITH_WASTE",
                "haz_codes": [],
                "components": None,
            },
        }

        invalid_data = {
            **self.valid_data,
            "waste_items": [waste_item],
        }

        with self.assertRaises(ValidationError):
            AuditLogSchema(**invalid_data)

    def test_hazardous_component_with_zero_concentration_fails(self):
        waste_item = {
            **self.valid_data["waste_items"][0],
            "contains_hazardous": True,
            "hazardous": {
                "source_of_components": "PROVIDED_WITH_WASTE",
                "haz_codes": ["HP_1"],
                "components": [
                    {
                        "name": "Hazardous component",
                        "concentration": 0,
                    }
                ],
            },
        }

        invalid_data = {
            **self.valid_data,
            "waste_items": [waste_item],
        }

        with self.assertRaises(ValidationError):
            AuditLogSchema(**invalid_data)

    # ==========================================================
    # DISPOSAL / RECOVERY CODE - VALID
    # ==========================================================

    def test_disposal_recovery_code_with_valid_weight_passes(self):
        waste_item = {
            **self.valid_data["waste_items"][0],
            "disposal_or_recovery_codes": [
                {
                    "code": "R1",
                    "weight": {
                        "metric": "Kilograms",
                        "amount": 100.0,
                        "is_estimate": False,
                    },
                }
            ],
        }

        valid_data = {
            **self.valid_data,
            "waste_items": [waste_item],
        }

        AuditLogSchema(**valid_data)

    def test_multiple_disposal_recovery_codes_pass(self):
        waste_item = {
            **self.valid_data["waste_items"][0],
            "disposal_or_recovery_codes": [
                {
                    "code": "R1",
                    "weight": {
                        "metric": "Kilograms",
                        "amount": 100.0,
                        "is_estimate": False,
                    },
                },
                {
                    "code": "R3",
                    "weight": {
                        "metric": "Kilograms",
                        "amount": 50.0,
                        "is_estimate": True,
                    },
                },
            ],
        }

        valid_data = {
            **self.valid_data,
            "waste_items": [waste_item],
        }

        AuditLogSchema(**valid_data)

    # ==========================================================
    # DISPOSAL / RECOVERY CODE - INVALID
    # ==========================================================

    def test_disposal_recovery_code_without_code_fails(self):
        waste_item = {
            **self.valid_data["waste_items"][0],
            "disposal_or_recovery_codes": [
                {
                    "weight": {
                        "metric": "Kilograms",
                        "amount": 100.0,
                        "is_estimate": False,
                    },
                }
            ],
        }

        invalid_data = {
            **self.valid_data,
            "waste_items": [waste_item],
        }

        with self.assertRaises(ValidationError):
            AuditLogSchema(**invalid_data)

    def test_disposal_recovery_code_with_zero_weight_fails(self):
        waste_item = {
            **self.valid_data["waste_items"][0],
            "disposal_or_recovery_codes": [
                {
                    "code": "R1",
                    "weight": {
                        "metric": "Kilograms",
                        "amount": 0,
                        "is_estimate": False,
                    },
                }
            ],
        }

        invalid_data = {
            **self.valid_data,
            "waste_items": [waste_item],
        }

        with self.assertRaises(ValidationError):
            AuditLogSchema(**invalid_data)


        

    def test_movement_with_unique_reference_id_passes(self):
        movement = {
            **self.valid_data["movement"],
            "unique_reference_id": "MOVE-12345",
        }

        valid_data = {
            **self.valid_data,
            "movement": movement,
        }

        AuditLogSchema(**valid_data)

    def test_movement_with_other_references_passes(self):
        movement = {
            **self.valid_data["movement"],
            "other_references": [
                {
                    "label": "Customer Reference",
                    "reference": "CUSTOMER-001",
                },
                {
                    "label": "Internal Reference",
                    "reference": "INTERNAL-001",
                },
            ],
        }

        valid_data = {
            **self.valid_data,
            "movement": movement,
        }

        AuditLogSchema(**valid_data)

    def test_movement_with_special_handling_requirements_passes(self):
        movement = {
            **self.valid_data["movement"],
            "special_handling_requirements": "Keep container sealed.",
        }

        valid_data = {
            **self.valid_data,
            "movement": movement,
        }

        AuditLogSchema(**valid_data)

    def test_movement_with_no_consignment_reason_passes(self):
        movement = {
            **self.valid_data["movement"],
            "hazardous_waste_consignment_code": None,
            "reason_for_no_consignment_code": "NON_HAZ_WASTE_TRANSFER",
        }

        valid_data = {
            **self.valid_data,
            "movement": movement,
        }

        AuditLogSchema(**valid_data)

    # ==========================================================
    # MOVEMENT - INVALID TESTS
    # ==========================================================

    def test_movement_with_invalid_api_code_fails(self):
        movement = {
            **self.valid_data["movement"],
            "api_code": "not-a-uuid",
        }

        invalid_data = {
            **self.valid_data,
            "movement": movement,
        }

        with self.assertRaises(ValidationError):
            AuditLogSchema(**invalid_data)

    def test_movement_without_date_time_received_fails(self):
        movement = {
            **self.valid_data["movement"],
        }

        movement.pop("date_time_received")

        invalid_data = {
            **self.valid_data,
            "movement": movement,
        }

        with self.assertRaises(ValidationError):
            AuditLogSchema(**invalid_data)

    def test_movement_with_invalid_date_time_received_fails(self):
        movement = {
            **self.valid_data["movement"],
            "date_time_received": "not-a-valid-datetime",
        }

        invalid_data = {
            **self.valid_data,
            "movement": movement,
        }

        with self.assertRaises(ValidationError):
            AuditLogSchema(**invalid_data)

    def test_movement_with_special_handling_over_5000_characters_fails(self):
        movement = {
            **self.valid_data["movement"],
            "special_handling_requirements": "x" * 5001,
        }

        invalid_data = {
            **self.valid_data,
            "movement": movement,
        }

        with self.assertRaises(ValidationError):
            AuditLogSchema(**invalid_data)

    def test_movement_with_invalid_no_consignment_reason_fails(self):
        movement = {
            **self.valid_data["movement"],
            "reason_for_no_consignment_code": "INVALID_REASON",
        }

        invalid_data = {
            **self.valid_data,
            "movement": movement,
        }

        with self.assertRaises(ValidationError):
            AuditLogSchema(**invalid_data)

    # ==========================================================
    # WASTE ITEM - VALID TEST
    # ==========================================================

    def test_waste_item_with_required_fields_passes(self):
        waste_item = {
            **self.valid_data["waste_items"][0],
        }

        valid_data = {
            **self.valid_data,
            "waste_items": [waste_item],
        }

        AuditLogSchema(**valid_data)
     
    # ==========================================================
    # CARRIER DETAILS - VALID
    # ==========================================================

    def test_carrier_details_with_valid_registration_passes(self):
        carrier = {
            **self.valid_data["carrier"],
            "registration_number": "CBDU123456",
            "reason_for_no_registration_number": None,
        }

        valid_data = {
            **self.valid_data,
            "carrier": carrier,
        }

        AuditLogSchema(**valid_data)

    def test_carrier_details_with_non_road_transport_passes(self):
        carrier = {
            **self.valid_data["carrier"],
            "registration_number": None,
            "reason_for_no_registration_number": "ON_SITE",
            "vehicle_registration": None,
            "means_of_transport": "Rail",
        }

        valid_data = {
            **self.valid_data,
            "carrier": carrier,
        }

        AuditLogSchema(**valid_data)

    # ==========================================================
    # CARRIER DETAILS - INVALID
    # ==========================================================

    def test_carrier_details_without_registration_or_reason_fails(self):
        carrier = {
            **self.valid_data["carrier"],
            "registration_number": None,
            "reason_for_no_registration_number": None,
            "means_of_transport": "Rail",
            "vehicle_registration": None,
        }

        invalid_data = {
            **self.valid_data,
            "carrier": carrier,
        }

        with self.assertRaises(ValidationError):
            AuditLogSchema(**invalid_data)

    def test_carrier_details_road_without_vehicle_registration_fails(self):
        carrier = {
            **self.valid_data["carrier"],
            "means_of_transport": "Road",
            "vehicle_registration": None,
        }

        invalid_data = {
            **self.valid_data,
            "carrier": carrier,
        }

        with self.assertRaises(ValidationError):
            AuditLogSchema(**invalid_data)

    # ==========================================================
    # BROKER / DEALER DETAILS - VALID
    # ==========================================================

    def test_broker_details_with_required_fields_passes(self):
        broker = {
            "organisation_name": "Test Broker Ltd",
        }

        valid_data = {
            **self.valid_data,
            "broker": broker,
        }

        AuditLogSchema(**valid_data)

    def test_broker_details_with_valid_registration_passes(self):
        broker = {
            "organisation_name": "Test Broker Ltd",
            "address": {
                "full_address": "2 Broker Street, London",
                "postcode": "SW1A 1AA",
            },
            "email_address": "broker@example.com",
            "phone_number": "02012345678",
            "registration_number": "CBDU123456",
        }

        valid_data = {
            **self.valid_data,
            "broker": broker,
        }

        AuditLogSchema(**valid_data)

    # ==========================================================
    # BROKER / DEALER DETAILS - INVALID
    # ==========================================================

    def test_broker_details_without_organisation_name_fails(self):
        broker = {
            "email_address": "broker@example.com",
        }

        invalid_data = {
            **self.valid_data,
            "broker": broker,
        }

        with self.assertRaises(ValidationError):
            AuditLogSchema(**invalid_data)

    def test_broker_details_with_invalid_registration_fails(self):
        broker = {
            "organisation_name": "Test Broker Ltd",
            "registration_number": "INVALID",
        }

        invalid_data = {
            **self.valid_data,
            "broker": broker,
        }

        with self.assertRaises(ValidationError):
            AuditLogSchema(**invalid_data)

    # ==========================================================
    # WASTE RECEIVER DETAILS - VALID
    # ==========================================================

    def test_receiver_details_with_required_fields_passes(self):
        receiver = {
            "site_name": "Test Waste Site",
            "authorisation_number": "EPR/AB1234CD",
        }

        valid_data = {
            **self.valid_data,
            "receiver": receiver,
        }

        AuditLogSchema(**valid_data)

    def test_receiver_details_with_contact_information_passes(self):
        receiver = {
            "site_name": "Test Waste Site",
            "email_address": "receiver@example.com",
            "phone_number": "02087654321",
            "authorisation_number": "EPR/AB1234CD",
            "regulatory_position_statements": [1, 2],
        }

        valid_data = {
            **self.valid_data,
            "receiver": receiver,
        }

        AuditLogSchema(**valid_data)

    # ==========================================================
    # WASTE RECEIVER DETAILS - INVALID
    # ==========================================================

    def test_receiver_details_without_site_name_fails(self):
        receiver = {
            "authorisation_number": "EPR/AB1234CD",
        }

        invalid_data = {
            **self.valid_data,
            "receiver": receiver,
        }

        with self.assertRaises(ValidationError):
            AuditLogSchema(**invalid_data)

    def test_receiver_details_with_invalid_authorisation_number_fails(self):
        receiver = {
            "site_name": "Test Waste Site",
            "authorisation_number": "INVALID",
        }

        invalid_data = {
            **self.valid_data,
            "receiver": receiver,
        }

        with self.assertRaises(ValidationError):
            AuditLogSchema(**invalid_data)

    # ==========================================================
    # RECEIPT - VALID
    # ==========================================================

    def test_receipt_with_valid_address_passes(self):
        receipt = {
            "address": {
                "full_address": "1 Test Waste Road, London",
                "postcode": "SW1A 1AA",
            }
        }

        valid_data = {
            **self.valid_data,
            "receipt": receipt,
        }

        AuditLogSchema(**valid_data)

    def test_receipt_with_different_valid_postcode_passes(self):
        receipt = {
            "address": {
                "full_address": "10 High Street, Manchester",
                "postcode": "M1 1AA",
            }
        }

        valid_data = {
            **self.valid_data,
            "receipt": receipt,
        }

        AuditLogSchema(**valid_data)

    # ==========================================================
    # RECEIPT - INVALID
    # ==========================================================

    def test_receipt_without_address_fails(self):
        receipt = {}

        invalid_data = {
            **self.valid_data,
            "receipt": receipt,
        }

        with self.assertRaises(ValidationError):
            AuditLogSchema(**invalid_data)

    def test_receipt_with_invalid_postcode_fails(self):
        receipt = {
            "address": {
                "full_address": "1 Test Waste Road, London",
                "postcode": "NOT A POSTCODE",
            }
        }

        invalid_data = {
            **self.valid_data,
            "receipt": receipt,
        }

        with self.assertRaises(ValidationError):
            AuditLogSchema(**invalid_data)



if __name__ == "__main__":
    unittest.main()

