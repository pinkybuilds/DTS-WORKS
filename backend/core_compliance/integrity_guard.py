import hashlib
import json
import os
from typing import Any, Dict, Tuple

from backend.gateway.exceptions import IntegrityError


class IntegrityGuard:
    def __init__(self):
        # Canonical backend data directory.
        current_dir = os.path.dirname(os.path.abspath(__file__))

        self.data_dir = os.path.abspath(
            os.path.join(
                current_dir,
                "..",
                "data",
            )
        )

        # Active ledger during testing.
        # Change this to "audit_ledger.jsonl" when operators begin using DTS Works.
        LEDGER_FILENAME = "temp_audit_ledger.jsonl"

        self.ledger_path = os.path.join(
            self.data_dir,
            LEDGER_FILENAME,
        )

        print(
            "AUDIT LEDGER PATH:",
            self.ledger_path,
            flush=True,
        )

    def _compute_row_hash(self, entry: Dict[str, Any]) -> str:
        entry_copy = dict(entry)

        integrity = entry_copy.get("integrity")

        if isinstance(integrity, dict):
            integrity_copy = dict(integrity)
            integrity_copy.pop("current_row_hash", None)
            entry_copy["integrity"] = integrity_copy

        record_json = json.dumps(
            entry_copy,
            sort_keys=True,
            separators=(",", ":"),
        )

        return hashlib.sha256(
            record_json.encode("utf-8")
        ).hexdigest()

    def _get_last_hash(self) -> str:
        if not os.path.exists(self.ledger_path):
            return "0"

        last_line = None

        with open(
            self.ledger_path,
            "r",
            encoding="utf-8",
        ) as ledger_file:
            for line in ledger_file:
                if line.strip():
                    last_line = line.strip()

        if not last_line:
            return "0"

        try:
            last_record = json.loads(last_line)
        except json.JSONDecodeError as exc:
            raise IntegrityError(
                "Audit ledger contains invalid JSON."
            ) from exc

        stored_hash = (
            last_record.get("integrity", {})
            .get("current_row_hash")
        )

        if not stored_hash:
            raise IntegrityError(
                "Audit ledger record is missing its current row hash."
            )

        calculated_hash = self._compute_row_hash(last_record)

        if calculated_hash != stored_hash:
            raise IntegrityError(
                "Audit ledger integrity check failed. "
                "The previous record has been modified."
            )

        return stored_hash

    def secure_and_append(
        self,
        record: Dict[str, Any],
    ) -> str:
        previous_hash = self._get_last_hash()

        record["integrity"] = {
            "prev_hash": previous_hash,
        }

        record_json = json.dumps(
            record,
            sort_keys=True,
            separators=(",", ":"),
        )

        current_hash = hashlib.sha256(
            record_json.encode("utf-8")
        ).hexdigest()

        record["integrity"]["current_row_hash"] = current_hash

        os.makedirs(
            self.data_dir,
            exist_ok=True,
        )

        with open(
            self.ledger_path,
            "a",
            encoding="utf-8",
        ) as ledger_file:
            ledger_file.write(
                json.dumps(
                    record,
                    sort_keys=True,
                    separators=(",", ":"),
                )
                + "\n"
            )

        return current_hash