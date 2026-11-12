
from fastapi import Depends, HTTPException, status

from backend.auth.access_context import (
    OrganisationAccessContext,
    get_organisation_access_context,
)
from backend.auth.dependencies import get_authenticated_user_id


def get_access_context(
    user_id: str = Depends(get_authenticated_user_id),
) -> OrganisationAccessContext:
    """
    Resolve the authenticated user's organisation and access rights.
    """

    return get_organisation_access_context(user_id)


def require_read_access(
    context: OrganisationAccessContext = Depends(get_access_context),
) -> OrganisationAccessContext:
    """
    Allow users with FULL or READ_ONLY access to view existing records.
    """

    if context.access.level.value == "none":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your organisation does not have operational access.",
        )

    return context


def require_full_access(
    context: OrganisationAccessContext = Depends(get_access_context),
) -> OrganisationAccessContext:
    """
    Allow only users with FULL access to perform operational actions.
    """

    if context.access.level.value != "full":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Full operational access is required. "
                "Please check your organisation's subscription."
            ),
        )

    return context
