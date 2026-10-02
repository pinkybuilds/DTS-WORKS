
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class ReviewStatus(str, Enum):
    OPEN = "OPEN"
    RESOLVED = "RESOLVED"


class ReviewType(str, Enum):
    AUTHORISATION = "AUTHORISATION"
    MISSING_INFORMATION = "MISSING_INFORMATION"
    REGULATORY_CONDITION = "REGULATORY_CONDITION"
    MANUAL_CHECK = "MANUAL_CHECK"


class ComplianceReview(BaseModel):
    review_type: ReviewType
    status: ReviewStatus = ReviewStatus.OPEN

    title: str = Field(..., min_length=1)
    reason: str = Field(..., min_length=1)

    field: Optional[str] = None
    value: Optional[str] = None

    resolution: Optional[str] = None

