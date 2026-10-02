import unittest
import os
from backend.core_compliance.integrity_guard import IntegrityGuard

class TestLedgerAccess(unittest.TestCase):
    
    def setUp(self):
        self.guard = IntegrityGuard()

    def test_ledger_directory_exists(self):
        """Verify the storage directory is created and accessible."""
        directory = os.path.dirname(self.guard.ledger_path)
        self.assertTrue(os.path.exists(directory), f"Directory {directory} not found!")

    def test_ledger_write_capability(self):
        """Verify the guard can actually write to the ledger file."""
        test_data = {"test": "connection"}
        # This will raise an exception if it fails, which unittest will catch
        new_hash = self.guard.secure_and_append(test_data)
        self.assertIsNotNone(new_hash, "Failed to get a hash back from the ledger.")

if __name__ == "__main__":
    unittest.main()