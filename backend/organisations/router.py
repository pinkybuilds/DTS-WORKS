
from fastapi import APIRouter, Depends, HTTPException, status
from backend.auth.dependencies import get_authenticated_user_id
from backend.auth.access_context import OrganisationAccessContext
from backend.auth.access_dependencies import get_access_context
from backend.database.supabase_client import supabase

router = APIRouter(
    prefix="/organisations",
    tags=["organisations"],
)


@router.get("")
def get_user_organisations(
    user_id: str = Depends(get_authenticated_user_id),
):
    """
    Return only the organisations that the authenticated user
    belongs to, together with their role in each organisation.
    """

    try:
        membership_result = (
            supabase
            .table("organisation_members")
            .select("organisation_id, role")
            .eq("user_id", user_id)
            .execute()
        )

        memberships = membership_result.data or []

        if not memberships:
            return []

        organisation_ids = [
            membership["organisation_id"]
            for membership in memberships
            if membership.get("organisation_id")
        ]

        if not organisation_ids:
            return []

        organisation_result = (
            supabase
            .table("organisations")
            .select("id, name")
            .in_("id", organisation_ids)
            .execute()
        )

        organisations = organisation_result.data or []

        organisation_lookup = {
            str(organisation["id"]): organisation
            for organisation in organisations
        }

        result = []

        for membership in memberships:
            organisation_id = membership.get("organisation_id")

            if not organisation_id:
                continue

            organisation = organisation_lookup.get(
                str(organisation_id)
            )

            if not organisation:
                continue

            result.append(
                {
                    "organisation_id": str(organisation["id"]),
                    "organisation_name": organisation["name"],
                    "role": str(membership.get("role") or "").upper(),
                }
            )

        return result

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to retrieve your organisations.",
        )


@router.get("/sites")
def get_organisation_sites(
    access_context: OrganisationAccessContext = Depends(get_access_context),
):
    """
    Return the sites belonging to the selected organisation.
    The organisation is verified through get_access_context.
    """

    try:
        result = (
            supabase
            .table("sites")
            .select("id, name")
            .eq("organisation_id", access_context.organisation_id)
            .execute()
        )

        sites = result.data or []

        return [
            {
                "site_id": str(site["id"]),
                "site_name": site["name"],
            }
            for site in sites
        ]

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to retrieve your organisation's sites.",
        )
