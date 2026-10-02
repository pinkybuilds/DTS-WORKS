from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class OnboardingRequest(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=200)

    organisation_name: str = Field(..., min_length=1, max_length=200)
    site_name: str = Field(..., min_length=1, max_length=200)

    full_address: str = Field(..., min_length=1, max_length=500)
    postcode: str = Field(..., min_length=1, max_length=8)

    authorisation_number: str = Field(..., min_length=1, max_length=100)
    api_code: UUID

    email_address: Optional[str] = None
    phone_number: Optional[str] = None

    terms_version: str = Field(..., min_length=1)
    privacy_policy_version: str = Field(..., min_length=1)