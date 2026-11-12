
from dataclasses import dataclass

from fastapi import Depends, Header, HTTPException, status

from backend.auth.access_context import OrganisationAccessContext
from backend.auth.access_dependencies import get_access_context
from backend.database.supabase_client import supabase


@dataclass(frozen=True)
class SiteAccessContext:
    organisation_id: str
    site_id: str


def get_site_context(
    organisation_context: OrganisationAccessContext = Depends(
        get_access_context
    ),
    selected_site_id: str | None = Header(
        default=None,
        alias="X-Site-ID",
    ),
) -> SiteAccessContext:
    """
    Resolve a site belonging to the already-verified organisation.

    Behaviour:
    - One site: select automatically.
    - Multiple sites: require an explicit X-Site-ID.
    - Explicit site: verify it belongs to the selected organisation.
    """

    organisation_id = organisation_context.organisation_id

    try:
        # An explicitly selected site must belong to the
        # organisation already verified for this user.
        if selected_site_id:
            result = (
                supabase.table("sites")
                .select("id")
                .eq("id", selected_site_id)
                .eq("organisation_id", organisation_id)
                .limit(1)
                .execute()
            )

            if not result.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=(
                        "The selected site was not found "
                        "in this organisation."
                    ),
                )

            site_id = str(result.data[0]["id"])

            return SiteAccessContext(
                organisation_id=organisation_id,
                site_id=site_id,
            )

        # No site was supplied. Check how many sites
        # belong to the selected organisation.
        result = (
            supabase.table("sites")
            .select("id")
            .eq("organisation_id", organisation_id)
            .limit(2)
            .execute()
        )

        sites = result.data or []

        if not sites:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No receiving site found for this organisation.",
            )

        if len(sites) > 1:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Site selection required. "
                    "Please select a site before continuing."
                ),
            )

        return SiteAccessContext(
            organisation_id=organisation_id,
            site_id=str(sites[0]["id"]),
        )

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to verify site access.",
        )
