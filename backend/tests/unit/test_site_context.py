
import pytest

from fastapi import HTTPException

from backend.auth.access_context import OrganisationAccessContext
from backend.auth.access_policy import AccessDecision, AccessLevel
from backend.auth.site_context import get_site_context


class FakeQuery:
    def __init__(self, rows):
        self.rows = rows
        self.filters = []
        self.limit_value = None

    def select(self, *args, **kwargs):
        return self

    def eq(self, column, value):
        self.filters.append((column, value))
        return self

    def limit(self, value):
        self.limit_value = value
        return self

    def execute(self):
        rows = self.rows

        for column, value in self.filters:
            rows = [
                row for row in rows
                if str(row.get(column)) == str(value)
            ]

        if self.limit_value is not None:
            rows = rows[:self.limit_value]

        return type("Result", (), {"data": rows})()


class FakeSupabase:
    def __init__(self, sites):
        self.sites = sites

    def table(self, table_name):
        assert table_name == "sites"
        return FakeQuery(self.sites)


@pytest.fixture
def organisation_context():
    return OrganisationAccessContext(
        organisation_id="org-123",
        role="OWNER",
        subscription={"status": "active"},
        access=AccessDecision(
            level=AccessLevel.FULL,
            reason="test",
        ),
    )


@pytest.fixture
def mock_supabase(monkeypatch):
    import backend.auth.site_context as site_context

    def set_sites(sites):
        monkeypatch.setattr(
            site_context,
            "supabase",
            FakeSupabase(sites),
        )

    return set_sites


def test_single_site_is_selected_automatically(
    organisation_context,
    mock_supabase,
):
    mock_supabase([
        {
            "id": "site-123",
            "organisation_id": "org-123",
        }
    ])

    result = get_site_context(
        organisation_context,
        selected_site_id=None,
    )

    assert result.organisation_id == "org-123"
    assert result.site_id == "site-123"


def test_multiple_sites_require_explicit_selection(
    organisation_context,
    mock_supabase,
):
    mock_supabase([
        {
            "id": "site-123",
            "organisation_id": "org-123",
        },
        {
            "id": "site-456",
            "organisation_id": "org-123",
        },
    ])

    with pytest.raises(HTTPException) as error:
        get_site_context(
            organisation_context,
            selected_site_id=None,
        )

    assert error.value.status_code == 409
    assert "Site selection required" in error.value.detail


def test_valid_selected_site_is_accepted(
    organisation_context,
    mock_supabase,
):
    mock_supabase([
        {
            "id": "site-123",
            "organisation_id": "org-123",
        },
        {
            "id": "site-456",
            "organisation_id": "org-123",
        },
    ])

    result = get_site_context(
        organisation_context,
        selected_site_id="site-456",
    )

    assert result.organisation_id == "org-123"
    assert result.site_id == "site-456"


def test_site_from_another_organisation_is_rejected(
    organisation_context,
    mock_supabase,
):
    mock_supabase([
        {
            "id": "site-999",
            "organisation_id": "org-456",
        }
    ])

    with pytest.raises(HTTPException) as error:
        get_site_context(
            organisation_context,
            selected_site_id="site-999",
        )

    assert error.value.status_code == 404
    assert "selected site was not found" in error.value.detail.lower()

