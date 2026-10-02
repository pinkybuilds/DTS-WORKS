from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class SiteAddressResponse(BaseModel):
    full_address: str = Field(..., min_length=1)
    postcode: str = Field(..., min_length=1)


class SiteProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    organisation_name: str = Field(..., min_length=1)
    site_name: str = Field(..., min_length=1)
    address: SiteAddressResponse
    authorisation_number: str = Field(..., min_length=1)
    api_code: str = Field(..., min_length=1)
    email_address: Optional[str] = None
    phone_number: Optional[str] = None


class SiteAddressRequest(BaseModel):
    full_address: str = Field(..., min_length=1)
    postcode: str = Field(..., min_length=1)


class SiteProfileRequest(BaseModel):
    organisation_name: str = Field(..., min_length=1)
    site_name: str = Field(..., min_length=1)
    address: SiteAddressRequest
    authorisation_number: str = Field(..., min_length=1)
    api_code: str = Field(..., min_length=1)
    email_address: Optional[str] = None
    phone_number: Optional[str] = None