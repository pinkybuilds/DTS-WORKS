import unittest
from backend.core_compliance.audit_log_schema import AuditLogSchema
from backend.core_compliance.compliance_engine import ComplianceEngine
from backend.gateway.exceptions import ComplianceViolationError

class TestComplianceEngine(unittest.TestCase):
    
    def setUp(self):
        self.engine = ComplianceEngine()
        self.base_data = {
            "dwt_id": "DWT-HAAZ-001",
            "movement": {
                "api_code": "123456",
            },
            "waste_items": [
                {
                    "ewc_code": "16 01 06",
                    "waste_description": "End-of-life vehicles (depolluted)",
                    "physical_form": "solid",
                    "number_of_containers": 1,
                    "container_type": "skip",
                    "weight_unit": "kilograms",
                    "weight_amount": 500,
                    "is_weight_estimated": False,
                }
            ],
            "carrier": {
                "registration_number": "CBDU12345",
                "organisation_name": "Acme Carriers Ltd",
                "means_of_transport": "road",
            },
            "receiver": {
                "authorisation_number": "EPR/AB1234CD",
            },
        }

    def test_valid_movement_passes(self):
        """Verify that a standard, non-hazardous movement passes validation."""
        log = AuditLogSchema(**self.base_data)
        # Should not raise any error
        self.engine.validate_movement(log)

    def test_hazardous_movement_raises_exception(self):
        
        """Verify that hazardous movement (16 01 04*) requires a hazardous waste consignment code."""
        # 1. Arrange
        hazardous_data = self.base_data.copy()
        hazardous_data["waste_items"] = [
            {
                **self.base_data["waste_items"][0],
                "ewc_code": "16 01 04*",  # Use your real hazardous code!
            }
        ]
        # Movement has no hazardous_waste_consignment_code set -> should fail
        hazardous_data["movement"] = {"api_code": "123456"}

        log = AuditLogSchema(**hazardous_data)
        
        # 2. Act & Assert: This MUST raise the error now
        with self.assertRaises(ComplianceViolationError):
            self.engine.validate_movement(log)

if __name__ == "__main__":
    unittest.main()
