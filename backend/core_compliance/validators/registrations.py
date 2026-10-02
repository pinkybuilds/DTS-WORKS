import re

# England / Wales

ENGLAND_WALES_PATTERNS = [
    re.compile(r"^CBDL\d+$", re.IGNORECASE),
    re.compile(r"^CBDU\d+$", re.IGNORECASE),
]

# Scotland

SCOTLAND_PATTERNS = [
    re.compile(r"^WCR/R/\d{7}$", re.IGNORECASE),
    re.compile(r"^SCO/\d{6}$", re.IGNORECASE),
    re.compile(r"^SEA/\d{6}$", re.IGNORECASE),
    re.compile(r"^SNO/\d{6}$", re.IGNORECASE),
    re.compile(r"^SWE/\d{6}$", re.IGNORECASE),
    re.compile(r"^WCR/\d{6}$", re.IGNORECASE),
    re.compile(r"^PCT-[A-Z]-\d{3,7}$", re.IGNORECASE),
]

# Northern Ireland

NORTHERN_IRELAND_PATTERNS = [
    re.compile(r"^ROC\s?UT\s?\d{1,5}$", re.IGNORECASE),
    re.compile(r"^ROC\s?LT\s?\d{1,5}$", re.IGNORECASE),
]


def is_valid_uk_registration_number(value: str) -> bool:
    """
    Validate a waste carrier, broker or dealer registration number
    against the Home Nations formats specified by DEFRA.
    """

    if not isinstance(value, str):
        return False

    value = value.strip()

    if not value:
        return False

    patterns = (
        ENGLAND_WALES_PATTERNS
        + SCOTLAND_PATTERNS
        + NORTHERN_IRELAND_PATTERNS
    )

    return any(pattern.fullmatch(value) for pattern in patterns)


def is_valid_carrier_registration(value: str) -> bool:
    """
    Validate a waste carrier registration number.
    """

    return is_valid_uk_registration_number(value)


def is_valid_broker_registration(value: str) -> bool:
    """
    Validate a waste broker/dealer registration number.
    """

    return is_valid_uk_registration_number(value)




