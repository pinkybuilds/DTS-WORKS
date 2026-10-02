import json
import os
import tempfile
import unittest

from backend.core_compliance.integrity_guard import IntegrityGuard
from backend.gateway.exceptions import IntegrityError


class TestIntegrityGuardTamperDetection(unittest.TestCase):
    """
    Verifies that IntegrityGuard refuses to extend the hash chain if the
    last entry on disk has been hand-edited (its stored hash no longer
    matches its own contents).
    """

    def setUp(self):
        # Use a temporary ledger file so we don't touch the real
        # data/chain_of_custody.jsonl during this test.
        self.tmp_dir = tempfile.mkdtemp()
        self.tmp_ledger_path = os.path.join(self.tmp_dir, "test_ledger.jsonl")

        self.guard = IntegrityGuard()
        self.guard.ledger_path = self.tmp_ledger_path

    def tearDown(self):
        if os.path.exists(self.tmp_ledger_path):
            os.remove(self.tmp_ledger_path)
        os.rmdir(self.tmp_dir)

    def test_untampered_chain_appends_normally(self):
        """A clean, untampered ledger should append without error."""
        first_hash = self.guard.secure_and_append({"event": "first"})
        second_hash = self.guard.secure_and_append({"event": "second"})

        self.assertIsNotNone(first_hash)
        self.assertIsNotNone(second_hash)
        self.assertNotEqual(first_hash, second_hash)

    def test_tampered_last_entry_raises_integrity_error(self):
        """
        If the last line in the ledger is hand-edited after being written,
        the next append attempt must raise IntegrityError instead of
        silently trusting the broken entry.
        """
        self.guard.secure_and_append({"event": "original", "amount": 100})

        # Simulate someone hand-editing the ledger file on disk.
        with open(self.tmp_ledger_path, "r") as f:
            lines = f.readlines()

        tampered_entry = json.loads(lines[-1])
        tampered_entry["amount"] = 999999  # changed after the hash was calculated

        lines[-1] = json.dumps(tampered_entry) + "\n"

        with open(self.tmp_ledger_path, "w") as f:
            f.writelines(lines)

        with self.assertRaises(IntegrityError):
            self.guard.secure_and_append({"event": "next"})


if __name__ == "__main__":
    unittest.main()
