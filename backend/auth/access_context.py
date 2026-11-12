
from dataclasses import dataclass
from typing import Any

from fastapi import HTTPException, status

from backend.auth.access_policy import (
    AccessDecision,
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


VALID_ORGANISATION_ROLES = {
    "OWNER",
    "ADMIN",
    "MEMBER",
}


def get_organisation_access_context(
    user_id: str,
    organisation_id: str | None = None,
) -> OrganisationAccessContext:
    """
    Resolve the authenticated user's selected organisation,
    membership role, subscription and subscription access level.

    Users may belong to multiple organisations.

    If an organisation ID is supplied, the user must be a member
    of that organisation.

    If no organisation ID is supplied:
    - One membership is selected automatically.
    - Multiple memberships require explicit selection.

    Organisation IDs are context selectors, never proof of access.
    Membership is always verified against the authenticated user.
    """

    try:
        membership_result = (
            supabase.table("organisation_members")
            .select("organisation_id, role")
            .eq("user_id", user_id)
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

    # If an organisation was explicitly selected, verify that
    # the authenticated user actually belongs to it.
    if organisation_id:
        matching_memberships = [
            membership
            for membership in memberships
            if str(membership.get("organisation_id")) == str(organisation_id)
        ]

        if not matching_memberships:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this organisation.",
            )

        membership = matching_memberships[0]

    else:
        # Automatically select only when there is exactly one
        # organisation membership.
        if len(memberships) > 1:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Organisation selection required.",
            )

        membership = memberships[0]

    selected_organisation_id = membership.get("organisation_id")
    role = str(membership.get("role") or "").upper()

    if not selected_organisation_id or role not in VALID_ORGANISATION_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organisation membership is incomplete or invalid.",
        )

    # Retrieve subscription information for the selected
    # organisation only.
    try:
        subscription_result = (
            supabase.table("subscriptions")
            .select(
                "status, payment_failed_at, grace_period_ends_at, "
                "created_at, updated_at"
            )
            .eq("organisation_id", selected_organisation_id)
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
            detail=(
                "Multiple current subscriptions found. "
                "Please contact support."
            ),
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
        organisation_id=str(selected_organisation_id),
        role=role,
        subscription=subscription,
        access=access,
    )
