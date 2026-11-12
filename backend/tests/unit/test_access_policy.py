
from datetime import datetime, timedelta, timezone

from backend.auth.access_policy import (
    AccessLevel,
    determine_subscription_access,
)


NOW = datetime(2026, 11, 12, 12, 0, tzinfo=timezone.utc)


def test_active_subscription_has_full_access():
    result = determine_subscription_access(
        {"status": "active"},
        now=NOW,
    )

    assert result.level == AccessLevel.FULL


def test_renewal_failure_within_grace_has_full_access():
    result = determine_subscription_access(
        {
            "status": "past_due",
            "payment_failed_at": NOW.isoformat(),
            "grace_period_ends_at": (
                NOW + timedelta(days=7)
            ).isoformat(),
        },
        now=NOW,
    )

    assert result.level == AccessLevel.FULL


def test_expired_grace_period_is_read_only():
    result = determine_subscription_access(
        {
            "status": "past_due",
            "payment_failed_at": (
                NOW - timedelta(days=8)
            ).isoformat(),
            "grace_period_ends_at": (
                NOW - timedelta(days=1)
            ).isoformat(),
        },
        now=NOW,
    )

    assert result.level == AccessLevel.READ_ONLY


def test_past_due_without_verified_failure_has_no_access():
    result = determine_subscription_access(
        {"status": "past_due"},
        now=NOW,
    )

    assert result.level == AccessLevel.NONE


def test_no_subscription_has_no_access():
    result = determine_subscription_access(
        None,
        now=NOW,
    )

    assert result.level == AccessLevel.NONE


def test_cancelled_subscription_is_read_only():
    result = determine_subscription_access(
        {"status": "cancelled"},
        now=NOW,
    )

    assert result.level == AccessLevel.READ_ONLY


def test_incomplete_subscription_has_no_access():
    result = determine_subscription_access(
        {"status": "incomplete"},
        now=NOW,
    )

    assert result.level == AccessLevel.NONE


def test_future_trial_is_supported():
    result = determine_subscription_access(
        {
            "status": "trialing",
            "trial_ends_at": (
                NOW + timedelta(days=14)
            ).isoformat(),
        },
        now=NOW,
    )

    assert result.level == AccessLevel.FULL


def test_expired_trial_is_read_only():
    result = determine_subscription_access(
        {
            "status": "trialing",
            "trial_ends_at": (
                NOW - timedelta(days=1)
            ).isoformat(),
        },
        now=NOW,
    )

    assert result.level == AccessLevel.READ_ONLY


def test_trial_without_expiry_has_no_access():
    result = determine_subscription_access(
        {"status": "trialing"},
        now=NOW,
    )

    assert result.level == AccessLevel.NONE
