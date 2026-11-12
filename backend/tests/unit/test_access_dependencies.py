
import pytest

from fastapi import HTTPException

from backend.auth.access_context import OrganisationAccessContext
from backend.auth.access_dependencies import (
    require_full_access,
    require_read_access,
)
from backend.auth.access_policy import (
    AccessDecision,
    AccessLevel,
)


def make_context(level):
    return OrganisationAccessContext(
        organisation_id="org-123",
        role="OWNER",
        subscription={"status": "active"},
        access=AccessDecision(
            level=level,
            reason="test",
        ),
    )


def test_full_access_allows_read_access():
    context = make_context(AccessLevel.FULL)

    result = require_read_access(context)

    assert result is context


def test_read_only_access_allows_read_access():
    context = make_context(AccessLevel.READ_ONLY)

    result = require_read_access(context)

    assert result is context


def test_no_access_rejects_read_access():
    context = make_context(AccessLevel.NONE)

    with pytest.raises(HTTPException) as error:
        require_read_access(context)

    assert error.value.status_code == 403


def test_full_access_allows_operational_actions():
    context = make_context(AccessLevel.FULL)

    result = require_full_access(context)

    assert result is context


def test_read_only_access_rejects_operational_actions():
    context = make_context(AccessLevel.READ_ONLY)

    with pytest.raises(HTTPException) as error:
        require_full_access(context)

    assert error.value.status_code == 403


def test_no_access_rejects_operational_actions():
    context = make_context(AccessLevel.NONE)

    with pytest.raises(HTTPException) as error:
        require_full_access(context)

    assert error.value.status_code == 403
