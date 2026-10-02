import os

import httpx

from dotenv import load_dotenv

from backend.gateway.defra_auth import defra_token_cache
from backend.gateway.exceptions import ServiceUnavailableError


load_dotenv(os.path.join("backend", ".env"))

DEFRA_API_BASE_URL = os.environ.get("DEFRA_API_BASE_URL")

if not DEFRA_API_BASE_URL:
    raise RuntimeError(
        "DEFRA_API_BASE_URL is missing from backend/.env"
    )


class DefraClient:
    def submit_receipt(self, payload: dict):
        token = defra_token_cache.get_token()

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        url = f"{DEFRA_API_BASE_URL}/movements/receive"

        try:
            response = httpx.post(
                url,
                headers=headers,
                json=payload,
                timeout=30.0,
            )

            print("\nDEFRA RECEIPT RESPONSE")
            print("======================")
            print(f"HTTP status: {response.status_code}")
            print(f"Response: {response.text}")

            return response

        except httpx.RequestError as exc:
            raise ServiceUnavailableError(
                "Unable to connect to DEFRA."
            ) from exc


defra_client = DefraClient()