import os
from datetime import datetime, timezone

import stripe
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Request, status

from backend.database.supabase_client import supabase
from backend.stripe.client import stripe_client

load_dotenv()


router = APIRouter(
    prefix="/stripe",
    tags=["stripe"],
)


STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")


PLAN_BY_PRICE_ID = {
    os.getenv("STRIPE_STARTER_PRICE_ID"): "starter",
    os.getenv("STRIPE_PROFESSIONAL_PRICE_ID"): "professional",
    os.getenv("STRIPE_BUSINESS_PRICE_ID"): "business",
}


def stripe_timestamp_to_iso(timestamp: int | None) -> str | None:
    if timestamp is None:
        return None

    return datetime.fromtimestamp(
        timestamp,
        tz=timezone.utc,
    ).isoformat()


def get_organisation_id_from_subscription(subscription) -> str | None:
    metadata = subscription.get("metadata") or {}
    return metadata.get("dts_organisation_id")


def get_plan_from_subscription(subscription) -> str | None:
    metadata = subscription.get("metadata") or {}
    metadata_plan = metadata.get("dts_plan")

    if metadata_plan:
        return metadata_plan

    items = subscription.get("items", {}).get("data", [])

    if not items:
        return None

    price = items[0].get("price") or {}
    price_id = price.get("id")

    return PLAN_BY_PRICE_ID.get(price_id)


def get_subscription_row(stripe_subscription_id: str):
    result = (
        supabase
        .table("subscriptions")
        .select("id, organisation_id")
        .eq("stripe_subscription_id", stripe_subscription_id)
        .limit(1)
        .execute()
    )

    if not result.data:
        return None

    return result.data[0]


def sync_subscription(subscription) -> tuple[str, str]:
    stripe_subscription_id = subscription["id"]
    organisation_id = get_organisation_id_from_subscription(subscription)

    if not organisation_id:
        raise ValueError(
            "Stripe subscription is missing dts_organisation_id metadata."
        )

    plan = get_plan_from_subscription(subscription)

    if not plan:
        raise ValueError(
            "Unable to determine DTS Works plan from Stripe subscription."
        )

    items = subscription.get("items", {}).get("data", [])

    if not items:
        raise ValueError(
            "Stripe subscription contains no subscription items."
        )

    price = items[0].get("price") or {}
    stripe_price_id = price.get("id")

    if not stripe_price_id:
        raise ValueError(
            "Stripe subscription item is missing a price ID."
        )

    currency = price.get("currency")

    subscription_data = {
        "organisation_id": organisation_id,
        "stripe_customer_id": subscription.get("customer"),
        "stripe_subscription_id": stripe_subscription_id,
        "stripe_price_id": stripe_price_id,
        "plan": plan,
        "status": subscription.get("status"),
        "currency": currency,
        "current_period_start": stripe_timestamp_to_iso(
            subscription.get("current_period_start")
        ),
        "current_period_end": stripe_timestamp_to_iso(
            subscription.get("current_period_end")
        ),
        "cancel_at_period_end": subscription.get("cancel_at_period_end", False),
        "cancel_at": stripe_timestamp_to_iso(
            subscription.get("cancel_at")
        ),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    existing = get_subscription_row(stripe_subscription_id)

    if existing:
        result = (
            supabase
            .table("subscriptions")
            .update(subscription_data)
            .eq("id", existing["id"])
            .execute()
        )
    else:
        result = (
            supabase
            .table("subscriptions")
            .insert(subscription_data)
            .execute()
        )

    if not result.data:
        raise RuntimeError(
            "Stripe subscription could not be saved to Supabase."
        )

    return result.data[0]["id"], organisation_id


def mark_billing_event_failed(
    stripe_event_id: str,
    error_message: str,
) -> None:
    (
        supabase
        .table("billing_events")
        .update(
            {
                "processing_status": "FAILED",
                "error_message": error_message,
                "processed_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        .eq("stripe_event_id", stripe_event_id)
        .execute()
    )


@router.post("/webhook")
async def stripe_webhook(request: Request):
    if not STRIPE_WEBHOOK_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Stripe webhook secret is not configured.",
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

    stripe_event_id = event["id"]
    event_type = event["type"]

    existing_event = (
        supabase
        .table("billing_events")
        .select("id, processing_status")
        .eq("stripe_event_id", stripe_event_id)
        .limit(1)
        .execute()
    )

    if existing_event.data:
        return {
            "received": True,
            "duplicate": True,
            "stripe_event_id": stripe_event_id,
        }

    event_object = event["data"]["object"]
    organisation_id = None
    subscription_id = None

    if event_type.startswith("customer.subscription."):
        organisation_id = get_organisation_id_from_subscription(event_object)
    elif event_type == "checkout.session.completed":
        organisation_id = (event_object.get("metadata") or {}).get(
            "dts_organisation_id"
        )
    elif event_type.startswith("invoice."):
        stripe_subscription_id = event_object.get("subscription")

        if stripe_subscription_id:
            subscription = stripe_client.v1.subscriptions.retrieve(
                stripe_subscription_id
            )
            organisation_id = get_organisation_id_from_subscription(
                subscription
            )

    if not organisation_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Stripe event could not be linked to a DTS Works organisation."
            ),
        )

    billing_event_insert = (
        supabase
        .table("billing_events")
        .insert(
            {
                "organisation_id": organisation_id,
                "stripe_event_id": stripe_event_id,
                "event_type": event_type,
                "received_at": datetime.now(timezone.utc).isoformat(),
                "processing_started_at": datetime.now(timezone.utc).isoformat(),
                "processing_status": "PROCESSING",
            }
        )
        .execute()
    )

    if not billing_event_insert.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Stripe billing event could not be recorded.",
        )

    try:
        if event_type in {
            "customer.subscription.created",
            "customer.subscription.updated",
            "customer.subscription.deleted",
        }:
            subscription_id, organisation_id = sync_subscription(event_object)

        elif event_type == "checkout.session.completed":
            stripe_subscription_id = event_object.get("subscription")

            if stripe_subscription_id:
                subscription = stripe_client.v1.subscriptions.retrieve(
                    stripe_subscription_id
                )
                subscription_id, organisation_id = sync_subscription(subscription)

        elif event_type in {
            "invoice.paid",
            "invoice.payment_failed",
        }:
            stripe_subscription_id = event_object.get("subscription")

            if stripe_subscription_id:
                existing_subscription = get_subscription_row(
                    stripe_subscription_id
                )

                if existing_subscription:
                    subscription_id = existing_subscription["id"]

        else:
            pass

        update_data = {
            "processing_status": "PROCESSED",
            "processed_at": datetime.now(timezone.utc).isoformat(),
            "error_message": None,
        }

        if subscription_id:
            update_data["subscription_id"] = subscription_id

        (
            supabase
            .table("billing_events")
            .update(update_data)
            .eq("stripe_event_id", stripe_event_id)
            .execute()
        )

    except Exception as exc:
        error_message = str(exc)
        mark_billing_event_failed(
            stripe_event_id=stripe_event_id,
            error_message=error_message,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Stripe webhook processing failed.",
        )

    return {
        "received": True,
        "duplicate": False,
        "stripe_event_id": stripe_event_id,
    }