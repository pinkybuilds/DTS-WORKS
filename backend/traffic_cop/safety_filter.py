
from better_profanity import profanity


# Initialize profanity filter
profanity.load_censor_words()
profanity.add_censor_words(
    ["fck", "fck off", "shit", "bitch"]
)


def safety_filter(text: str) -> dict:
    """
    Scans text for inappropriate language.

    This filter is a content-safety layer only.
    It does not classify waste, detect hazardous materials,
    determine EWC codes, or make compliance decisions.
    """

    has_profanity = profanity.contains_profanity(text)

    cleaned_text = (
        profanity.censor(text)
        if has_profanity
        else text
    )

    return {
        "is_safe": not has_profanity,
        "original_text": text,
        "censored_text": cleaned_text,
        "flags": {
            "profanity": has_profanity,
        },
    }


