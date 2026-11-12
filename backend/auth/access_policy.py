
from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
from typing import Any


class AccessLevel(str, Enum):
    FULL = "full"
    READ_ONLY = "read_only"
    NONE = "none"


@dataclass(frozen=True)
class AccessDecision:
    level: AccessLevel
    reason: str


def _parse_datetime(value: Any) -> datetime | None:
    if not value:
        return None

    if isinstance(value, datetime):
        parsed = value
    elif isinstance(value, str):
        try:
            parsed = datetime.fromisoformat(
                value.replace("Z", "+00:00")
            )
        except ValueError:
            return None
    else:
        return None

    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)

    return parsed.astimezone(timezone.utc)


def determine_subscription_access(
    subscription: dict[str, Any] | None,
    now: datetime | None = None,
) -> AccessDecision:
    """
    Determine an organisation's access level from its subscription.

    This function is deliberately independent of database access,
    authentication and HTTP routes.
    """

    if not subscription:
        return AccessDecision(
            AccessLevel.NONE,
            "no_subscription",
        )

    now = now or datetime.now(timezone.utc)

    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)

    now = now.astimezone(timezone.utc)

    status = str(subscription.get("status") or "").lower()

    if status == "active":
        return AccessDecision(
            AccessLevel.FULL,
            "subscription_active",
        )

    # Future trial support:
    # Add trial_ends_at to subscriptions when trials are introduced.
    # A trial must have a valid, future expiry to grant access.
    if status == "trialing":
        trial_ends_at = _parse_datetime(
            subscription.get("trial_ends_at")
        )

        if trial_ends_at and now < trial_ends_at:
            return AccessDecision(
                AccessLevel.FULL,
                "trial_active",
            )

        if trial_ends_at:
            return AccessDecision(
                AccessLevel.READ_ONLY,
                "trial_expired",
            )

        return AccessDecision(
            AccessLevel.NONE,
            "trial_expiry_missing",
        )

    if status == "past_due":
        payment_failed_at = _parse_datetime(
            subscription.get("payment_failed_at")
        )
        grace_period_ends_at = _parse_datetime(
            subscription.get("grace_period_ends_at")
        )

        # No grace period is granted unless a renewal failure
        # has been explicitly recorded.
        if not payment_failed_at or not grace_period_ends_at:
            return AccessDecision(
                AccessLevel.NONE,
                "payment_failure_not_verified",
            )

        if now < grace_period_ends_at:
            return AccessDecision(
                AccessLevel.FULL,
                "payment_grace_period",
            )

        return AccessDecision(
            AccessLevel.READ_ONLY,
            "payment_grace_period_expired",
        )

    if status in {
        "cancelled",
        "canceled",
        "unpaid",
        "paused",
    }:
        return AccessDecision(
            AccessLevel.READ_ONLY,
            "subscription_not_active",
        )

    if status in {
        "incomplete",
        "incomplete_expired",
    }:
        return AccessDecision(
            AccessLevel.NONE,
            "initial_payment_incomplete",
        )

    return AccessDecision(
        AccessLevel.NONE,
        "subscription_status_not_recognised",
    )
