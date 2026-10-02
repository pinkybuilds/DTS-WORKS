import unittest
from backend.gateway.exceptions import (
    RodaProtocolError, SchemaValidationError, AuthenticationError, 
    ComplianceViolationError, ServiceUnavailableError, IntegrityError, ResourceNotFoundError
)

class TestGatewayExceptions(unittest.TestCase):
    
    def test_roda_protocol_error_metadata(self):
        """Ensure every error generates a unique ID and captures context."""
        msg = "Test error"
        tenant = "TENANT-001"
        context = {"field": "weight"}
        
        err = RodaProtocolError(msg, tenant_id=tenant, extra_context=context)
        
        self.assertEqual(err.message, msg)
        self.assertEqual(err.tenant_id, tenant)
        self.assertEqual(err.extra_context, context)
        self.assertIsNotNone(err.error_id)  # Did it generate a UUID?
        self.assertIsNotNone(err.timestamp) # Did it log the time?

    def test_roda_protocol_error_defaults(self):
        """Ensure default tenant_id/severity/extra_context apply when not provided."""
        err = RodaProtocolError("Default check")

        self.assertEqual(err.tenant_id, "SYSTEM")
        self.assertEqual(err.severity, "ERROR")
        self.assertEqual(err.extra_context, {})

    def test_specific_exception_types(self):
        """Ensure our specific errors inherit correctly from RodaProtocolError."""
        exceptions = [
            SchemaValidationError("Malformed"),
            AuthenticationError("No Auth"),
            ComplianceViolationError("Failed Rule"),
            ServiceUnavailableError("Down"),
            IntegrityError("Hash Mismatch"),
            ResourceNotFoundError("Missing")
        ]
        
        for exc in exceptions:
            self.assertIsInstance(exc, RodaProtocolError, f"{type(exc).__name__} failed to inherit correctly!")

    def test_specific_exception_constructors_accept_all_fields(self):
        """
        Ensure each of the Universal 6 exception classes properly accepts and
        stores message, tenant_id, severity, and extra_context via their own
        __init__ constructors (not just relying on default inheritance).
        """
        exception_classes = [
            SchemaValidationError,
            AuthenticationError,
            ComplianceViolationError,
            ServiceUnavailableError,
            IntegrityError,
            ResourceNotFoundError,
        ]

        for exc_class in exception_classes:
            msg = f"{exc_class.__name__} triggered"
            tenant = "TENANT-XYZ"
            severity = "CRITICAL"
            context = {"reason": f"{exc_class.__name__} test context"}

            err = exc_class(msg, tenant_id=tenant, severity=severity, extra_context=context)

            self.assertIsInstance(err, RodaProtocolError)
            self.assertIsInstance(err, exc_class)
            self.assertEqual(err.message, msg)
            self.assertEqual(err.tenant_id, tenant)
            self.assertEqual(err.severity, severity)
            self.assertEqual(err.extra_context, context)
            self.assertIsNotNone(err.error_id)
            self.assertIsNotNone(err.timestamp)

    def test_specific_exception_defaults_when_only_message_given(self):
        """
        Ensure each of the Universal 6 exception classes falls back to the
        correct default tenant_id/severity/extra_context when only a message
        is provided (matching RodaProtocolError's defaults).
        """
        exception_classes = [
            SchemaValidationError,
            AuthenticationError,
            ComplianceViolationError,
            ServiceUnavailableError,
            IntegrityError,
            ResourceNotFoundError,
        ]

        for exc_class in exception_classes:
            err = exc_class(f"{exc_class.__name__} default test")

            self.assertEqual(err.tenant_id, "SYSTEM")
            self.assertEqual(err.severity, "ERROR")
            self.assertEqual(err.extra_context, {})

    def test_each_exception_generates_unique_error_id(self):
        """Ensure two instances of the same exception type get different error_ids."""
        err1 = ComplianceViolationError("First violation")
        err2 = ComplianceViolationError("Second violation")

        self.assertNotEqual(err1.error_id, err2.error_id)

if __name__ == "__main__":
    unittest.main()
