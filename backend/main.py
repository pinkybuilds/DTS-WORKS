import logging

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from backend.auth.dependencies import get_authenticated_user_id
from backend.core_compliance.audit_ledger import (
    AuditEventType,
    AuditLedger,
)
from backend.core_compliance.audit_log_factory import AuditLogFactory
from backend.core_compliance.compliance_engine import ComplianceEngine
from backend.database.supabase_client import supabase
from backend.endpoints.registry import router as registry_router
from backend.gateway.defra_client import defra_client
from backend.gateway.defra_payload import (
    build_defra_receipt_payload,
)
from backend.gateway.exceptions import (
    AuthenticationError,
    RodaProtocolError,
    SchemaValidationError,
    ServiceUnavailableError,
)
from backend.onboarding.router import router as onboarding_router
from backend.onboarding.schema import OnboardingRequest
from backend.site_profile.models import SiteAddress, SiteProfile
from backend.site_profile.repository import SiteProfileRepository
from backend.site_profile.schema import (
    SiteProfileRequest,
    SiteProfileResponse,
)
from backend.stripe.checkout import router as stripe_router
from backend.traffic_cop.router import handle_waste_intake


logging.basicConfig(level=logging.INFO)


app = FastAPI()


print(
    "DTS WORKS BACKEND LOADED FROM backend.main",
    flush=True,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://dts-works.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


audit_ledger = AuditLedger()
compliance_engine = ComplianceEngine()
site_profile_repository = SiteProfileRepository()


app.include_router(registry_router)
app.include_router(onboarding_router)
app.include_router(stripe_router)


@app.post("/intake-screening")
def intake_screening(payload: dict):
    text = payload.get("description")

    result = handle_waste_intake(text)

    if result["status"] == "READY_FOR_INTAKE":
        return result

    if result["status"] == "INPUT_TOO_LONG":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"],
        )

    if result["status"] == "SAFETY_REVIEW":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=result["message"],
        )

    if result["status"] == "REVIEW_REQUIRED":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=result["message"],
        )

    logging.error(
        "Unexpected intake screening status: %s",
        result.get("status"),
    )

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Unexpected intake screening state.",
    )


