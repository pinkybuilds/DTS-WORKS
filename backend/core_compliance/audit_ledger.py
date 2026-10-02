
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, Optional
import uuid

from .integrity_guard import IntegrityGuard


class AuditEventType(str, Enum):
    MOVEMENT_CREATED = "MOVEMENT_CREATED"
    COMPLIANCE_EVALUATED = "COMPLIANCE_EVALUATED"
    COMPLIANCE_WARNING = "COMPLIANCE_WARNING"
    OPERATOR_REVIEWED = "OPERATOR_REVIEWED"
    MOVEMENT_EDITED = "MOVEMENT_EDITED"
    MOVEMENT_DELETED = "MOVEMENT_DELETED"
    MOVEMENT_CONTINUED = "MOVEMENT_CONTINUED"
    SUBMISSION_ATTEMPTED = "SUBMISSION_ATTEMPTED"
    DEFRA_ACCEPTED = "DEFRA_ACCEPTED"
    DEFRA_REJECTED = "DEFRA_REJECTED"
    DEFRA_RECEIPT_RECEIVED = "DEFRA_RECEIPT_RECEIVED"
    CORRECTION_CREATED = "CORRECTION_CREATED"


class AuditLedger:
    """
    Creates and records immutable audit events.

    AuditLedger is responsible for describing what happened.
    IntegrityGuard is responsible for protecting the event chain.
    """

    def __init__(self, integrity_guard: Optional[IntegrityGuard] = None):
        self.integrity_guard = integrity_guard or IntegrityGuard()

    def record_event(
        self,
        event_type: AuditEventType,
        *,
        movement_id: Optional[str] = None,
        parent_id: Optional[str] = None,
        waste_tracking_id: Optional[str] = None,
        actor_type: Optional[str] = None,
        actor_id: Optional[str] = None,
        data: Optional[Dict[str, Any]] = None,
        outcome: Optional[str] = None,
    ) -> str:
        """
        Create and securely append an audit event.

        Returns:
            The event_id of the newly recorded event.
        """

        event_id = str(uuid.uuid4())

        event = {
            "event_id": event_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": event_type.value,
            "movement_id": movement_id,
            "parent_id": parent_id,
            "waste_tracking_id": waste_tracking_id,
            "actor": {
                "type": actor_type,
                "id": actor_id,
            },
            "data": data or {},
            "outcome": outcome,
        }

        self.integrity_guard.secure_and_append(event)

        return event_id

