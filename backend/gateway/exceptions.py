
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional


class RodaProtocolError(Exception):
    """
    Root parent for every custom error in the system.

    Provides consistent metadata so the system can track:
    - Who: tenant_id
    - When: timestamp
    - What: message and extra_context
    - Severity: severity
    - Error identity: error_id
    """

    def __init__(
        self,
        message: str,
        tenant_id: str = "SYSTEM",
        severity: str = "ERROR",
        extra_context: Optional[Dict[str, Any]] = None,
    ):
        self.error_id = str(uuid.uuid4())
        self.timestamp = datetime.now(timezone.utc)
        self.message = message
        self.tenant_id = tenant_id
        self.severity = severity
        self.extra_context = extra_context or {}

        super().__init__(self.message)


class SchemaValidationError(RodaProtocolError):
    """
    Raised when data cannot satisfy the required schema
    or the data structure is malformed.
    """


class AuthenticationError(RodaProtocolError):
    """
    Raised when tenant or user identity is invalid,
    missing, or cannot be authenticated.
    """


class ComplianceEvaluationError(RodaProtocolError):
    """
    Raised when the compliance evaluation process itself
    encounters an unexpected or invalid internal state.

    This is NOT used for ordinary compliance warnings.

    Example:
        A movement being outside a site's authorised scope
        should produce a ComplianceResult warning, not this
        exception.
    """


class ConfigurationError(RodaProtocolError):
    """
    Raised when the application or required system
    configuration is missing, invalid, or unusable.
    """


class ServiceUnavailableError(RodaProtocolError):
    """
    Raised when an external dependency or service is
    unavailable or cannot be reached.
    """


class IntegrityError(RodaProtocolError):
    """
    Raised when the integrity of the audit trail or
    another protected data structure cannot be verified.
    """


class ResourceNotFoundError(RodaProtocolError):
    """
    Raised when a specific resource or ID requested
    by the user cannot be found.
    """
