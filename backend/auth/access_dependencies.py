
from fastapi import Depends, Header, HTTPException, status

from backend.auth.access_context import (
    OrganisationAccessContext,
    get_organisation_access_context,
)
from backend.auth.dependencies import get_authenticated_user_id


def get_access_context(
    user_id: str = Depends(get_authenticated_user_id),
    organisation_id: str | None = Header(
        default=None,
        alias="X-Organisation-ID",
    ),
) -> OrganisationAccessContext:
    return get_organisation_access_context(
        user_id=user_id,
        organisation_id=organisation_id,
    )


def require_read_access(
    context: OrganisationAccessContext = Depends(get_access_context),
) -> OrganisationAccessContext:
    if context.access.level.value == "none":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your organisation does not have operational access.",
        )

    return context


def require_full_access(
    context: OrganisationAccessContext = Depends(get_access_context),
) -> OrganisationAccessContext:
    if context.access.level.value != "full":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Full operational access is required. "
                "Please check your organisation's subscription."
            ),
        )

    return context

