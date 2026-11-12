import logging
import os
import uuid
import stripe
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from backend.auth.dependencies import get_authenticated_user_id
from backend.database.supabase_client import supabase
from backend.stripe.client import stripe_client, STRIPE_MODE

logger = logging.getLogger("uvicorn.error")

router = APIRouter(
    prefix="/stripe",
    tags=["stripe"],
)


class CheckoutRequest(BaseModel):
    plan: str
    attempt_id: uuid.UUID


class CheckoutSessionResponse(BaseModel):
    checkout_url: str
    session_id: str




if STRIPE_MODE == "test":
    PLAN_PRICE_IDS = {
        "starter": os.getenv("STRIPE_TEST_STARTER_PRICE_ID"),
        "professional": os.getenv("STRIPE_TEST_PROFESSIONAL_PRICE_ID"),
        "business": os.getenv("STRIPE_TEST_BUSINESS_PRICE_ID"),
    }
elif STRIPE_MODE == "live":
    PLAN_PRICE_IDS = {
        "starter": os.getenv("STRIPE_STARTER_PRICE_ID"),
        "professional": os.getenv("STRIPE_PROFESSIONAL_PRICE_ID"),
        "business": os.getenv("STRIPE_BUSINESS_PRICE_ID"),
    }
else:
    raise RuntimeError(
        "STRIPE_MODE must be either 'test' or 'live'."
    )

PLAN_NAMES = {
    "starter": "Starter",
    "professional": "Professional",
    "business": "Business",
}


FRONTEND_URL = os.getenv(
    "DTS_FRONTEND_URL",
    "http://localhost:3000",
)


# These subscription statuses block a new subscription.
# Stripe's official cancellation status is "canceled".
BLOCKING_SUBSCRIPTION_STATUSES = {
    "active",
    "trialing",
    "past_due",
    "unpaid",
    "incomplete",
    "paused",
}


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
        logger.exception(
            "Could not retrieve authenticated user email."
        )
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
    """
    Reuse the organisation's mapped Stripe customer.
    Recover an existing customer using organisation metadata.
    Create a customer only when no existing customer is found.
    Never overwrite an existing organisation mapping.
    """

    def get_saved_mapping():
        result = (
            supabase
            .table("organisation_stripe_customers")
            .select("stripe_customer_id")
            .eq("organisation_id", organisation_id)
            .eq("stripe_mode", STRIPE_MODE)
            .limit(1)
            .execute()
        )

        if result.data:
            return result.data[0]["stripe_customer_id"]

        return None

    def save_mapping_without_overwriting(customer_id: str) -> str:
        """
        Insert the mapping if it does not exist.
        If another request wins the race, return its saved mapping.
        Never replace an existing mapping.
        """

        try:
            supabase.table(
                "organisation_stripe_customers"
            ).insert(
                {
                    "organisation_id": organisation_id,
                    "stripe_mode": STRIPE_MODE,
                    "stripe_customer_id": customer_id,
                }
            ).execute()

            return customer_id

        except Exception:
            # Another request may have inserted the mapping first.
            existing_customer_id = get_saved_mapping()

            if existing_customer_id:
                logger.info(
                    "Using existing Stripe customer mapping after "
                    "a concurrent mapping insert for organisation_id=%s",
                    organisation_id,
                )
                return existing_customer_id

            # No mapping exists, so this was not a recoverable
            # organisation-mapping race. Preserve the original error.
            raise

    try:
        # 1. Check the database mapping first.
        existing_customer_id = get_saved_mapping()

        if existing_customer_id:
            return existing_customer_id

        # 2. Search Stripe using the stable organisation ID.
        # Email is deliberately not used as the identity lookup.
        customers = stripe_client.v1.customers.search(
            params={
                "query": (
                    f"metadata['dts_organisation_id']:'{organisation_id}'"
                ),
                "limit": 100,
            }
        )

        matching_customers = [
            customer
            for customer in customers.data
            if not customer.deleted
            and (
                customer.metadata.to_dict()
                if customer.metadata
                else {}
            ).get("dts_organisation_id") == organisation_id
        ]

        if matching_customers:
            if len(matching_customers) > 1:
                logger.error(
                    "Multiple Stripe customers found for organisation_id=%s",
                    organisation_id,
                )
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        "Multiple billing customers were found for your "
                        "organisation. Please contact support."
                    ),
                )

            recovered_customer_id = matching_customers[0].id

            canonical_customer_id = save_mapping_without_overwriting(
                recovered_customer_id
            )

            logger.info(
                "Recovered Stripe customer mapping for organisation_id=%s",
                organisation_id,
            )

            return canonical_customer_id

        # 3. No existing customer found: create one.
        customer = stripe_client.v1.customers.create(
            params={
                "name": organisation_name,
                "email": email,
                "metadata": {
                    "dts_organisation_id": organisation_id,
                },
            },
            options={
                "idempotency_key": (
                    f"dts-customer-{STRIPE_MODE}-{organisation_id}"
                ),
            },
        )

        # 4. Save the mapping without overwriting a concurrent winner.
        canonical_customer_id = save_mapping_without_overwriting(
            customer.id
        )

        logger.info(
            "Created or recovered Stripe customer mapping "
            "for organisation_id=%s",
            organisation_id,
        )

        return canonical_customer_id

    except HTTPException:
        raise

    except stripe.StripeError:
        logger.exception(
            "Stripe customer lookup or creation failed for "
            "organisation_id=%s",
            organisation_id,
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "We couldn't connect to Stripe right now. Please try again."
            ),
        )

    except Exception:
        logger.exception(
            "Could not save or retrieve Stripe customer mapping "
            "for organisation_id=%s",
            organisation_id,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Unable to set up your billing customer. Please try again."
            ),
        )


