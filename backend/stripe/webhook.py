
import logging
import os
import uuid
from datetime import datetime, timezone
from functools import wraps
from typing import Any, Callable

import stripe
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Request, status

from backend.database.supabase_client import supabase
from backend.stripe.client import stripe_client


load_dotenv()

logger = logging.getLogger("uvicorn.error")

router = APIRouter(
    prefix="/stripe",
    tags=["stripe"],
)


STRIPE_MODE = os.getenv("STRIPE_MODE", "live").strip().lower()

if STRIPE_MODE == "test":
    STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_TEST_WEBHOOK_SECRET")

    PLAN_PRICE_IDS = {
        "starter": os.getenv("STRIPE_TEST_STARTER_PRICE_ID"),
        "professional": os.getenv("STRIPE_TEST_PROFESSIONAL_PRICE_ID"),
        "business": os.getenv("STRIPE_TEST_BUSINESS_PRICE_ID"),
    }

elif STRIPE_MODE == "live":
    STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

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

PLAN_BY_PRICE_ID = {
    price_id: plan
    for plan, price_id in PLAN_PRICE_IDS.items()
    if price_id
}


SUPPORTED_EVENT_TYPES = {
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "checkout.session.completed",
    "invoice.paid",
    "invoice.payment_failed",
}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def stripe_timestamp_to_iso(timestamp: int | None) -> str | None:
    if timestamp is None:
        return None
    return datetime.fromtimestamp(timestamp, tz=timezone.utc).isoformat()


def to_plain_dict(value: Any) -> dict:
    if isinstance(value, dict):
        return value
    if hasattr(value, "_to_dict_recursive"):
        return value._to_dict_recursive()
    if hasattr(value, "to_dict_recursive"):
        return value.to_dict_recursive()
    if hasattr(value, "to_dict"):
        return value.to_dict()
    raise TypeError("Stripe object could not be converted to a dictionary.")


def get_organisation_id_from_subscription(
    subscription: dict,
) -> str | None:
    metadata = subscription.get("metadata") or {}
    return metadata.get("dts_organisation_id")



def get_plan_from_subscription(subscription: dict) -> str:
    items = subscription.get("items", {}).get("data", [])

    if len(items) != 1:
        raise ValueError(
            "Stripe subscription must contain exactly one subscription item."
        )

    price = items[0].get("price") or {}
    stripe_price_id = price.get("id")

    if not stripe_price_id:
        raise ValueError(
            "Stripe subscription item is missing a price ID."
        )

    price_plan = PLAN_BY_PRICE_ID.get(stripe_price_id)

    if not price_plan:
        raise ValueError(
            "Stripe subscription contains an unknown price ID."
        )

    metadata = subscription.get("metadata") or {}
    metadata_plan = metadata.get("dts_plan")

    if metadata_plan and metadata_plan != price_plan:
        raise ValueError(
            "Stripe subscription plan metadata does not match its price."
        )

    return price_plan



