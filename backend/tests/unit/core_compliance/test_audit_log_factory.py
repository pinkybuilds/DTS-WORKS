import unittest
from backend.core_compliance.audit_log_factory import AuditLogFactory
from backend.gateway.exceptions import SchemaValidationError

class TestAuditLogFactory(unittest.TestCase):
    
    def setUp(self):
        """Arrange: Set up valid data before each test."""
        self.valid_data = {
            "dwt_id": "DWT-999",
            "movement": {
                "api_code": "123456",
            },
            "waste_items": [
                {
                    "ewc_code": "17-04-05",
                    "waste_description": "Iron and steel",
                    "physical_form": "solid",
                    "number_of_containers": 1,
                    "container_type": "skip",
                    "weight_unit": "kilograms",
                    "weight_amount": 100.0,
                    "is_weight_estimated": False,
                }
            ],
            "carrier": {
                "registration_number": "CBDU12345",
                "organisation_name": "Acme Carriers Ltd",
                "means_of_transport": "road",
            },
            "receiver": {
                "authorisation_number": "EPR/123456",
            },
        }

    def test_create_log_success(self):
        """Act & Assert: Ensure valid data creates a log correctly."""
        log = AuditLogFactory.create_log(self.valid_data)
        self.assertEqual(log.dwt_id, "DWT-999")
        self.assertEqual(log.waste_items[0].weight_amount, 100.0)

    def test_create_log_missing_field_failure(self):
        """Act & Assert: Ensure missing data raises a SchemaValidationError."""
        invalid_data = self.valid_data.copy()
        invalid_data["waste_items"] = [
            {k: v for k, v in self.valid_data["waste_items"][0].items() if k != "weight_amount"}
        ]

        with self.assertRaises(SchemaValidationError):
            AuditLogFactory.create_log(invalid_data)

if __name__ == "__main__":
    unittest.main()
