
import os
from pathlib import Path

import stripe
from dotenv import load_dotenv


# Explicitly load the backend environment file.
BACKEND_ENV = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(BACKEND_ENV)

STRIPE_MODE = os.getenv("STRIPE_MODE", "live").strip().lower()

if STRIPE_MODE == "test":
    STRIPE_SECRET_KEY = os.getenv("STRIPE_TEST_SECRET_KEY")
elif STRIPE_MODE == "live":
    STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
else:
    raise RuntimeError(
        "STRIPE_MODE must be either 'live' or 'test'."
    )

if not STRIPE_SECRET_KEY:
    raise RuntimeError(
        f"Stripe secret key is not configured for {STRIPE_MODE} mode."
    )

stripe_client = stripe.StripeClient(STRIPE_SECRET_KEY)
