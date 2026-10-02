


from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class AuthorisationProfileStatus(str, Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"


class AuthorisationIdentity(BaseModel):
    site_name: str = Field(..., min_length=1)
    authorisation_number: str = Field(..., min_length=1)
    authorisation_type: str = Field(..., min_length=1)
    regulator: str = Field(..., min_length=1)
    jurisdiction: str = Field(..., min_length=1)


class WasteScope(BaseModel):
    permitted_ewc_codes: List[str] = Field(default_factory=list)
    hazardous_waste_permitted: bool
    pop_waste_permitted: bool


class AuthorisedOperation(BaseModel):
    code: str = Field(..., min_length=1)
    description: Optional[str] = None
    ewc_codes: Optional[List[str]] = None


class QuantityLimit(BaseModel):
    period: str = Field(..., min_length=1)
    amount: float = Field(..., gt=0)
    unit: str = Field(..., min_length=1)
    ewc_codes: Optional[List[str]] = None
    operation_codes: Optional[List[str]] = None
    description: Optional[str] = None


class Exclusions(BaseModel):
    excluded_ewc_codes: List[str] = Field(default_factory=list)
    excluded_waste_types: List[str] = Field(default_factory=list)
    other_exclusions: List[str] = Field(default_factory=list)


class AuthorisationCondition(BaseModel):
    description: str = Field(..., min_length=1)
    review_required: bool = True
    reference: Optional[str] = None


class ConditionsAndRestrictions(BaseModel):
    conditions: List[AuthorisationCondition] = Field(
        default_factory=list
    )
    restrictions: List[AuthorisationCondition] = Field(
        default_factory=list
    )


class AuthorisationEvidence(BaseModel):
    source: str = Field(..., min_length=1)
    reference: Optional[str] = None
    notes: Optional[str] = None


class AuthorisationProfile(BaseModel):
    status: AuthorisationProfileStatus = (
        AuthorisationProfileStatus.DRAFT
    )

    identity: AuthorisationIdentity

    waste_scope: WasteScope

    authorised_operations: List[AuthorisedOperation] = Field(
        default_factory=list
    )

    quantity_limits: List[QuantityLimit] = Field(
        default_factory=list
    )

    exclusions: Exclusions

    conditions_and_restrictions: ConditionsAndRestrictions

    evidence: List[AuthorisationEvidence] = Field(
        default_factory=list
    )

