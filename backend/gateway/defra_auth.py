"""
DEFRA OAuth2 Client Credentials authentication.

Implements the two-step flow described in DEFRA's "Receipt of Waste - API
Authentication Guide":

  1. Exchange Client ID + Client Secret (via HTTP Basic Auth) for a Bearer
     access token, by POSTing to the OAuth service's /oauth2/token endpoint.
  2. That Bearer token is then used on subsequent calls to the Receipt API
     itself (handled by a future defra_client.py, not this file).

This module is intentionally scoped to ONLY step 1 (obtaining/caching the
token). It does not know about waste movements, the Receipt API endpoints,
or any business logic - just "can we get a valid token from DEFRA".
"""

import base64
import os
from datetime import datetime, timedelta

import httpx
from dotenv import load_dotenv

from backend.gateway.exceptions import AuthenticationError, ServiceUnavailableError
load_dotenv()

# A small safety buffer so we refresh the token slightly *before* it
# actually expires, rather than risking a request going out with a token
# that expires mid-flight.
_TOKEN_EXPIRY_SAFETY_BUFFER_SECONDS = 30


class DefraTokenCache:
    """
    Caches a single DEFRA OAuth2 access token in memory for this process.

    TODO(prod-scaling): Replace this in-memory OAuth token cache with a
    Redis/shared cache before production deployment when running multiple
    workers or horizontal scaling. The current approach assumes a single
    process holds the only copy of the token, which is correct for a single
    dev server but will cause each worker to independently re-authenticate
    once you scale out to multiple processes/instances.
    """

    def __init__(self):
        self._access_token: str | None = None
        self._expires_at: datetime | None = None

    def _load_credentials(self) -> tuple[str, str, str]:
        """
        Reads DEFRA OAuth credentials/config from environment variables.
        Never hardcodes or logs the actual secret values.
        """
        client_id = os.environ.get("DEFRA_CLIENT_ID")
        client_secret = os.environ.get("DEFRA_CLIENT_SECRET")
        token_url = os.environ.get("DEFRA_OAUTH_URL")

        missing = [
            name
            for name, value in (
                ("DEFRA_CLIENT_ID", client_id),
                ("DEFRA_CLIENT_SECRET", client_secret),
                ("DEFRA_OAUTH_URL", token_url),
            )
            if not value
        ]
        if missing:
            raise AuthenticationError(
                f"Missing required DEFRA OAuth environment variable(s): {', '.join(missing)}"
            )

        return client_id, client_secret, token_url

    def _fetch_new_token(self) -> None:
        """
        Performs the actual OAuth2 Client Credentials exchange with DEFRA's
        sandbox/production OAuth service, exactly as shown in DEFRA's
        authentication guide (Basic auth header + form-encoded payload).
        """
        client_id, client_secret, token_url = self._load_credentials()

        client_credentials = f"{client_id}:{client_secret}"
        encoded_credentials = base64.b64encode(client_credentials.encode()).decode()

        headers = {
            "Authorization": f"Basic {encoded_credentials}",
            "Content-Type": "application/x-www-form-urlencoded",
        }
        payload = {
            "grant_type": "client_credentials",
            "client_id": client_id,
            "client_secret": client_secret,
        }

        try:
            response = httpx.post(
                f"{token_url}/oauth2/token",
                headers=headers,
                data=payload,
                timeout=15.0,
            )
            response.raise_for_status()
        except httpx.HTTPStatusError as e:
            # DEFRA rejected our credentials or the request itself.
            raise AuthenticationError(
                "DEFRA OAuth token request failed.",
                extra_context={
                    "status_code": e.response.status_code,
                    "response_body": e.response.text,
                },
            )
        except httpx.RequestError as e:
            # Network-level failure (DNS, timeout, connection refused, etc.)
            raise ServiceUnavailableError(
                "Could not reach DEFRA OAuth service.",
                extra_context={"error": str(e)},
            )

        token_response = response.json()
        access_token = token_response.get("access_token")
        if not access_token:
            raise AuthenticationError(
                "DEFRA OAuth response did not include an access_token.",
                extra_context={"response_body": token_response},
            )

        # Cognito's client_credentials tokens include "expires_in" (seconds).
        # Default to a conservative 300s (5 min) if it's ever missing, so we
        # never accidentally cache a token forever.
        expires_in_seconds = token_response.get("expires_in", 300)
        buffered_ttl = max(
            expires_in_seconds - _TOKEN_EXPIRY_SAFETY_BUFFER_SECONDS, 0
        )

        self._access_token = access_token
        self._expires_at = datetime.utcnow() + timedelta(seconds=buffered_ttl)

    def get_token(self) -> str:
        """
        Returns a valid Bearer access token, reusing the cached one if it's
        still valid, otherwise fetching a fresh one from DEFRA.
        """
        if self._access_token and self._expires_at and datetime.utcnow() < self._expires_at:
            return self._access_token

        self._fetch_new_token()
        return self._access_token


# Module-level singleton so the whole app shares one in-memory cache
# (see the TODO on DefraTokenCache regarding multi-worker deployments).
defra_token_cache = DefraTokenCache()