def get_subscription_row(stripe_subscription_id: str):
    result = (
        supabase.table("subscriptions")
        .select("id, organisation_id")
        .eq("stripe_subscription_id", stripe_subscription_id)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


def get_invoice_subscription_id(invoice: dict) -> str | None:
    parent = invoice.get("parent") or {}
    subscription_details = parent.get("subscription_details") or {}

    subscription_reference = (
        subscription_details.get("subscription")
        or invoice.get("subscription")
    )

    if isinstance(subscription_reference, dict):
        return subscription_reference.get("id")

    return subscription_reference




def sync_subscription(subscription: dict) -> tuple[str, str]:
    stripe_subscription_id = subscription.get("id")

    if not stripe_subscription_id:
        raise ValueError("Stripe subscription is missing its ID.")

    organisation_id = get_organisation_id_from_subscription(subscription)

    if not organisation_id:
        raise ValueError(
            "Stripe subscription is missing dts_organisation_id metadata."
        )
    stripe_status = subscription.get("status")

    subscription_status = (
        "cancelled" if stripe_status == "canceled" else stripe_status
    )

    allowed_statuses = {
        "active",
        "trialing",
        "past_due",
        "cancelled",
        "unpaid",
        "incomplete",
        "incomplete_expired",
        "paused",
    }

    if subscription_status not in allowed_statuses:
        raise ValueError(
            f"Stripe subscription has an unsupported status: "
            f"{stripe_status!r}"
        )
    # Check whether this Stripe subscription already belongs
    # to a different organisation in our database.
    existing = get_subscription_row(stripe_subscription_id)

    if existing and existing["organisation_id"] != organisation_id:
        logger.error(
            "Stripe subscription organisation mismatch: "
            "subscription_id=%s existing_organisation_id=%s "
            "incoming_organisation_id=%s",
            stripe_subscription_id,
            existing["organisation_id"],
            organisation_id,
        )

        raise ValueError(
            "Stripe subscription organisation does not match "
            "the existing DTS Works subscription record."
        )

    # Determines the plan from the actual Stripe price
    # and validates any dts_plan metadata.
    plan = get_plan_from_subscription(subscription)

    items = subscription.get("items", {}).get("data", [])
    price = items[0].get("price") or {}
    stripe_price_id = price.get("id")

    subscription_data = {
        "organisation_id": organisation_id,
        "stripe_customer_id": subscription.get("customer"),
        "stripe_subscription_id": stripe_subscription_id,
        "stripe_price_id": stripe_price_id,
        "plan": plan,
        "status": subscription_status,
        "currency": price.get("currency"),
        "current_period_start": stripe_timestamp_to_iso(
            subscription.get("current_period_start")
        ),
        "current_period_end": stripe_timestamp_to_iso(
            subscription.get("current_period_end")
        ),
        "cancel_at_period_end": subscription.get(
            "cancel_at_period_end", False
        ),
        "updated_at": now_iso(),
    }

    result = (
        supabase.table("subscriptions")
        .upsert(
            subscription_data,
            on_conflict="stripe_subscription_id",
        )
        .execute()
    )

    if not result.data:
        raise RuntimeError(
            "Stripe subscription could not be saved to Supabase."
        )

    return result.data[0]["id"], organisation_id


def mark_billing_event_failed(
    stripe_event_id: str,
    processing_token: str,
    error_message: str,
) -> None:
    result = (
        supabase.table("billing_events")
        .update({
            "processing_status": "failed",
            "error_message": error_message[:2000],
        })
        .eq("stripe_event_id", stripe_event_id)
        .eq("processing_token", processing_token)
        .select("id")
        .execute()
    )

    if not result.data:
        logger.warning(
            "Billing event failure update skipped: "
            "processing token no longer owns the event. "
            "event_id=%s",
            stripe_event_id,
        )

def log_unhandled_webhook_errors(endpoint: Callable):
    @wraps(endpoint)
    async def wrapper(*args, **kwargs):
        try:
            return await endpoint(*args, **kwargs)
        except HTTPException:
            raise
        except Exception:
            error_id = str(uuid.uuid4())
            logger.exception(
                "Unhandled Stripe webhook error_id=%s",
                error_id,
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "message": "An unexpected error occurred while handling the Stripe webhook.",
                    "error_id": error_id,
                },
            )

    return wrapper


