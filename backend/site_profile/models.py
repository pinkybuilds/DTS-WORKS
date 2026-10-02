from dataclasses import dataclass
from typing import Optional


@dataclass
class SiteAddress:
    full_address: str
    postcode: str


@dataclass
class SiteProfile:
    organisation_name: str
    site_name: str
    address: SiteAddress
    authorisation_number: str
    api_code: str
    email_address: Optional[str] = None
    phone_number: Optional[str] = None