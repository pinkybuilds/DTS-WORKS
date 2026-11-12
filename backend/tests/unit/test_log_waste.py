
from unittest.mock import Mock

from fastapi import HTTPException
from fastapi.testclient import TestClient

import backend.main as main
from backend.auth.access_dependencies import require_full_access
from backend.auth.dependencies import get_authenticated_user_id


def test_log_waste_rejects_without_full_access(monkeypatch):
    audit_mock = Mock()
    defra_mock = Mock()

    monkeypatch.setattr(main, "audit_ledger", audit_mock)
    monkeypatch.setattr(main, "defra_client", defra_mock)

    def deny_access():
        raise HTTPException(
            status_code=403,
            detail="Full operational access is required.",
        )

    main.app.dependency_overrides[require_full_access] = deny_access
    main.app.dependency_overrides[get_authenticated_user_id] = (
        lambda: "user-123"
    )

    try:
        client = TestClient(main.app)

        response = client.post(
            "/log-waste",
            json={},
        )
    finally:
        main.app.dependency_overrides.clear()

    assert response.status_code == 403
    audit_mock.record_event.assert_not_called()
    defra_mock.submit_receipt.assert_not_called()
