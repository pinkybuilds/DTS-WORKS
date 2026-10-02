from fastapi import HTTPException, status

from backend.database.supabase_client import supabase

from .models import SiteAddress, SiteProfile


class SiteProfileRepository:
    def _get_user_site_id(self, user_id: str) -> str:
        membership_result = (
            supabase
            .table("organisation_members")
            .select("organisation_id")
            .eq("user_id", user_id)
            .order("created_at", desc=False)
            .limit(1)
            .execute()
        )

        if not membership_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No organisation membership found.",
            )

        organisation_id = membership_result.data[0]["organisation_id"]

        site_result = (
            supabase
            .table("sites")
            .select("id")
            .eq("organisation_id", organisation_id)
            .order("created_at", desc=False)
            .limit(1)
            .execute()
        )

        if not site_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No receiving site found.",
            )

        return site_result.data[0]["id"]

    def get_site_id(self, user_id: str) -> str:
        return self._get_user_site_id(user_id)

    def get_site_profile(self, user_id: str) -> SiteProfile:
        site_id = self._get_user_site_id(user_id)

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
        user_id: str,
        site_profile: SiteProfile,
    ) -> SiteProfile:
        site_id = self._get_user_site_id(user_id)

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