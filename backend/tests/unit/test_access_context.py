
import pytest

from fastapi import HTTPException

from backend.auth.access_context import (
    get_organisation_access_context,
)


class FakeQuery:
    def __init__(self, table, responses):
        self.table = table
        self.responses = responses

    def select(self, *args, **kwargs):
        return self

    def eq(self, *args, **kwargs):
        return self

    def limit(self, *args, **kwargs):
        return self

    def order(self, *args, **kwargs):
        return self

    def execute(self):
        result = self.responses[self.table]

        if isinstance(result, Exception):
            raise result

        return type("Result", (), {"data": result})()


class FakeSupabase:
    def __init__(self, responses):
        self.responses = responses

    def table(self, table_name):
        return FakeQuery(table_name, self.responses)


@pytest.fixture
def mock_supabase(monkeypatch):
    import backend.auth.access_context as access_context

    def set_responses(responses):
        monkeypatch.setattr(
            access_context,
            "supabase",
            FakeSupabase(responses),
        )

    return set_responses


def test_resolves_owner_with_active_subscription(mock_supabase):
    mock_supabase({
        "organisation_members": [
            {
                "organisation_id": "org-123",
                "role": "OWNER",
            }
        ],
        "subscriptions": [
            {
                "status": "active",
                "payment_failed_at": None,
                "grace_period_ends_at": None,
            }
        ],
    })

    result = get_organisation_access_context("user-123")

    assert result.organisation_id == "org-123"
    assert result.role == "OWNER"
    assert result.access.level.value == "full"


def test_user_without_membership_is_rejected(mock_supabase):
    mock_supabase({
        "organisation_members": [],
        "subscriptions": [],
    })

    with pytest.raises(HTTPException) as error:
        get_organisation_access_context("user-123")

    assert error.value.status_code == 403


def test_multiple_memberships_are_rejected(mock_supabase):
    mock_supabase({
        "organisation_members": [
            {
                "organisation_id": "org-123",
                "role": "OWNER",
            },
            {
                "organisation_id": "org-456",
                "role": "MEMBER",
            },
        ],
        "subscriptions": [],
    })

    with pytest.raises(HTTPException) as error:
        get_organisation_access_context("user-123")

    assert error.value.status_code == 409


def test_missing_membership_role_is_rejected(mock_supabase):
    mock_supabase({
        "organisation_members": [
            {
                "organisation_id": "org-123",
                "role": None,
            }
        ],
        "subscriptions": [],
    })

    with pytest.raises(HTTPException) as error:
        get_organisation_access_context("user-123")

    assert error.value.status_code == 403


def test_user_without_subscription_has_no_access(mock_supabase):
    mock_supabase({
        "organisation_members": [
            {
                "organisation_id": "org-123",
                "role": "OWNER",
            }
        ],
        "subscriptions": [],
    })

    result = get_organisation_access_context("user-123")

    assert result.organisation_id == "org-123"
    assert result.access.level.value == "none"


def test_multiple_current_subscriptions_are_rejected(mock_supabase):
    mock_supabase({
        "organisation_members": [
            {
                "organisation_id": "org-123",
                "role": "OWNER",
            }
        ],
        "subscriptions": [
            {"status": "active"},
            {"status": "past_due"},
        ],
    })

    with pytest.raises(HTTPException) as error:
        get_organisation_access_context("user-123")

    assert error.value.status_code == 409


def test_historical_cancelled_subscription_is_read_only(mock_supabase):
    mock_supabase({
        "organisation_members": [
            {
                "organisation_id": "org-123",
                "role": "OWNER",
            }
        ],
        "subscriptions": [
            {"status": "cancelled"},
        ],
    })

    result = get_organisation_access_context("user-123")

    assert result.access.level.value == "read_only"


def test_membership_database_failure_returns_503(mock_supabase):
    mock_supabase({
        "organisation_members": RuntimeError("Database unavailable"),
        "subscriptions": [],
    })

    with pytest.raises(HTTPException) as error:
        get_organisation_access_context("user-123")

    assert error.value.status_code == 503


def test_subscription_database_failure_returns_503(mock_supabase):
    mock_supabase({
        "organisation_members": [
            {
                "organisation_id": "org-123",
                "role": "OWNER",
            }
        ],
        "subscriptions": RuntimeError("Database unavailable"),
    })

    with pytest.raises(HTTPException) as error:
        get_organisation_access_context("user-123")

    assert error.value.status_code == 503
