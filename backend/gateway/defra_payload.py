import json

from backend.core_compliance.audit_log_schema import (
    AuditLogSchema,
    CarrierDetails,
    DisposalRecoveryCode,
    WasteItem,
    WasteReceiverDetails,
)
from backend.site_profile.models import SiteProfile


def build_defra_receipt_payload(
    audit_log: AuditLogSchema,
    site_profile: SiteProfile,
) -> dict:
    """
    Translate the internal DTS Works audit log and
    receiving-site profile into the DEFRA
    /movements/receive payload.
    """

    movement = audit_log.movement

    movement_payload = {
        "apiCode": str(site_profile.api_code),
        "dateTimeReceived": movement.date_time_received.isoformat().replace(
            "+00:00",
            "Z",
        ),
    }

    if movement.hazardous_waste_consignment_code:
        movement_payload["hazardousWasteConsignmentCode"] = (
            movement.hazardous_waste_consignment_code
        )

    if movement.reason_for_no_consignment_code:
        movement_payload["reasonForNoConsignmentCode"] = (
            movement.reason_for_no_consignment_code.value
        )

    payload = {
        "apiCode": str(site_profile.api_code),
        "dateTimeReceived": movement.date_time_received.isoformat().replace(
            "+00:00",
            "Z",
        ),
        "wasteItems": [
            map_waste_item(item)
            for item in audit_log.waste_items
        ],
        "carrier": map_carrier(audit_log.carrier),
        "receiver": map_receiver(audit_log.receiver),
        "receipt": {
            "address": {
                "fullAddress": site_profile.address.full_address,
                "postcode": site_profile.address.postcode,
            }
        },
    }

    if movement.hazardous_waste_consignment_code:
        payload["hazardousWasteConsignmentCode"] = (
            movement.hazardous_waste_consignment_code
        )

    if movement.reason_for_no_consignment_code:
        payload["reasonForNoConsignmentCode"] = (
            movement.reason_for_no_consignment_code.value
        )

    print(
        "\n========== FINAL DEFRA PAYLOAD =========="
    )

    print(
        json.dumps(
            payload,
            indent=2,
            default=str,
        )
    )

    print(
        "========== END DEFRA PAYLOAD ==========\n"
    )

    return payload


def map_waste_item(
    item: WasteItem,
) -> dict:
    """
    Translate one DTS Works WasteItem
    into DEFRA's wasteItems structure.
    """

    payload = {
        "ewcCodes": item.ewc_codes,
        "wasteDescription": item.waste_description,
        "physicalForm": item.physical_form.value,
        "numberOfContainers": item.number_of_containers,
        "typeOfContainers": item.type_of_containers,
        "weight": map_weight(item.weight),
        "containsPops": item.contains_pops,
        "containsHazardous": item.contains_hazardous,
    }

    if item.pops:
        payload["pops"] = {
            "sourceOfComponents": (
                item.pops.source_of_components.value
            ),
        }

        if item.pops.components:
            payload["pops"]["components"] = [
                {
                    "code": component.code,
                    **(
                        {
                            "concentration": component.concentration
                        }
                        if component.concentration is not None
                        else {}
                    ),
                }
                for component in item.pops.components
            ]

    if item.hazardous:
        payload["hazardous"] = {
            "sourceOfComponents": (
                item.hazardous.source_of_components.value
            ),
            "hazCodes": item.hazardous.haz_codes,
        }

        if item.hazardous.components:
            payload["hazardous"]["components"] = [
                {
                    **(
                        {
                            "name": component.name
                        }
                        if component.name is not None
                        else {}
                    ),
                    **(
                        {
                            "concentration": component.concentration
                        }
                        if component.concentration is not None
                        else {}
                    ),
                }
                for component in item.hazardous.components
            ]

    if item.disposal_or_recovery_codes:
        payload["disposalOrRecoveryCodes"] = [
            map_disposal_recovery_code(code)
            for code in item.disposal_or_recovery_codes
        ]

    return payload


def map_weight(weight) -> dict:
    """
    Translate the internal Weight model into
    DEFRA's camelCase weight structure.
    """

    return {
        "metric": weight.metric.value,
        "amount": weight.amount,
        "isEstimate": weight.is_estimate,
    }


def map_disposal_recovery_code(
    code: DisposalRecoveryCode,
) -> dict:
    """
    Translate one disposal/recovery code into
    DEFRA's expected structure.
    """

    return {
        "code": code.code,
        "weight": map_weight(code.weight),
    }


def map_carrier(
    carrier: CarrierDetails,
) -> dict:
    """
    Translate the internal CarrierDetails model
    into DEFRA's carrier structure.
    """

    payload = {
        "organisationName": carrier.organisation_name,
        "meansOfTransport": carrier.means_of_transport.value,
        "registrationNumber": (
            carrier.registration_number
            if carrier.registration_number
            else None
        ),
    }

    if carrier.reason_for_no_registration_number:
        payload["reasonForNoRegistrationNumber"] = (
            carrier.reason_for_no_registration_number.value
        )

    if carrier.address:
        payload["address"] = {
            "fullAddress": carrier.address.full_address,
            "postcode": carrier.address.postcode,
        }

    if carrier.email_address:
        payload["emailAddress"] = str(
            carrier.email_address
        )

    if carrier.phone_number:
        payload["phoneNumber"] = carrier.phone_number

    if carrier.means_of_transport.value == "Road":
        if carrier.vehicle_registration:
            payload["vehicleRegistration"] = (
                carrier.vehicle_registration
            )

    return payload


def map_receiver(
    receiver: WasteReceiverDetails,
) -> dict:
    """
    Translate the internal WasteReceiverDetails model
    into DEFRA's receiver structure.
    """

    payload = {
        "siteName": receiver.site_name,
        "authorisationNumber": receiver.authorisation_number,
    }

    if receiver.email_address:
        payload["emailAddress"] = str(
            receiver.email_address
        )

    if receiver.phone_number:
        payload["phoneNumber"] = receiver.phone_number

    return payload