def get_existing_subscription(
    customer_id: str,
    organisation_id: str,
):
    # Stripe is the source of truth for the current subscription status.
    subscriptions = stripe_client.v1.subscriptions.list(
        params={
            "customer": customer_id,
            "status": "all",
            "limit": 100,
        },
    )

    for subscription in subscriptions.data:
        metadata = (
            subscription.metadata.to_dict()
            if subscription.metadata
            else {}
        )

        # Ignore subscriptions not explicitly associated with this
        # DTS Works organisation.
        if metadata.get("dts_organisation_id") != organisation_id:
            continue

        if subscription.status in BLOCKING_SUBSCRIPTION_STATUSES:
            return subscription

    # Canceled and expired subscriptions do not block re-subscription.
    return None


def get_open_checkout_session(
    customer_id: str,
    organisation_id: str,
    plan: str,
):
    sessions = stripe_client.v1.checkout.sessions.list(
        params={
            "customer": customer_id,
            "status": "open",
            "limit": 100,
        },
    )

    for session in sessions.data:
        if session.mode != "subscription" or not session.url:
            continue

        metadata = (
            session.metadata.to_dict()
            if session.metadata
            else {}
        )

        # Only reuse or block sessions associated with this organisation.
        if (
            metadata.get("dts_organisation_id") != organisation_id
            and session.client_reference_id != organisation_id
        ):
            continue

        session_plan = metadata.get("dts_plan")

        if session_plan == plan:
            # The customer can continue their existing checkout.
            return session

        # Another plan's checkout is already open for this organisation.
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Your organisation already has a checkout session "
                "in progress. Complete or cancel that checkout "
                "before starting another."
            ),
        )

    return None


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
    # 1. Validate the requested plan
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
    # 2. Resolve the organisation and authenticated user's email
    # ---------------------------------------------------------

    organisation_id = get_organisation_id(user_id)
    organisation_name = get_organisation_name(organisation_id)
    email = get_user_email(user_id)

    try:
        # -----------------------------------------------------
        # 3. Find or create the organisation's Stripe customer
        # -----------------------------------------------------

        customer_id = get_or_create_stripe_customer(
            organisation_id=organisation_id,
            organisation_name=organisation_name,
            email=email,
        )

        # -----------------------------------------------------
        # 4. Prevent another subscription while one is current
        # -----------------------------------------------------

        existing_subscription = get_existing_subscription(
            customer_id=customer_id,
            organisation_id=organisation_id,
        )

        if existing_subscription:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Your organisation already has a subscription "
                    f"with status '{existing_subscription.status}'. "
                    "Manage or resolve that subscription before "
                    "starting another checkout."
                ),
            )

        # -----------------------------------------------------
        # 5. Reuse an open checkout instead of creating duplicates
        # -----------------------------------------------------

        open_session = get_open_checkout_session(
            customer_id=customer_id,
            organisation_id=organisation_id,
            plan=plan,
        )

        if open_session:
            return CheckoutSessionResponse(
                checkout_url=open_session.url,
                session_id=open_session.id,
            )

        # -----------------------------------------------------
        # 6. Create a new Stripe Checkout Session
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
            options={
                "idempotency_key": (
                    f"dts-checkout-{STRIPE_MODE}-"
                    f"{organisation_id}-{payload.attempt_id}"
                ),
            },
        )

    except HTTPException:
        raise

    except stripe.StripeError:
        logger.exception(
            "Stripe checkout failed for organisation_id=%s",
            organisation_id,
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "We couldn't connect to Stripe right now. "
                "Please try again."
            ),
        )
    except Exception:
        logger.exception(
            "Could not create checkout session for organisation_id=%s",
            organisation_id,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create your checkout session. Please try again.",
        )

    if not session.url:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Stripe did not return a checkout URL.",
        )

    return CheckoutSessionResponse(
        checkout_url=session.url,
        session_id=session.id,
    )


class ExpireCheckoutSessionRequest(BaseModel):
    session_id: str


@router.post("/expire-checkout-session")
def expire_checkout_session(
    payload: ExpireCheckoutSessionRequest,
    user_id: str = Depends(get_authenticated_user_id),
):
    organisation_id = get_organisation_id(user_id)

    try:
        customer_id = (
            supabase
            .table("organisation_stripe_customers")
            .select("stripe_customer_id")
            .eq("organisation_id", organisation_id)
            .eq("stripe_mode", STRIPE_MODE)
            .limit(1)
            .execute()
        )

        if not customer_id.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Billing customer not found.",
            )

        stripe_customer_id = customer_id.data[0]["stripe_customer_id"]

        session = stripe_client.v1.checkout.sessions.retrieve(
            payload.session_id,
        )
        session_customer_id = getattr(
         session.customer,
        "id",
       session.customer,
       )

        metadata = (
            session.metadata.to_dict()
            if session.metadata
            else {}
        )

        if (
            session.mode != "subscription"
            or session_customer_id != stripe_customer_id
            or metadata.get("dts_organisation_id") != organisation_id
            or session.client_reference_id != organisation_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This checkout session does not belong to your organisation.",
            )

        if session.status == "expired":
            return {"status": "expired"}

        if session.status != "open":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This checkout session can no longer be expired.",
            )

        expired_session = (
            stripe_client.v1.checkout.sessions.expire(
                session.id,
            )
        )

        return {"status": expired_session.status}

    except HTTPException:
        raise

    except stripe.StripeError:
        logger.exception(
            "Could not expire checkout session for organisation_id=%s",
            organisation_id,
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="We couldn't update your checkout session. Please try again.",
        )
    
    except Exception:
        logger.exception(
            "Could not expire checkout session or retrieve "
            "billing customer for organisation_id=%s",
            organisation_id,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update your checkout session. Please try again.",
        )