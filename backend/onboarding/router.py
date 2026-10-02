from fastapi import APIRouter, Depends, HTTPException, status

from backend.auth.dependencies import get_authenticated_user_id
from backend.database.supabase_client import supabase
from backend.legal.version import (
    PRIVACY_POLICY_VERSION,
    TERMS_VERSION,
)

from .schema import OnboardingRequest


router = APIRouter(
    prefix="/onboarding",
    tags=["onboarding"],
)


@router.post("")
def complete_onboarding(
    data: OnboardingRequest,
    user_id: str = Depends(get_authenticated_user_id),
):
    try:
        if data.terms_version != TERMS_VERSION:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The Terms of Service version is no longer current.",
            )

        if data.privacy_policy_version != PRIVACY_POLICY_VERSION:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The Privacy Policy version is no longer current.",
            )

        profile_result = (
            supabase
            .table("profiles")
            .upsert(
                {
                    "user_id": user_id,
                    "full_name": data.full_name.strip(),
                },
                on_conflict="user_id",
            )
            .execute()
        )

        if not profile_result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user profile.",
            )

        organisation_result = (
            supabase
            .table("organisations")
            .insert(
                {
                    "name": data.organisation_name,
                    "owner_user_id": user_id,
                }
            )
            .execute()
        )

        if not organisation_result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create organisation.",
            )

        organisation = organisation_result.data[0]
        organisation_id = organisation["id"]

        membership_result = (
            supabase
            .table("organisation_members")
            .insert(
                {
                    "organisation_id": organisation_id,
                    "user_id": user_id,
                    "role": "OWNER",
                }
            )
            .execute()
        )

        if not membership_result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create organisation membership.",
            )

        site_result = (
            supabase
            .table("sites")
            .insert(
                {
                    "organisation_id": organisation_id,
                    "name": data.site_name,
                }
            )
            .execute()
        )

        if not site_result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create receiving site.",
            )

        site = site_result.data[0]
        site_id = site["id"]

        site_profile_result = (
            supabase
            .table("site_profiles")
            .insert(
                {
                    "site_id": site_id,
                    "organisation_name": data.organisation_name,
                    "site_name": data.site_name,
                    "full_address": data.full_address,
                    "postcode": data.postcode,
                    "authorisation_number": data.authorisation_number.strip(),
                    "api_code": str(data.api_code),
                    "email_address": data.email_address,
                    "phone_number": data.phone_number,
                }
            )
            .execute()
        )

        if not site_profile_result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create site profile.",
            )

        legal_acceptance_result = (
            supabase
            .table("legal_acceptances")
            .insert(
                {
                    "user_id": user_id,
                    "organisation_id": organisation_id,
                    "terms_version": TERMS_VERSION,
                    "privacy_policy_version": PRIVACY_POLICY_VERSION,
                }
            )
            .execute()
        )

        if not legal_acceptance_result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to record legal acceptance.",
            )

        return {
            "status": "ONBOARDING_COMPLETE",
            "organisation_id": organisation_id,
            "site_id": site_id,
        }

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to complete onboarding.",
        )