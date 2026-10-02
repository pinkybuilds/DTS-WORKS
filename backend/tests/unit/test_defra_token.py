"""
Throwaway standalone check for Phase 1: can we successfully obtain a DEFRA
OAuth access token from the sandbox using our real Client ID/Secret?

This script is NOT part of the application and does not touch any waste
movement / schema / mapper / compliance logic. It only proves whether
authentication itself works.

Run with:
    python test_defra_token.py
"""

import os
from dotenv import load_dotenv

# Load backend/.env so DEFRA_CLIENT_ID / DEFRA_CLIENT_SECRET / DEFRA_OAUTH_URL
# are available as environment variables.
load_dotenv(os.path.join("backend", ".env"))

from backend.gateway.defra_auth import defra_token_cache
from backend.gateway.exceptions import RodaProtocolError


def main():
    print("Attempting to obtain DEFRA OAuth access token...")
    print(f"DEFRA_OAUTH_URL = {os.environ.get('DEFRA_OAUTH_URL')}")
    print(f"DEFRA_CLIENT_ID set? {'yes' if os.environ.get('DEFRA_CLIENT_ID') else 'NO - MISSING'}")
    print(f"DEFRA_CLIENT_SECRET set? {'yes' if os.environ.get('DEFRA_CLIENT_SECRET') else 'NO - MISSING'}")

    try:
        token = defra_token_cache.get_token()
    except RodaProtocolError as e:
        print("\nFAILED to obtain token.")
        print(f"  error_id: {e.error_id}")
        print(f"  message: {e.message}")
        print(f"  extra_context: {e.extra_context}")
        return

    print("\nSUCCESS - obtained a token.")
    print(f"  token length: {len(token)} characters")
    print(f"  token preview: {token[:15]}...{token[-6:]}")
    print(f"  cached expiry (UTC): {defra_token_cache._expires_at}")


if __name__ == "__main__":
    main()
