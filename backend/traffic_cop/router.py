
from backend.traffic_cop.safety_filter import safety_filter


MAX_INPUT_LENGTH = 2000


def handle_waste_intake(user_input_text: str):
    """
    Performs lightweight intake protection before the main
    waste/compliance pipeline.

    This router:
    - protects against oversized text input
    - runs the content safety filter
    - reports profanity findings
    - does not classify waste
    - does not assign EWC codes
    - does not determine compliance
    - does not route hazardous waste
    """

    if user_input_text is None:
        return {
            "status": "REVIEW_REQUIRED",
            "message": "Waste description is required.",
        }

    if len(user_input_text) > MAX_INPUT_LENGTH:
        return {
            "status": "INPUT_TOO_LONG",
            "message": (
                f"Input text exceeds the maximum allowed length of "
                f"{MAX_INPUT_LENGTH} characters. Please shorten your "
                "description."
            ),
        }

    safety_result = safety_filter(user_input_text)

    if safety_result["flags"]["profanity"]:
        return {
            "status": "SAFETY_REVIEW",
            "message": (
                "Inappropriate language detected in the text description. "
                "Please revise the description."
            ),
            "safety": safety_result,
        }

    return {
        "status": "READY_FOR_INTAKE",
        "message": "Input passed the initial safety check.",
        "safety": safety_result,
    }

