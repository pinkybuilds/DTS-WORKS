import os

import stripe
from dotenv import load_dotenv


load_dotenv()


STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")

if not STRIPE_SECRET_KEY:
    raise RuntimeError("STRIPE_SECRET_KEY is not configured.")


stripe_client = stripe.StripeClient(STRIPE_SECRET_KEY)