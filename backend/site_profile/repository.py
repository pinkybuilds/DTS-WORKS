
from fastapi import HTTPException, status

from backend.database.supabase_client import supabase

from .models import SiteAddress, SiteProfile


class SiteProfileRepository:
    def get_site_profile(self, site_id: str) -> SiteProfile:
        profile_result = (
            supabase
            .table("site_profiles")
            .select(
                "organisation_name, "
                "site_name, "
                "full_address, "
                "postcode, "
                "authorisation_number, "
                "api_code, "
                "email_address, "
                "phone_number"
            )
            .eq("site_id", site_id)
            .limit(1)
            .execute()
        )

        if not profile_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Site profile not found.",
            )

        data = profile_result.data[0]

        return SiteProfile(
            organisation_name=data["organisation_name"],
            site_name=data["site_name"],
            address=SiteAddress(
                full_address=data["full_address"],
                postcode=data["postcode"],
            ),
            authorisation_number=data["authorisation_number"],
            api_code=data["api_code"],
            email_address=data.get("email_address"),
            phone_number=data.get("phone_number"),
        )

    def save_site_profile(
        self,
        site_id: str,
        site_profile: SiteProfile,
    ) -> SiteProfile:
        update_result = (
            supabase
            .table("site_profiles")
            .update(
                {
                    "organisation_name": site_profile.organisation_name,
                    "site_name": site_profile.site_name,
                    "full_address": site_profile.address.full_address,
                    "postcode": site_profile.address.postcode,
                    "authorisation_number": site_profile.authorisation_number,
                    "api_code": site_profile.api_code,
                    "email_address": site_profile.email_address,
                    "phone_number": site_profile.phone_number,
                }
            )
            .eq("site_id", site_id)
            .execute()
        )

        if not update_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Site profile not found.",
            )

        return site_profile
