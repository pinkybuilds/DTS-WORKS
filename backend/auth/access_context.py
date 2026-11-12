
from dataclasses import dataclass
from typing import Any

from fastapi import HTTPException, status

from backend.auth.access_policy import (
    AccessDecision,
    AccessLevel,
    determine_subscription_access,
)
from backend.database.supabase_client import supabase


@dataclass(frozen=True)
class OrganisationAccessContext:
    organisation_id: str
    role: str
    subscription: dict[str, Any] | None
    access: AccessDecision


CURRENT_SUBSCRIPTION_STATUSES = {
    "active",
    "trialing",
    "past_due",
    "unpaid",
    "paused",
    "incomplete",
}


def get_organisation_access_context(
    user_id: str,
) -> OrganisationAccessContext:
    """
    Resolve the authenticated user's organisation, membership role,
    subscription and effective access level.

    Current product assumption: one organisation per user.
    Ambiguous memberships or subscriptions fail closed.
    """

    try:
        membership_result = (
            supabase.table("organisation_members")
            .select("organisation_id, role")
            .eq("user_id", user_id)
            .limit(2)
            .execute()
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to verify organisation membership.",
        )

    memberships = membership_result.data or []

    if not memberships:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No organisation membership found.",
        )

    if len(memberships) != 1:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Multiple organisation memberships require selection.",
        )

    membership = memberships[0]

    organisation_id = membership.get("organisation_id")
    role = str(membership.get("role") or "").upper()

    if not organisation_id or not role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organisation membership is incomplete.",
        )

    try:
        subscription_result = (
            supabase.table("subscriptions")
            .select(
                "status, payment_failed_at, grace_period_ends_at, "
                "created_at, updated_at"
            )
            .eq("organisation_id", organisation_id)
            .order("updated_at", desc=True)
            .execute()
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to verify organisation subscription.",
        )

    subscriptions = subscription_result.data or []

    current_subscriptions = [
        item
        for item in subscriptions
        if str(item.get("status") or "").lower()
        in CURRENT_SUBSCRIPTION_STATUSES
    ]

    if len(current_subscriptions) > 1:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Multiple current subscriptions found. Please contact support.",
        )

    if current_subscriptions:
        subscription = current_subscriptions[0]
    elif subscriptions:
        # No current subscription: use the most recently updated
        # historical record to determine whether access is read-only.
        subscription = subscriptions[0]
    else:
        subscription = None

    access = determine_subscription_access(subscription)

    return OrganisationAccessContext(
        organisation_id=str(organisation_id),
        role=role,
        subscription=subscription,
        access=access,
    )
