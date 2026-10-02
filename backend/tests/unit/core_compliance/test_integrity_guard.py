import unittest
from backend.core_compliance.integrity_guard import IntegrityGuard

class TestIntegrityGuard(unittest.TestCase):
    
    def setUp(self):
        """Arrange: Initialize the guard."""
        self.guard = IntegrityGuard()

    def test_secure_and_append_integrity(self):
        """Act & Assert: Verify that a record can be appended and return a hash."""
        record = {
            "user": "Lola",
            "action": "WASTE_CLASSIFICATION",
            "data": "Hazardous Waste - EWC 16 05 08"
        }
        
        # Act
        new_hash = self.guard.secure_and_append(record)
        
        # Assert
        self.assertIsNotNone(new_hash)
        self.assertIsInstance(new_hash, str)
        print(f"Success: Chain linked. New hash: {new_hash}")


if __name__ == "__main__":
    unittest.main()