
from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from backend.site_profile.models import SiteAddress, SiteProfile
from backend.site_profile.repository import SiteProfileRepository


@pytest.fixture
def repository():
    return SiteProfileRepository()


def test_get_site_profile_uses_requested_site_id(repository, monkeypatch):
    mock_supabase = MagicMock()

    mock_supabase.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value.data = [
        {
            "organisation_name": "DTS Test Organisation",
            "site_name": "Test Receiving Site",
            "full_address": "1 Test Road",
            "postcode": "AB1 2CD",
            "authorisation_number": "EA/123456",
            "api_code": "API123",
            "email_address": "test@example.com",
            "phone_number": "01234567890",
        }
    ]

    monkeypatch.setattr(
        "backend.site_profile.repository.supabase",
        mock_supabase,
    )

    result = repository.get_site_profile("site-123")

    assert result.organisation_name == "DTS Test Organisation"
    assert result.site_name == "Test Receiving Site"
    assert result.address.full_address == "1 Test Road"
    assert result.address.postcode == "AB1 2CD"

    mock_supabase.table.assert_called_once_with("site_profiles")
    mock_supabase.table.return_value.select.return_value.eq.assert_called_once_with(
        "site_id",
        "site-123",
    )


def test_get_site_profile_returns_404_when_profile_missing(
    repository,
    monkeypatch,
):
    mock_supabase = MagicMock()

    mock_supabase.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value.data = []

    monkeypatch.setattr(
        "backend.site_profile.repository.supabase",
        mock_supabase,
    )

    with pytest.raises(HTTPException) as exc:
        repository.get_site_profile("site-123")

    assert exc.value.status_code == 404


def test_save_site_profile_updates_requested_site_id(
    repository,
    monkeypatch,
):
    mock_supabase = MagicMock()

    mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value.data = [
        {"site_id": "site-123"}
    ]

    monkeypatch.setattr(
        "backend.site_profile.repository.supabase",
        mock_supabase,
    )

    profile = SiteProfile(
        organisation_name="DTS Test Organisation",
        site_name="Updated Receiving Site",
        address=SiteAddress(
            full_address="2 New Road",
            postcode="CD3 4EF",
        ),
        authorisation_number="EA/654321",
        api_code="API456",
        email_address="updated@example.com",
        phone_number="01234567891",
    )

    result = repository.save_site_profile("site-123", profile)

    assert result == profile

    mock_supabase.table.assert_called_once_with("site_profiles")
    mock_supabase.table.return_value.update.return_value.eq.assert_called_once_with(
        "site_id",
        "site-123",
    )


def test_save_site_profile_returns_404_when_profile_missing(
    repository,
    monkeypatch,
):
    mock_supabase = MagicMock()

    mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value.data = []

    monkeypatch.setattr(
        "backend.site_profile.repository.supabase",
        mock_supabase,
    )

    profile = SiteProfile(
        organisation_name="DTS Test Organisation",
        site_name="Test Receiving Site",
        address=SiteAddress(
            full_address="1 Test Road",
            postcode="AB1 2CD",
        ),
        authorisation_number="EA/123456",
        api_code="API123",
    )

    with pytest.raises(HTTPException) as exc:
        repository.save_site_profile("site-123", profile)

    assert exc.value.status_code == 404
