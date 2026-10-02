
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class ComplianceStatus(str, Enum):
    PASS = "PASS"
    WARNING = "WARNING"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    BLOCKED = "BLOCKED"


class ComplianceIssue(BaseModel):
    code: str = Field(..., min_length=1)
    title: str = Field(..., min_length=1)
    message: str = Field(..., min_length=1)

    field: Optional[str] = None
    value: Optional[str] = None


class ComplianceResult(BaseModel):
    status: ComplianceStatus

    issues: List[ComplianceIssue] = Field(
        default_factory=list
    )

