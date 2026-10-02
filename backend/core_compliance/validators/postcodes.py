# backend/core_compliance/validators/postcodes.py

import re


UK_POSTCODE_PATTERN = re.compile(
    r"^(GIR\s?0AA|"
    r"(?:(?:[A-Z]{1,2}\d[A-Z\d]?)|"
    r"(?:[A-Z]{1,2}\d{2}))"
    r"\s?\d[A-Z]{2})$",
    re.IGNORECASE,
)


def is_valid_uk_postcode(value: str) -> bool:
    if not isinstance(value, str):
        return False

    value = value.strip()

    if not value:
        return False

    return bool(UK_POSTCODE_PATTERN.fullmatch(value))


def is_valid_uk_or_irish_postcode(value: str) -> bool:
    if not isinstance(value, str):
        return False

    value = value.strip()

    if not value:
        return False

    if is_valid_uk_postcode(value):
        return True

    return is_valid_irish_postcode(value)


def is_valid_irish_postcode(value: str) -> bool:
    if not isinstance(value, str):
        return False

    value = value.strip().upper()

    if not value:
        return False

    # Republic of Ireland Eircode format:
    # Routing key + unique identifier.
    return bool(
        re.fullmatch(
            r"[A-Z]\d{2}\s?[A-Z0-9]{4}",
            value,
        )
    )