import os

import stripe
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from backend.auth.dependencies import get_authenticated_user_id
from backend.database.supabase_client import supabase
from backend.stripe.client import stripe_client


load_dotenv()


router = APIRouter(
    prefix="/stripe",
    tags=["stripe"],
)


class CheckoutRequest(BaseModel):
    plan: str


class CheckoutSessionResponse(BaseModel):
    checkout_url: str


PLAN_PRICE_IDS = {
    "starter": os.getenv("STRIPE_STARTER_PRICE_ID"),
    "professional": os.getenv("STRIPE_PROFESSIONAL_PRICE_ID"),
    "business": os.getenv("STRIPE_BUSINESS_PRICE_ID"),
}


PLAN_NAMES = {
    "starter": "Starter",
    "professional": "Professional",
    "business": "Business",
}


FRONTEND_URL = os.getenv(
    "DTS_FRONTEND_URL",
    "http://localhost:3000",
)


def get_organisation_id(user_id: str) -> str:
    membership_result = (
        supabase
        .table("organisation_members")
        .select("organisation_id")
        .eq("user_id", user_id)
        .order("created_at", desc=False)
        .limit(1)
        .execute()
    )

    if not membership_result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No organisation membership found.",
        )

    return membership_result.data[0]["organisation_id"]


def get_organisation_name(organisation_id: str) -> str:
    organisation_result = (
        supabase
        .table("organisations")
        .select("name")
        .eq("id", organisation_id)
        .limit(1)
        .execute()
    )

    if not organisation_result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organisation not found.",
        )

    return organisation_result.data[0]["name"]


def get_user_email(user_id: str) -> str:
    try:
        response = supabase.auth.admin.get_user_by_id(user_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve the authenticated user's account.",
        )

    user = response.user

    if not user or not user.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid email address is required before payment.",
        )

    return user.email


def get_or_create_stripe_customer(
    organisation_id: str,
    organisation_name: str,
    email: str,
) -> str:
    metadata = {
        "dts_organisation_id": organisation_id,
    }

    # First look for an existing DTS Works customer for this organisation.
    # Email is only used to narrow the Stripe customer list; the metadata
    # is what identifies the organisation.
    customer_list = stripe_client.v1.customers.list(
        params={
            "email": email,
            "limit": 100,
        },
    )

    for customer in customer_list.data:
        if (
            customer.metadata
            and customer.metadata.get("dts_organisation_id")
            == organisation_id
        ):
            return customer.id

    # No existing customer was found for this organisation.
    customer = stripe_client.v1.customers.create(
        params={
            "name": organisation_name,
            "email": email,
            "metadata": metadata,
        },
    )

    return customer.id


@router.post(
    "/create-checkout-session",
    response_model=CheckoutSessionResponse,
)
def create_checkout_session(
    payload: CheckoutRequest,
    user_id: str = Depends(get_authenticated_user_id),
):
    plan = payload.plan.strip().lower()

    # ---------------------------------------------------------
    # 1. Validate requested plan
    # ---------------------------------------------------------

    if plan not in PLAN_PRICE_IDS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid plan selected.",
        )

    price_id = PLAN_PRICE_IDS[plan]

    if not price_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                f"Stripe price configuration is missing for "
                f"the {PLAN_NAMES[plan]} plan."
            ),
        )

    # ---------------------------------------------------------
    # 2. Resolve authenticated user's organisation
    # ---------------------------------------------------------

    organisation_id = get_organisation_id(user_id)
    organisation_name = get_organisation_name(organisation_id)

    # ---------------------------------------------------------
    # 3. Get authenticated user's email
    # ---------------------------------------------------------

    email = get_user_email(user_id)

    # ---------------------------------------------------------
    # 4. Find or create Stripe Customer
    # ---------------------------------------------------------

    try:
        customer_id = get_or_create_stripe_customer(
            organisation_id=organisation_id,
            organisation_name=organisation_name,
            email=email,
        )

        # -----------------------------------------------------
        # 5. Create Stripe Checkout Session
        # -----------------------------------------------------

        session = stripe_client.v1.checkout.sessions.create(
            params={
                "mode": "subscription",
                "customer": customer_id,
                "client_reference_id": organisation_id,
                "line_items": [
                    {
                        "price": price_id,
                        "quantity": 1,
                    }
                ],
                "metadata": {
                    "dts_organisation_id": organisation_id,
                    "dts_plan": plan,
                },
                "subscription_data": {
                    "metadata": {
                        "dts_organisation_id": organisation_id,
                        "dts_plan": plan,
                    },
                },
                "success_url": (
                    f"{FRONTEND_URL}/onboarding"
                    f"?checkout=success&plan={plan}"
                ),
                "cancel_url": (
                    f"{FRONTEND_URL}/onboarding"
                    f"?checkout=cancelled&plan={plan}"
                ),
            },
        )

    except stripe.StripeError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "We couldn't connect to Stripe right now. "
                "Please try again."
            ),
        )

    if not session.url:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Stripe did not return a checkout URL.",
        )

    return CheckoutSessionResponse(
        checkout_url=session.url,
    )