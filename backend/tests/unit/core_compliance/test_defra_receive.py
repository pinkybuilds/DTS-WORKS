"""
Standalone DEFRA Receipt API test.

Purpose:
    1. Obtain a valid OAuth access token using the existing token cache.
    2. Submit one basic waste receipt to the DEFRA external test environment.
    3. Print the HTTP status and response so we can inspect what DEFRA accepts.

This is NOT part of the production application yet.
"""

import os
from datetime import datetime, timezone

import httpx
from dotenv import load_dotenv

from backend.gateway.defra_auth import defra_token_cache


# Load backend/.env
load_dotenv(os.path.join("backend", ".env"))


# ============================================================
# TEST CONFIGURATION
# ============================================================

# Paste one of DEFRA's official dummy TEST apiCodes here.
# Do NOT use a real production apiCode.
TEST_API_CODE = "1f83215e-4b90-4785-9ab2-2614839aa2e9"


def main():
    # --------------------------------------------------------
    # 1. Check configuration
    # --------------------------------------------------------

    base_url = os.environ.get("DEFRA_API_BASE_URL")

    if not base_url:
        print("ERROR: DEFRA_API_BASE_URL is missing from .env")
        return

    if not TEST_API_CODE:
        print("ERROR: TEST_API_CODE is blank.")
        print("Paste one of DEFRA's official dummy test API codes into the script.")
        return

    # Remove accidental trailing slash so we don't produce //
    base_url = base_url.rstrip("/")

    receive_url = f"{base_url}/movements/receive"

    print("DEFRA Receipt API test")
    print("----------------------")
    print(f"API URL: {receive_url}")
    print(f"API code set? {'yes' if TEST_API_CODE else 'NO'}")

    # --------------------------------------------------------
    # 2. Get OAuth access token
    # --------------------------------------------------------

    print("\nObtaining OAuth access token...")

    try:
        access_token = defra_token_cache.get_token()
    except Exception as e:
        print("\nFAILED to obtain OAuth token.")
        print(f"Error: {e}")
        return

    print("SUCCESS - OAuth access token obtained.")
    print(f"Token length: {len(access_token)} characters")

    # --------------------------------------------------------
    # 3. Build the test Receipt API payload
    # --------------------------------------------------------

    timestamp = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    payload = {
        "apiCode": TEST_API_CODE,
        "dateTimeReceived": timestamp,

        "wasteItems": [
            {
                "ewcCodes": [
                    "020101"
                ],
                "wasteDescription": "Basic mixed construction and demolition waste",
                "physicalForm": "Mixed",
                "numberOfContainers": 3,
                "typeOfContainers": "SKI",
                "weight": {
                    "metric": "Tonnes",
                    "amount": 2.5,
                    "isEstimate": False
                },
                "containsHazardous": False,
                "containsPops": False,
                "disposalOrRecoveryCodes": [
                    {
                        "code": "R1",
                        "weight": {
                            "metric": "Tonnes",
                            "amount": 0.75,
                            "isEstimate": False
                        }
                    }
                ]
            }
        ],

        "carrier": {
            "organisationName": "Carrier Ltd",
            "registrationNumber": "CBDL999999",
            "meansOfTransport": "Rail"
        },

        "receiver": {
            "siteName": "Receiver Ltd",
            "emailAddress": "receiver@test.com",
            "authorisationNumber": "PPC/A/9999999"
        },

        "receipt": {
            "address": {
                "fullAddress": "123 Test Street, Test City",
                "postcode": "TC1 2AB"
            }
        }
    }

    # --------------------------------------------------------
    # 4. Send request to DEFRA
    # --------------------------------------------------------

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    print("\nSending POST request...")
    print(f"POST {receive_url}")

    try:
        response = httpx.post(
            receive_url,
            headers=headers,
            json=payload,
            timeout=30.0,
        )

    except httpx.RequestError as e:
        print("\nNETWORK ERROR")
        print(str(e))
        return

    # --------------------------------------------------------
    # 5. Show exactly what DEFRA returned
    # --------------------------------------------------------

    print("\nDEFRA RESPONSE")
    print("--------------")
    print(f"Status code: {response.status_code}")
    print(f"Reason: {response.reason_phrase}")

    print("\nResponse body:")

    try:
        print(response.json())
    except ValueError:
        print(response.text)

    # --------------------------------------------------------
    # 6. Interpret the result
    # --------------------------------------------------------

    if response.status_code == 201:
        print("\n🎉 SUCCESS")
        print("DEFRA accepted the Receipt API request.")

    elif response.status_code == 400:
        print("\n⚠️ VALIDATION ERROR")
        print("Authentication worked, but DEFRA rejected something in the request.")
        print("Inspect the response body above.")

    elif response.status_code == 401:
        print("\n❌ AUTHENTICATION ERROR")
        print("The Bearer token was not accepted by the Receipt API.")

    elif response.status_code == 403:
        print("\n❌ AUTHORISATION ERROR")
        print("The authenticated client is not authorised for this request.")

    else:
        print("\n⚠️ UNEXPECTED RESPONSE")
        print("Keep the status code and response body for investigation.")


if __name__ == "__main__":
    main()