@router.post("/webhook")
@log_unhandled_webhook_errors
async def stripe_webhook(request: Request):
    if not STRIPE_WEBHOOK_SECRET:
        logger.error(
            "Stripe webhook secret is missing for mode=%s",
            STRIPE_MODE,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Stripe webhook is not configured on the server.",
        )

    payload = await request.body()
    signature = request.headers.get("Stripe-Signature")

    if not signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Stripe-Signature header.",
        )

    try:
        event = stripe.Webhook.construct_event(
            payload,
            signature,
            STRIPE_WEBHOOK_SECRET,
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Stripe webhook payload.",
        )
    except stripe.error.SignatureVerificationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Stripe webhook signature.",
        )

    event = to_plain_dict(event)
    stripe_event_id = event.get("id")
    event_type = event.get("type")

    if not stripe_event_id or not event_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Stripe event is missing its ID or type.",
        )

    logger.info(
        "Stripe webhook received: type=%s event_id=%s mode=%s",
        event_type,
        stripe_event_id,
        STRIPE_MODE,
    )

    if event_type not in SUPPORTED_EVENT_TYPES:
        return {
            "received": True,
            "ignored": True,
            "event_type": event_type,
            "stripe_event_id": stripe_event_id,
        }

    event_object = to_plain_dict(event["data"]["object"])

    subscription_id = None
    stripe_subscription_id = None
    stripe_subscription = None
    organisation_id = None

    try:
        if event_type.startswith("customer.subscription."):
            stripe_subscription_id = event_object.get("id")

            if not stripe_subscription_id:
                raise ValueError(
                    "Stripe subscription event is missing its subscription ID."
                )

            stripe_subscription = to_plain_dict(
                stripe_client.v1.subscriptions.retrieve(
                    stripe_subscription_id
                )
            )

            organisation_id = get_organisation_id_from_subscription(
                stripe_subscription
            )

        elif event_type == "checkout.session.completed":
            stripe_subscription_id = event_object.get("subscription")

            if isinstance(stripe_subscription_id, dict):
                stripe_subscription_id = stripe_subscription_id.get("id")

            if not stripe_subscription_id:
                raise ValueError(
                    "Checkout Session is missing its Stripe subscription reference."
                )

            stripe_subscription = to_plain_dict(
                stripe_client.v1.subscriptions.retrieve(
                    stripe_subscription_id
                )
            )

            session_organisation_id = (
                event_object.get("metadata") or {}
            ).get("dts_organisation_id")
            subscription_organisation_id = get_organisation_id_from_subscription(
                stripe_subscription
            )

            if not session_organisation_id:
                raise ValueError(
                    "Checkout Session is missing dts_organisation_id metadata."
                )

            if not subscription_organisation_id:
                raise ValueError(
                    "Stripe Subscription is missing dts_organisation_id metadata."
                )

            if session_organisation_id != subscription_organisation_id:
                logger.error(
                    "Organisation mismatch between Checkout Session and "
                    "Stripe Subscription: event_id=%s session_id=%s "
                    "subscription_id=%s session_organisation_id=%s "
                    "subscription_organisation_id=%s",
                    stripe_event_id,
                    event_object.get("id"),
                    stripe_subscription_id,
                    session_organisation_id,
                    subscription_organisation_id,
                )

                raise ValueError(
                    "Checkout Session organisation does not match "
                    "Stripe Subscription organisation."
                )

            organisation_id = session_organisation_id

        elif event_type.startswith("invoice."):
            stripe_subscription_id = get_invoice_subscription_id(
                event_object
            )

            logger.info(
                "Invoice subscription reference: invoice_id=%s "
                "subscription_id=%s parent_type=%s",
                event_object.get("id"),
                stripe_subscription_id,
                (event_object.get("parent") or {}).get("type"),
            )

            if stripe_subscription_id:
                stripe_subscription = to_plain_dict(
                    stripe_client.v1.subscriptions.retrieve(
                        stripe_subscription_id
                    )
                )

                metadata = stripe_subscription.get("metadata") or {}

                logger.info(
                    "Subscription metadata check: subscription_id=%s "
                    "has_org_metadata=%s has_plan_metadata=%s",
                    stripe_subscription.get("id"),
                    bool(metadata.get("dts_organisation_id")),
                    bool(metadata.get("dts_plan")),
                )

                organisation_id = get_organisation_id_from_subscription(
                    stripe_subscription
                )

        if not organisation_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "message": "Stripe event could not be linked to a DTS Works organisation.",
                    "stripe_event_id": stripe_event_id,
                    "hint": "Check dts_organisation_id metadata on the relevant Stripe object.",
                },
            )

    except HTTPException:
        raise
    except Exception:
        error_id = str(uuid.uuid4())

        logger.exception(
            "Stripe event preparation failed: type=%s event_id=%s error_id=%s",
            event_type,
            stripe_event_id,
            error_id,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": "Stripe webhook event could not be prepared for processing.",
                "error_id": error_id,
                "stripe_event_id": stripe_event_id,
                "hint": "Check the backend logs for the matching error_id.",
            },
        )

    try:
        claim_result = supabase.rpc(
            "claim_billing_event",
            {
                "p_stripe_event_id": stripe_event_id,
                "p_event_type": event_type,
                "p_organisation_id": organisation_id,
            },
        ).execute()

        processing_token = claim_result.data

        if not processing_token:
            logger.info(
                "Stripe webhook event already claimed or completed: event_id=%s",
                stripe_event_id,
            )

            return {
                "received": True,
                "duplicate": True,
                "stripe_event_id": stripe_event_id,
            }

        try:
            if event_type.startswith("customer.subscription."):
                subscription_id, organisation_id = sync_subscription(
                    stripe_subscription
                )

            elif event_type == "checkout.session.completed":
                if stripe_subscription is None:
                    raise ValueError(
                        "Checkout Session subscription was not retrieved."
                    )

                subscription_id, organisation_id = sync_subscription(
                    stripe_subscription
                )

            elif event_type in (
                "invoice.paid",
                "invoice.payment_failed",
            ):
                if stripe_subscription is None:
                    raise ValueError(
                        "Invoice subscription was not retrieved."
                    )

                subscription_id, organisation_id = sync_subscription(
                    stripe_subscription
                )
            else:
                subscription_id = None

            completion_result = (
                supabase.table("billing_events")
                .update(
                    {
                        "processing_status": "completed",
                        "processed_at": now_iso(),
                        "error_message": None,
                        **(
                            {"subscription_id": subscription_id}
                            if subscription_id
                            else {}
                        ),
                    }
                )
                .eq("stripe_event_id", stripe_event_id)
                .eq("processing_token", processing_token)
                .select("id")
                .execute()
            )

            if not completion_result.data:
                raise RuntimeError(
                    "Stripe billing event completion failed: "
                    "processing token no longer owns the event."
                )

        except Exception as exc:
            error_id = str(uuid.uuid4())

            logger.exception(
                "Stripe event processing failed: type=%s event_id=%s error_id=%s",
                event_type,
                stripe_event_id,
                error_id,
            )

            try:
                mark_billing_event_failed(
                    stripe_event_id,
                    processing_token,
                    f"error_id={error_id}; {type(exc).__name__}: {exc}",
                )
            except Exception:
                logger.exception(
                    "Could not mark billing event as failed: event_id=%s",
                    stripe_event_id,
                )

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "message": "Stripe webhook processing failed.",
                    "error_id": error_id,
                    "stripe_event_id": stripe_event_id,
                    "hint": "Check the backend logs for the matching error_id.",
                },
            )

        logger.info(
            "Stripe webhook processed successfully: type=%s event_id=%s",
            event_type,
            stripe_event_id,
        )

        return {
            "received": True,
            "duplicate": False,
            "stripe_event_id": stripe_event_id,
        }

    except HTTPException:
        raise
    except Exception:
        error_id = str(uuid.uuid4())

        logger.exception(
            "Stripe webhook failed: type=%s event_id=%s error_id=%s",
            event_type,
            stripe_event_id,
            error_id,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": "Stripe webhook could not complete its database or event-linking step.",
                "error_id": error_id,
                "stripe_event_id": stripe_event_id,
                "hint": "Check the backend logs for the matching error_id.",
            },
        )
