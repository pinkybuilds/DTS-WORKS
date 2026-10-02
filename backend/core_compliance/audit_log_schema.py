from datetime import datetime
from enum import Enum
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

from .validators.authorisations import is_valid_uk_authorisation_number
from .validators.postcodes import is_valid_uk_postcode
from .validators.registrations import (
    is_valid_broker_registration,
    is_valid_carrier_registration,
)


class PhysicalForm(str, Enum):
    GAS = "Gas"
    LIQUID = "Liquid"
    SOLID = "Solid"
    POWDER = "Powder"
    SLUDGE = "Sludge"
    MIXED = "Mixed"


class WeightUnit(str, Enum):
    GRAMS = "Grams"
    KILOGRAMS = "Kilograms"
    TONNES = "Tonnes"


class MeansOfTransport(str, Enum):
    ROAD = "Road"
    RAIL = "Rail"
    AIR = "Air"
    SEA = "Sea"
    INLAND_WATERWAY = "Inland Waterway"
    PIPED = "Piped"
    OTHER = "Other"


class ComponentSource(str, Enum):
    NOT_PROVIDED = "NOT_PROVIDED"
    PROVIDED_WITH_WASTE = "PROVIDED_WITH_WASTE"
    GUIDANCE = "GUIDANCE"
    OWN_TESTING = "OWN_TESTING"


class CarrierRegistrationReason(str, Enum):
    ON_SITE = "ON_SITE"
    HOUSEHOLD = "HOUSEHOLD"
    ONE_OFF = "ONE_OFF"
    MARINE = "MARINE"


class NoConsignmentReason(str, Enum):
    NON_HAZ_WASTE_TRANSFER = "NON_HAZ_WASTE_TRANSFER"
    NO_DOC_WITH_WASTE = "NO_DOC_WITH_WASTE"
    HWRC_RECEIPT = "HWRC_RECEIPT"


class Weight(BaseModel):
    metric: WeightUnit
    amount: float = Field(..., gt=0)
    is_estimate: bool


class Address(BaseModel):
    full_address: str = Field(..., min_length=1)
    postcode: str = Field(..., min_length=1)

    @field_validator("postcode")
    @classmethod
    def validate_postcode(cls, value: str) -> str:
        if not is_valid_uk_postcode(value):
            raise ValueError(
                "Address postcode must be a valid UK postcode"
            )

        return value


class ReceiptAddress(BaseModel):
    full_address: str = Field(..., min_length=1)
    postcode: str = Field(..., min_length=1)

    @field_validator("postcode")
    @classmethod
    def validate_postcode(cls, value: str) -> str:
        if not is_valid_uk_postcode(value):
            raise ValueError(
                "Receipt postcode must be a valid UK postcode"
            )
        return value


class OtherReference(BaseModel):
    label: str = Field(..., min_length=1)
    reference: str = Field(..., min_length=1)


class PopsComponent(BaseModel):
    code: str = Field(..., min_length=1)
    concentration: Optional[float] = Field(default=None, gt=0)


class PopsData(BaseModel):
    source_of_components: ComponentSource
    components: Optional[List[PopsComponent]] = None


class HazardousComponent(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1)
    concentration: Optional[float] = Field(default=None, gt=0)


class HazardousWasteData(BaseModel):
    source_of_components: ComponentSource
    haz_codes: List[str] = Field(..., min_length=1)
    components: Optional[List[HazardousComponent]] = None


class DisposalRecoveryCode(BaseModel):
    code: str = Field(..., min_length=1)
    weight: Weight


class WasteItem(BaseModel):
    ewc_codes: List[str] = Field(..., min_length=1, max_length=5)
    waste_description: str = Field(..., min_length=1)
    physical_form: PhysicalForm
    number_of_containers: int = Field(..., ge=0)
    type_of_containers: str = Field(..., min_length=1)
    weight: Weight

    contains_pops: bool
    pops: Optional[PopsData] = None

    contains_hazardous: bool
    hazardous: Optional[HazardousWasteData] = None

    disposal_or_recovery_codes: Optional[List[DisposalRecoveryCode]] = None