@app.post("/log-waste")
def log_waste(
    data: dict,
    user_id: str = Depends(get_authenticated_user_id),
):
    print(
        "=== /log-waste WAS HIT ===",
        flush=True,
    )

    try:
        print(
            "=== /log-waste START ===",
            flush=True,
        )

        print(
            "A: Creating validated audit log",
            flush=True,
        )

        validated_log = AuditLogFactory.create_log(data)

        print(
            "A: SUCCESS",
            flush=True,
        )

        print(
            "B: Recording MOVEMENT_CREATED",
            flush=True,
        )

        movement_id = audit_ledger.record_event(
            AuditEventType.MOVEMENT_CREATED,
            data=validated_log.model_dump(mode="json"),
        )

        print(
            f"B: SUCCESS - movement_id={movement_id}",
            flush=True,
        )

        print(
            "C: Evaluating compliance",
            flush=True,
        )

        compliance_result = compliance_engine.evaluate(
            validated_log
        )

        print(
            f"C: SUCCESS - status={compliance_result.status.value}",
            flush=True,
        )

        print(
            "D: Recording COMPLIANCE_EVALUATED",
            flush=True,
        )

        audit_ledger.record_event(
            AuditEventType.COMPLIANCE_EVALUATED,
            movement_id=movement_id,
            data={
                "status": compliance_result.status.value,
                "issues": [
                    issue.model_dump(mode="json")
                    for issue in compliance_result.issues
                ],
            },
        )

        print(
            "D: SUCCESS",
            flush=True,
        )

        if compliance_result.status.value == "WARNING":
            print(
                "E: Recording COMPLIANCE_WARNING",
                flush=True,
            )

            audit_ledger.record_event(
                AuditEventType.COMPLIANCE_WARNING,
                movement_id=movement_id,
                data={
                    "issues": [
                        issue.model_dump(mode="json")
                        for issue in compliance_result.issues
                    ],
                },
            )

            print(
                "E: SUCCESS",
                flush=True,
            )

        if compliance_result.status.value == "PASS":
            print(
                "F: Compliance PASS - preparing DEFRA submission",
                flush=True,
            )

            site_profile = (
                site_profile_repository.get_site_profile(user_id)
            )

            if site_profile is None:
                raise RodaProtocolError(
                    "Receiving site profile is required before submitting to DEFRA."
                )

            defra_payload = build_defra_receipt_payload(
                validated_log,
                site_profile,
            )

            print(
                "F: Sending receipt to DEFRA sandbox",
                flush=True,
            )

            defra_response = defra_client.submit_receipt(
                defra_payload
            )

            try:
                defra_data = defra_response.json()
            except ValueError:
                defra_data = {
                    "raw_response": defra_response.text,
                }

            print(
                "F: DEFRA submission complete",
                flush=True,
            )

            audit_ledger.record_event(
                AuditEventType.SUBMISSION_ATTEMPTED,
                movement_id=movement_id,
                data={
                    "status_code": defra_response.status_code,
                    "response": defra_data,
                },
            )

            # ---------------------------------------------------------
            # DEFRA 201 - ACCEPTED
            # ---------------------------------------------------------

            if defra_response.status_code == 201:
                audit_ledger.record_event(
                    AuditEventType.DEFRA_ACCEPTED,
                    movement_id=movement_id,
                    data=defra_data,
                )

                print(
                    "F: DEFRA ACCEPTED",
                    flush=True,
                )

                print(
                    "G: Saving receipt to Supabase",
                    flush=True,
                )

                site_id = site_profile_repository.get_site_id(
                    user_id
                )

                receipt_data = validated_log.model_dump(
                    mode="json"
                )

                movement_insert = (
                    supabase
                    .table("movements")
                    .insert(
                        {
                            "id": movement_id,
                            "site_id": site_id,
                            "status": "SUBMITTED",
                            "unique_reference_id": (
                                validated_log.movement.unique_reference_id
                            ),
                            "date_time_received": (
                                validated_log.movement.date_time_received.isoformat()
                            ),
                            "waste_tracking_id": (
                                defra_data.get("wasteTrackingId")
                            ),
                            "compliance_status": (
                                compliance_result.status.value
                            ),
                            "defra_status": "ACCEPTED",
                            "defra_response": defra_data,
                            "receipt_data": receipt_data,
                        }
                    )
                    .execute()
                )

                if not movement_insert.data:
                    raise RodaProtocolError(
                        "Receipt could not be saved to Supabase."
                    )

                waste_item_rows = [
                    {
                        "movement_id": movement_id,
                        "item_index": index,
                        "data": item.model_dump(mode="json"),
                    }
                    for index, item in enumerate(
                        validated_log.waste_items
                    )
                ]

                if waste_item_rows:
                    waste_item_insert = (
                        supabase
                        .table("waste_items")
                        .insert(waste_item_rows)
                        .execute()
                    )

                    if not waste_item_insert.data:
                        raise RodaProtocolError(
                            "Waste items could not be saved to Supabase."
                        )

                print(
                    "G: Receipt saved to Supabase",
                    flush=True,
                )

                return {
                    "status": "SUBMITTED",
                    "movement_id": movement_id,
                    "compliance": compliance_result.model_dump(
                        mode="json"
                    ),
                    "defra": {
                        "submitted": True,
                        "accepted": True,
                        "status_code": (
                            defra_response.status_code
                        ),
                        "response": defra_data,
                    },
                }

            # ---------------------------------------------------------
            # DEFRA 400 - REJECTED
            # ---------------------------------------------------------

            if defra_response.status_code == 400:
                audit_ledger.record_event(
                    AuditEventType.DEFRA_REJECTED,
                    movement_id=movement_id,
                    data={
                        "status_code": defra_response.status_code,
                        "response": defra_data,
                    },
                )

                print(
                    "F: DEFRA REJECTED",
                    flush=True,
                )

                print(
                    "G: Saving rejected receipt to Supabase",
                    flush=True,
                )

                site_id = site_profile_repository.get_site_id(
                    user_id
                )

                receipt_data = validated_log.model_dump(
                    mode="json"
                )

                movement_insert = (
                    supabase
                    .table("movements")
                    .insert(
                        {
                            "id": movement_id,
                            "site_id": site_id,
                            "status": "REJECTED",
                            "unique_reference_id": (
                                validated_log.movement.unique_reference_id
                            ),
                            "date_time_received": (
                                validated_log.movement.date_time_received.isoformat()
                            ),
                            "waste_tracking_id": None,
                            "compliance_status": (
                                compliance_result.status.value
                            ),
                            "defra_status": "REJECTED",
                            "defra_response": defra_data,
                            "receipt_data": receipt_data,
                        }
                    )
                    .execute()
                )

                if not movement_insert.data:
                    raise RodaProtocolError(
                        "Rejected receipt could not be saved to Supabase."
                    )

                waste_item_rows = [
                    {
                        "movement_id": movement_id,
                        "item_index": index,
                        "data": item.model_dump(mode="json"),
                    }
                    for index, item in enumerate(
                        validated_log.waste_items
                    )
                ]

                if waste_item_rows:
                    waste_item_insert = (
                        supabase
                        .table("waste_items")
                        .insert(waste_item_rows)
                        .execute()
                    )

                    if not waste_item_insert.data:
                        raise RodaProtocolError(
                            "Rejected receipt waste items could not be saved to Supabase."
                        )

                print(
                    "G: Rejected receipt saved to Supabase",
                    flush=True,
                )

                return {
                    "status": "DEFRA_REJECTED",
                    "movement_id": movement_id,
                    "compliance": compliance_result.model_dump(
                        mode="json"
                    ),
                    "defra": {
                        "submitted": True,
                        "accepted": False,
                        "status_code": (
                            defra_response.status_code
                        ),
                        "response": defra_data,
                    },
                }

            # ---------------------------------------------------------
            # DEFRA 402 - SERVICE CHARGE REQUIRED
            # ---------------------------------------------------------

            if defra_response.status_code == 402:
                print(
                    "F: DEFRA SERVICE CHARGE REQUIRED",
                    flush=True,
                )

                print(
                    "G: Saving service-charge-required submission to Supabase",
                    flush=True,
                )

                site_id = site_profile_repository.get_site_id(
                    user_id
                )

                receipt_data = validated_log.model_dump(
                    mode="json"
                )

                movement_insert = (
                    supabase
                    .table("movements")
                    .insert(
                        {
                            "id": movement_id,
                            "site_id": site_id,
                            "status": "SUBMISSION_FAILED",
                            "unique_reference_id": (
                                validated_log.movement.unique_reference_id
                            ),
                            "date_time_received": (
                                validated_log.movement.date_time_received.isoformat()
                            ),
                            "waste_tracking_id": None,
                            "compliance_status": (
                                compliance_result.status.value
                            ),
                            "defra_status": "SERVICE_CHARGE_REQUIRED",
                            "defra_response": defra_data,
                            "receipt_data": receipt_data,
                        }
                    )
                    .execute()
                )

                if not movement_insert.data:
                    raise RodaProtocolError(
                        "Service-charge-required receipt could not be saved to Supabase."
                    )

                waste_item_rows = [
                    {
                        "movement_id": movement_id,
                        "item_index": index,
                        "data": item.model_dump(mode="json"),
                    }
                    for index, item in enumerate(
                        validated_log.waste_items
                    )
                ]

                if waste_item_rows:
                    waste_item_insert = (
                        supabase
                        .table("waste_items")
                        .insert(waste_item_rows)
                        .execute()
                    )

                    if not waste_item_insert.data:
                        raise RodaProtocolError(
                            "Service-charge-required receipt waste items could not be saved to Supabase."
                        )

                print(
                    "G: Service-charge-required submission saved to Supabase",
                    flush=True,
                )

                return {
                    "status": "DEFRA_SERVICE_CHARGE_REQUIRED",
                    "movement_id": movement_id,
                    "compliance": compliance_result.model_dump(
                        mode="json"
                    ),
                    "defra": {
                        "submitted": True,
                        "accepted": False,
                        "status_code": (
                            defra_response.status_code
                        ),
                        "response": defra_data,
                    },
                }

            # ---------------------------------------------------------
            # OTHER DEFRA RESPONSE - UNEXPECTED EXTERNAL RESPONSE
            # ---------------------------------------------------------

            print(
                "F: DEFRA RETURNED AN UNEXPECTED RESPONSE",
                flush=True,
            )

            logging.error(
                "Unexpected DEFRA response. status_code=%s response=%s",
                defra_response.status_code,
                defra_data,
            )

            print(
                "G: Saving unexpected DEFRA response to Supabase",
                flush=True,
            )

            site_id = site_profile_repository.get_site_id(
                user_id
            )

            receipt_data = validated_log.model_dump(
                mode="json"
            )

            movement_insert = (
                supabase
                .table("movements")
                .insert(
                    {
                        "id": movement_id,
                        "site_id": site_id,
                        "status": "SUBMISSION_FAILED",
                        "unique_reference_id": (
                            validated_log.movement.unique_reference_id
                        ),
                        "date_time_received": (
                            validated_log.movement.date_time_received.isoformat()
                        ),
                        "waste_tracking_id": None,
                        "compliance_status": (
                            compliance_result.status.value
                        ),
                        "defra_status": "DEFRA_UNEXPECTED_RESPONSE",
                        "defra_response": defra_data,
                        "receipt_data": receipt_data,
                    }
                )
                .execute()
            )

            if not movement_insert.data:
                raise RodaProtocolError(
                    "Unexpected DEFRA response could not be saved to Supabase."
                )

            waste_item_rows = [
                {
                    "movement_id": movement_id,
                    "item_index": index,
                    "data": item.model_dump(mode="json"),
                }
                for index, item in enumerate(
                    validated_log.waste_items
                )
            ]

            if waste_item_rows:
                waste_item_insert = (
                    supabase
                    .table("waste_items")
                    .insert(waste_item_rows)
                    .execute()
                )

                if not waste_item_insert.data:
                    raise RodaProtocolError(
                        "Unexpected DEFRA response waste items could not be saved to Supabase."
                    )

            print(
                "G: Unexpected DEFRA response saved to Supabase",
                flush=True,
            )

            return {
                "status": "DEFRA_UNEXPECTED_RESPONSE",
                "movement_id": movement_id,
                "compliance": compliance_result.model_dump(
                    mode="json"
                ),
                "defra": {
                    "submitted": True,
                    "accepted": False,
                    "status_code": (
                        defra_response.status_code
                    ),
                    "response": defra_data,
                },
            }

        print(
            "G: Returning compliance result",
            flush=True,
        )

        return {
            "status": compliance_result.status.value,
            "movement_id": movement_id,
            "compliance": compliance_result.model_dump(
                mode="json"
            ),
        }

    except SchemaValidationError as e:
        print(
            f"SCHEMA ERROR: {e.message}",
            flush=True,
        )

        logging.warning(
            "Schema validation error %s: %s",
            e.error_id,
            e.message,
        )

        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.message,
        )

    except ServiceUnavailableError as e:
        print(
            f"DEFRA SERVICE UNAVAILABLE: {e.message}",
            flush=True,
        )

        logging.error(
            "External service unavailable %s: %s",
            e.error_id,
            e.message,
        )

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=e.message,
        )

    except AuthenticationError as e:
        print(
            f"DEFRA AUTHENTICATION ERROR: {e.message}",
            flush=True,
        )

        logging.error(
            "DEFRA authentication error %s: %s",
            e.error_id,
            e.message,
        )

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=e.message,
        )

    except RodaProtocolError as e:
        print(
            f"RODA PROTOCOL ERROR: {e.message}",
            flush=True,
        )

        logging.error(
            "Application error %s: %s",
            e.error_id,
            e.message,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=e.message,
        )

    except Exception:
        print(
            "=== UNEXPECTED ERROR IN /log-waste ===",
            flush=True,
        )

        logging.exception(
            "FULL /log-waste TRACEBACK"
        )

        raise


@app.get("/debug-test")
def debug_test():
    print(
        "DEBUG TEST ENDPOINT HIT",
        flush=True,
    )

    return {
        "message": "DTS Works backend is definitely running",
    }


@app.get(
    "/site-profile",
    response_model=SiteProfileResponse,
)
def get_site_profile(
    user_id: str = Depends(get_authenticated_user_id),
):
    return site_profile_repository.get_site_profile(user_id)


@app.put(
    "/site-profile",
    response_model=SiteProfileResponse,
)
def update_site_profile(
    data: SiteProfileRequest,
    user_id: str = Depends(get_authenticated_user_id),
):
    site_profile = SiteProfile(
        organisation_name=data.organisation_name,
        site_name=data.site_name,
        address=SiteAddress(
            full_address=data.address.full_address,
            postcode=data.address.postcode,
        ),
        authorisation_number=data.authorisation_number,
        api_code=data.api_code,
        email_address=data.email_address,
        phone_number=data.phone_number,
    )

    return site_profile_repository.save_site_profile(
        user_id,
        site_profile,
    )


@app.get("/")
def read_root():
    return {
        "message": "DWT Compliance System Active",
        "status": "ok",
    }