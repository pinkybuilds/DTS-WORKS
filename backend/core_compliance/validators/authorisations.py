
import re


# England
ENGLAND_PATTERNS = [
    re.compile(r"^EAWML\d{5,6}$", re.IGNORECASE),
    re.compile(r"^WML\d{5,6}$", re.IGNORECASE),
    re.compile(r"^E[A-Z]{2}\d{4}[A-Z]{2}$", re.IGNORECASE),
    re.compile(r"^EPR/[A-Z]{2}\d{4}[A-Z]{2}$", re.IGNORECASE),
    re.compile(r"^[A-Z]{2}\d{4}[A-Z]{2}/D\d{4}$", re.IGNORECASE),
    re.compile(r"^EPR/[A-Z]{2}\d{4}[A-Z]{2}/D\d{4}$", re.IGNORECASE),
]


# Scotland (SEPA)
SCOTLAND_PATTERNS = [
    re.compile(r"^PPC/A/\d{7}$", re.IGNORECASE),
    re.compile(r"^WML/L/\d{7}$", re.IGNORECASE),
    re.compile(r"^PPC/A/SEPA\d{4}-\d{4}$", re.IGNORECASE),
    re.compile(r"^PPC/W/\d{7}$", re.IGNORECASE),
    re.compile(r"^PPC/N/\d{7}$", re.IGNORECASE),
    re.compile(r"^PPC/E/\d{7}$", re.IGNORECASE),
    re.compile(r"^WML/L/SEPA\d{4}-\d{4}$", re.IGNORECASE),
    re.compile(r"^WML/W/\d{7}$", re.IGNORECASE),
    re.compile(r"^WML/E/\d{7}$", re.IGNORECASE),
    re.compile(r"^WML/N/\d{7}$", re.IGNORECASE),
    re.compile(r"^WML/L/\d{7}/\d{2}$", re.IGNORECASE),
    re.compile(r"^WML/W/\d{7}/\d{2}$", re.IGNORECASE),
    re.compile(r"^WML/N/\d{7}/\d{2}$", re.IGNORECASE),
    re.compile(r"^WML/E/\d{7}/\d{2}$", re.IGNORECASE),
    re.compile(r"^EAS/P/\d{6}$", re.IGNORECASE),
]


# Wales (NRW)
WALES_PATTERNS = [
    re.compile(r"^[A-Z]{2}\d{4}[A-Z]{2}$", re.IGNORECASE),
    re.compile(r"^EPR/[A-Z]{2}\d{4}[A-Z]{2}$", re.IGNORECASE),
]


# Northern Ireland (NIEA)
NORTHERN_IRELAND_PATTERNS = [
    # P permit formats
    re.compile(r"^P\d{4}/\d{2}[A-Z]$", re.IGNORECASE),
    re.compile(r"^P\d{4}/\d{2}[A-Z]/V\d+$", re.IGNORECASE),

    # WPPC formats
    re.compile(r"^WPPC\s?\d{2}/\d{2}$", re.IGNORECASE),
    re.compile(r"^WPPC\s?\d{2}/\d{2}/V\d+$", re.IGNORECASE),

    # WML file reference
    re.compile(r"^WML\s?\d{2}/\d+$", re.IGNORECASE),
    re.compile(r"^WML\s?\d{2}/\d+/T$", re.IGNORECASE),

    # LN licence number
    re.compile(
        r"^LN/\d{2}/\d+(?:/(?:M|T|C|N|V\d+))*$",
        re.IGNORECASE,
    ),

    # PAC format
    re.compile(r"^PAC/\d{4}/WCL\d{3}$", re.IGNORECASE),

    # Combined WML + LN
    re.compile(
        r"^WML\s?\d{2}/\d+(?:/T)?\s+LN/\d{2}/\d+(?:/(?:M|T|C|N|V\d+))*$",
        re.IGNORECASE,
    ),

    # Combined WML + PAC
    re.compile(
        r"^WML\s?\d{2}/\d+(?:/T)?\s+PAC/\d{4}/WCL\d{3}$",
        re.IGNORECASE,
    ),
]


INVALID_AUTHORISATION_MESSAGE = (
    "Site authorisation number must be in a valid UK format"
)


def is_valid_uk_authorisation_number(value: str) -> bool:
    """
    Validate a receiver site authorisation number against
    the UK Home Nations formats specified by DEFRA.
    """

    if not isinstance(value, str):
        return False

    value = value.strip()

    if not value:
        return False

    patterns = (
        ENGLAND_PATTERNS
        + SCOTLAND_PATTERNS
        + WALES_PATTERNS
        + NORTHERN_IRELAND_PATTERNS
    )

    return any(pattern.fullmatch(value) for pattern in patterns)