class MovementDetails(BaseModel):
    api_code: UUID
    date_time_received: datetime

    unique_reference_id: Optional[str] = None
    other_references: Optional[List[OtherReference]] = None

    special_handling_requirements: Optional[str] = Field(
        default=None,
        max_length=5000,
    )

    hazardous_waste_consignment_code: Optional[str] = None
    reason_for_no_consignment_code: Optional[NoConsignmentReason] = None


class CarrierDetails(BaseModel):
    registration_number: Optional[str] = None
    reason_for_no_registration_number: Optional[
        CarrierRegistrationReason
    ] = None

    organisation_name: str = Field(..., min_length=1)

    address: Optional[Address] = None
    email_address: Optional[EmailStr] = None
    phone_number: Optional[str] = None

    vehicle_registration: Optional[str] = Field(
        default=None,
        max_length=10,
    )

    means_of_transport: MeansOfTransport

    @field_validator("registration_number")
    @classmethod
    def validate_registration_number(
        cls,
        value: Optional[str],
    ) -> Optional[str]:
        if value is None or value.strip() == "":
            return value

        if not is_valid_carrier_registration(value):
            raise ValueError(
                "Carrier registration number must be in a valid UK format"
            )

        return value

    @model_validator(mode="after")
    def validate_registration_reason(self):
        registration_number = self.registration_number
        reason = self.reason_for_no_registration_number

        if registration_number is None or registration_number.strip() == "":
            if reason is None:
                raise ValueError(
                    "Reason for no carrier registration number is required"
                )
        elif reason is not None:
            raise ValueError(
                "Reason for no carrier registration number must not be "
                "provided when a registration number is supplied"
            )

        return self

    @model_validator(mode="after")
    def validate_vehicle_registration(self):
        if self.means_of_transport == MeansOfTransport.ROAD:
            if (
                self.vehicle_registration is None
                or self.vehicle_registration.strip() == ""
            ):
                raise ValueError(
                    "Vehicle registration is required when means of "
                    "transport is Road"
                )
        elif self.vehicle_registration is not None:
            if self.vehicle_registration.strip() != "":
                raise ValueError(
                    "Vehicle registration is only applicable when means "
                    "of transport is Road"
                )

        return self


class BrokerDealerDetails(BaseModel):
    organisation_name: str = Field(..., min_length=1)
    address: Optional[Address] = None
    email_address: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    registration_number: Optional[str] = None

    @field_validator("registration_number")
    @classmethod
    def validate_registration_number(
        cls,
        value: Optional[str],
    ) -> Optional[str]:
        if value is None or value.strip() == "":
            return value

        if not is_valid_broker_registration(value):
            raise ValueError(
                "Broker/dealer registration number must be in a valid UK format"
            )

        return value


class WasteReceiverDetails(BaseModel):
    site_name: str = Field(..., min_length=1)
    email_address: Optional[EmailStr] = None
    phone_number: Optional[str] = None

    authorisation_number: str = Field(..., min_length=1)

    regulatory_position_statements: Optional[List[int]] = Field(
        default=None,
        min_length=1,
    )

    @field_validator("regulatory_position_statements")
    @classmethod
    def validate_regulatory_position_statements(
        cls,
        value: Optional[List[int]],
    ) -> Optional[List[int]]:
        if value is None:
            return value

        if any(rps < 1 for rps in value):
            raise ValueError(
                "Regulatory position statement numbers must be at least 1"
            )

        return value

    @field_validator("authorisation_number")
    @classmethod
    def validate_authorisation_number(cls, value: str) -> str:
        if not is_valid_uk_authorisation_number(value):
            raise ValueError(
                "Site authorisation number must be in a valid UK format"
            )

        return value



class Receipt(BaseModel):
    address: ReceiptAddress


class AuditLogSchema(BaseModel):
    movement: MovementDetails
    waste_items: List[WasteItem] = Field(..., min_length=1)

    carrier: CarrierDetails
    broker: Optional[BrokerDealerDetails] = None

    receiver: WasteReceiverDetails
    receipt: Receipt
