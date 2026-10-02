"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";

import MovementSection from "./components/MovementSection";
import WasteItemsSection, {
  type WasteItem,
  createEmptyWasteItem,
} from "./components/WasteItemsSection";
import CarrierSection, {
  type CarrierData,
} from "./components/CarrierSection";
import BrokerDealerSection, {
  type BrokerData,
} from "./components/BrokerDealerSection";
import ReceivingSiteSection, {
  type SiteProfile,
} from "./components/ReceivingSiteSection";
import ReceiptCheckSection from "./components/ReceiptCheckSection";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type OtherReferenceType =
  | "WASTE_TRANSFER_NOTE"
  | "HAZARDOUS_WASTE_CONSIGNMENT_NOTE"
  | "WEIGHBRIDGE_TICKET"
  | "INTERNAL_REFERENCE"
  | "OTHER";

type OtherReference = {
  type: OtherReferenceType | "";
  reference: string;
};

type ComplianceIssue = {
  code: string;
  title: string;
  message: string;
  field?: string;
  value?: string;
};

type ComplianceResult = {
  status:
    | "PASS"
    | "WARNING"
    | "REVIEW_REQUIRED"
    | "BLOCKED";
  issues: ComplianceIssue[];
};

type DefraResponse = {
  submitted?: boolean;
  accepted?: boolean;
  status_code?: number;
  response?: unknown;
  error?: string;
};
type SubmissionStatus =
  | "ACCEPTED"
  | "DEFRA_REJECTED"
  | "DEFRA_SERVICE_CHARGE_REQUIRED"
  | "DEFRA_UNEXPECTED_RESPONSE"
  | "SERVICE_UNAVAILABLE"
  | "AUTHENTICATION_ERROR"
  | "INTERNAL_ERROR";

const createOtherReference = (): OtherReference => ({
  type: "",
  reference: "",
});

const getCurrentDateTimeLocal = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(
    now.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(
    now.getDate(),
  ).padStart(2, "0");
  const hours = String(
    now.getHours(),
  ).padStart(2, "0");
  const minutes = String(
    now.getMinutes(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const getReferenceTypeLabel = (
  type: OtherReferenceType | "",
) => {
  switch (type) {
    case "WASTE_TRANSFER_NOTE":
      return "Waste transfer note";

    case "HAZARDOUS_WASTE_CONSIGNMENT_NOTE":
      return "Hazardous waste consignment note";

    case "WEIGHBRIDGE_TICKET":
      return "Weighbridge ticket";

    case "INTERNAL_REFERENCE":
      return "Internal reference";

    case "OTHER":
      return "Other";

    default:
      return "";
  }
};

export default function NewReceiptPage() {
  const [currentStep, setCurrentStep] = useState(1);

  const [dateTimeReceived, setDateTimeReceived] =
    useState(getCurrentDateTimeLocal);

  const [uniqueReferenceId, setUniqueReferenceId] =
    useState("");

  const [otherReferences, setOtherReferences] =
    useState<OtherReference[]>([]);

  const [
    specialHandlingRequirements,
    setSpecialHandlingRequirements,
  ] = useState("");

  const [
    showSpecialHandling,
    setShowSpecialHandling,
  ] = useState(false);

  const [
    movementContainsHazardous,
    setMovementContainsHazardous,
  ] = useState(false);

  const [
    hazardousWasteConsignmentCode,
    setHazardousWasteConsignmentCode,
  ] = useState("");

  const [
    reasonForNoConsignmentCode,
    setReasonForNoConsignmentCode,
  ] = useState("");

  const [wasteItems, setWasteItems] = useState<WasteItem[]>([
  createEmptyWasteItem(),
]);
    

  const [carrier, setCarrier] =
    useState<CarrierData>({
      organisationName: "",
      registrationNumber: "",
      noRegistrationReason: "",
      meansOfTransport: "",
      vehicleRegistration: "",
      phone: "",
      email: "",
      address: "",
      postcode: "",
    });

  const [broker, setBroker] =
    useState<BrokerData>({
      present: false,
      organisationName: "",
      registrationNumber: "",
      phone: "",
      email: "",
      address: "",
      postcode: "",
    });

  const [siteProfile, setSiteProfile] =
    useState<SiteProfile | null>(null);

  const [complianceResult, setComplianceResult] =
    useState<ComplianceResult | null>(null);

  const [validationIssues, setValidationIssues] =
    useState<string[]>([]);

  const [defraResponse, setDefraResponse] =
  useState<DefraResponse | null>(null);

const [submissionStatus, setSubmissionStatus] =
  useState<SubmissionStatus | null>(null);

const [isSubmitting, setIsSubmitting] =
  useState(false);

  const [submitted, setSubmitted] =
    useState(false);

  const [receiptCode, setReceiptCode] =
    useState("");



  const [submitMessage, setSubmitMessage] =
    useState("");

  const movementRef =
    useRef<HTMLDivElement | null>(null);

  const wasteRef =
    useRef<HTMLDivElement | null>(null);

  const carrierRef =
    useRef<HTMLDivElement | null>(null);

  const brokerRef =
    useRef<HTMLDivElement | null>(null);

  

  const receiptCheckRef =
    useRef<HTMLDivElement | null>(null);

  useEffect(() => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}, [currentStep]);


  const handleMovementChange = (data: {
    dateTimeReceived?: string;
    uniqueReferenceId?: string;
    otherReferences?: OtherReference[];
    specialHandlingRequirements?: string;
    hazardousWasteConsignmentCode?: string;
    reasonForNoConsignmentCode?: string;
  }) => {
    if (
      data.dateTimeReceived !== undefined
    ) {
      setDateTimeReceived(
        data.dateTimeReceived,
      );
    }

    if (
      data.uniqueReferenceId !== undefined
    ) {
      setUniqueReferenceId(
        data.uniqueReferenceId,
      );
    }

    if (
      data.otherReferences !== undefined
    ) {
      setOtherReferences(
        data.otherReferences,
      );
    }

    if (
      data.specialHandlingRequirements !==
      undefined
    ) {
      setSpecialHandlingRequirements(
        data.specialHandlingRequirements,
      );
    }

    if (
      data.hazardousWasteConsignmentCode !==
      undefined
    ) {
      setHazardousWasteConsignmentCode(
        data.hazardousWasteConsignmentCode,
      );
    }

    if (
      data.reasonForNoConsignmentCode !==
      undefined
    ) {
      setReasonForNoConsignmentCode(
        data.reasonForNoConsignmentCode,
      );
    }
  };

  const addOtherReference = () => {
    setOtherReferences((references) => [
      ...references,
      createOtherReference(),
    ]);
  };

  const updateOtherReference = (
    index: number,
    field: keyof OtherReference,
    value: string,
  ) => {
    setOtherReferences((references) =>
      references.map(
        (reference, referenceIndex) =>
          referenceIndex === index
            ? {
                ...reference,
                [field]: value,
              }
            : reference,
      ),
    );
  };

  const removeOtherReference = (
    index: number,
  ) => {
    setOtherReferences((references) =>
      references.filter(
        (_, referenceIndex) =>
          referenceIndex !== index,
      ),
    );
  };

  const updateWasteItems = (
    items: WasteItem[],
  ) => {
    setWasteItems(items);

    const containsHazardousWaste =
      items.some(
        (item) =>
          item.containsHazardous ||
          item.selectedEwcEntries.some(
             (entry) =>
              entry?.isHazardous === true,
          ),
      );

    setMovementContainsHazardous(
      containsHazardousWaste,
    );
  };

  const mapMeansOfTransport = (
    value: string,
  ) => {
    switch (value) {
      case "Road":
        return "Road";

      case "Rail":
        return "Rail";

      case "Water":
        return "Inland Waterway";

      case "Air":
        return "Air";

      case "Other":
        return "Other";

      default:
        return value;
    }
  };

  const buildWasteItemsPayload = () => {
    return wasteItems.map((item) => {
      const wasteItem: Record<
        string,
        unknown
      > = {
        ewc_codes: item.ewcCodes.filter(
          (code) => code.trim() !== "",
        ),

        waste_description:
          item.wasteDescription.trim(),

        physical_form:
          item.physicalForm,

        number_of_containers:
          Number(item.numberOfContainers),

        type_of_containers:
          item.typeOfContainers.trim(),

        weight: {
          metric: item.weightUnit,
          amount: Number(item.weightAmount),
          is_estimate: item.isEstimate,
        },

        contains_pops:
          item.containsPops,

        contains_hazardous:
          item.containsHazardous,
      };

      if (item.containsPops) {
        wasteItem.pops = {
          source_of_components:
            item.popsSource,

          components:
            item.popsComponents.length > 0
              ? item.popsComponents.map(
                  (component) => ({
                    code:
                      component.code.trim(),

                    ...(component.concentration.trim()
                      ? {
                          concentration:
                            Number(
                              component.concentration,
                            ),
                        }
                      : {}),
                  }),
                )
              : undefined,
        };
      }

      if (item.containsHazardous) {
        wasteItem.hazardous = {
          source_of_components:
            item.hazardousSource,

          haz_codes:
            item.hazardousProperties.filter(
              (code) => code.trim() !== "",
            ),

          components:
            item.hazardousComponents.length > 0
              ? item.hazardousComponents.map(
                  (component) => ({
                    ...(component.name.trim()
                      ? {
                          name:
                            component.name.trim(),
                        }
                      : {}),

                    ...(component.concentration.trim()
                      ? {
                          concentration:
                            Number(
                              component.concentration,
                            ),
                        }
                      : {}),
                  }),
                )
              : undefined,
        };
      }

      if (
        item.disposalRecoveryCodes.length > 0
      ) {
        wasteItem.disposal_or_recovery_codes =
          item.disposalRecoveryCodes.map(
            (entry) => ({
              code: entry.code.trim(),

              weight: {
                metric: entry.weightUnit,
                amount: Number(
                  entry.weightAmount,
                ),
                is_estimate:
                  entry.isEstimate,
              },
            }),
          );
      }

      return wasteItem;
    });
  };

  const buildCarrierPayload = () => {
    const payload: Record<
      string,
      unknown
    > = {
      organisation_name:
        carrier.organisationName.trim(),

      means_of_transport:
        mapMeansOfTransport(
          carrier.meansOfTransport,
        ),
    };

    if (
      carrier.registrationNumber.trim()
    ) {
      payload.registration_number =
        carrier.registrationNumber.trim();
    } else if (
      carrier.noRegistrationReason
    ) {
      payload.reason_for_no_registration_number =
        carrier.noRegistrationReason;
    }

    if (
      carrier.vehicleRegistration.trim()
    ) {
      payload.vehicle_registration =
        carrier.vehicleRegistration.trim();
    }

    if (carrier.phone.trim()) {
      payload.phone_number =
        carrier.phone.trim();
    }

    if (carrier.email.trim()) {
      payload.email_address =
        carrier.email.trim();
    }

    if (carrier.address.trim()) {
      payload.address = {
        full_address:
          carrier.address.trim(),

        postcode:
          carrier.postcode.trim(),
      };
    }

    return payload;
  };

  const buildBrokerPayload = () => {
    if (!broker.present) {
      return undefined;
    }

    const payload: Record<
      string,
      unknown
    > = {
      organisation_name:
        broker.organisationName.trim(),
    };

    if (
      broker.registrationNumber.trim()
    ) {
      payload.registration_number =
        broker.registrationNumber.trim();
    }

    if (broker.phone.trim()) {
      payload.phone_number =
        broker.phone.trim();
    }

    if (broker.email.trim()) {
      payload.email_address =
        broker.email.trim();
    }

    if (broker.address.trim()) {
      payload.address = {
        full_address:
          broker.address.trim(),

        postcode:
          broker.postcode.trim(),
      };
    }

    return payload;
  };

  const buildReceiptPayload = () => {
    if (!siteProfile) {
      throw new Error(
        "Receiving site profile is not available.",
      );
    }

    const movement: Record<
      string,
      unknown
    > = {
      api_code: siteProfile.api_code,

      date_time_received:
        new Date(
          dateTimeReceived,
        ).toISOString(),
    };

    if (uniqueReferenceId.trim()) {
      movement.unique_reference_id =
        uniqueReferenceId.trim();
    }

    const references =
      otherReferences
        .filter(
          (reference) =>
            reference.type &&
            reference.reference.trim(),
        )
        .map((reference) => ({
          label:
            getReferenceTypeLabel(
              reference.type,
            ),

          reference:
            reference.reference.trim(),
        }));

    if (references.length > 0) {
      movement.other_references =
        references;
    }

    if (
      specialHandlingRequirements.trim()
    ) {
      movement.special_handling_requirements =
        specialHandlingRequirements.trim();
    }

    if (
      hazardousWasteConsignmentCode.trim()
    ) {
      movement.hazardous_waste_consignment_code =
        hazardousWasteConsignmentCode.trim();
    }

    if (reasonForNoConsignmentCode) {
      movement.reason_for_no_consignment_code =
        reasonForNoConsignmentCode;
    }

    const payload: Record<
      string,
      unknown
    > = {
      movement,

      waste_items:
        buildWasteItemsPayload(),

      carrier:
        buildCarrierPayload(),

      receiver: {
        site_name:
          siteProfile.site_name,

        ...(siteProfile.email_address
          ? {
              email_address:
                siteProfile.email_address,
            }
          : {}),

        ...(siteProfile.phone_number
          ? {
              phone_number:
                siteProfile.phone_number,
            }
          : {}),

        authorisation_number:
          siteProfile.authorisation_number,
      },

      receipt: {
        address: {
          full_address:
            siteProfile.address.full_address,

          postcode:
            siteProfile.address.postcode,
        },
      },
    };

    const brokerPayload =
      buildBrokerPayload();

    if (brokerPayload) {
      payload.broker = brokerPayload;
    }

    return payload;
  };

 const submitReceipt = async () => {
  setIsSubmitting(true);
  setSubmitMessage("");
  setValidationIssues([]);
  setDefraResponse(null);
  setSubmissionStatus(null);
  setSubmitted(false);

  try {
    const payload = buildReceiptPayload();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("You are not authenticated.");
    }

    const response = await fetch(
      `${API_BASE_URL}/log-waste`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      },
    );

    const data =
      await response.json().catch(() => null);

    if (!response.ok) {
      setComplianceResult(null);

      if (response.status === 422) {
        const detail =
          typeof data?.detail === "string"
            ? data.detail
            : "This receipt needs attention.";

        const issues = detail
          .split("\n")
          .map((line: string) =>
            line.replace(/^•\s*/, "").trim(),
          )
          .filter(
            (line: string) =>
              line &&
              line !== "This receipt needs attention:",
          );

        setValidationIssues(issues);
        setDefraResponse(null);
        setSubmissionStatus(null);
        setSubmitMessage("");

        return;
      }

      if (response.status === 503) {
        setSubmissionStatus("SERVICE_UNAVAILABLE");
      } else if (response.status === 502) {
        setSubmissionStatus("AUTHENTICATION_ERROR");
      } else {
        setSubmissionStatus("INTERNAL_ERROR");
      }

      setDefraResponse({
        submitted: false,
        accepted: false,
        status_code: response.status,
        error:
          data?.detail ||
          data?.message ||
          "The receipt could not be processed.",
        response: data,
      });

      setSubmitMessage(
        "The receipt could not be submitted. Review the error below.",
      );

      return;
    }

    if (data?.compliance) {
      setComplianceResult(data.compliance);
    }

    if (data?.defra) {
      setDefraResponse(data.defra);
    }

    if (data?.status === "SUBMITTED") {
      setSubmissionStatus("ACCEPTED");
      setSubmitted(true);

      setReceiptCode(
        data.movement_id ||
          data.defra?.response?.wasteTrackingId ||
          "",
      );

      setSubmitMessage(
        "Receipt submitted successfully.",
      );

      return;
    }

    if (data?.status === "DEFRA_REJECTED") {
      setSubmissionStatus("DEFRA_REJECTED");
      setSubmitted(false);

      setDefraResponse({
        submitted: true,
        accepted: false,
        status_code:
          data?.defra?.status_code ||
          data?.status_code ||
          400,
        response:
          data?.defra?.response ||
          data?.response ||
          data,
        error:
          data?.defra?.error ||
          data?.error ||
          "DEFRA could not accept this receipt.",
      });

      setReceiptCode(
        data?.movement_id || "",
      );

      setSubmitMessage("");

      return;
    }

    if (
      data?.status ===
      "DEFRA_SERVICE_CHARGE_REQUIRED"
    ) {
      setSubmissionStatus(
        "DEFRA_SERVICE_CHARGE_REQUIRED",
      );
      setSubmitted(false);

      setSubmitMessage(
        "A service charge is required before DEFRA can process this receipt.",
      );

      return;
    }

    if (
      data?.status ===
      "DEFRA_UNEXPECTED_RESPONSE"
    ) {
      setSubmissionStatus(
        "DEFRA_UNEXPECTED_RESPONSE",
      );
      setSubmitted(false);

      setSubmitMessage(
        "DEFRA returned an unexpected response. The receipt was not accepted.",
      );

      return;
    }

    setSubmissionStatus("INTERNAL_ERROR");
    setSubmitted(false);

    setSubmitMessage(
      "The receipt was processed but returned an unexpected result.",
    );
  } catch (error) {
    console.error(
      "Receipt submission failed:",
      error,
    );

    setSubmissionStatus("INTERNAL_ERROR");
    setSubmitted(false);

    setDefraResponse({
      submitted: false,
      accepted: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.",
    });

    setSubmitMessage(
      "Something went wrong while submitting the receipt.",
    );
  } finally {
    setIsSubmitting(false);
  }
};
 
  const createNewReceipt = () => {
  window.location.reload();
};
  

    const handleEditSection = (
    section: string,
  ) => {
    switch (section) {
      case "movement":
        setCurrentStep(1);
        break;

      case "waste":
        setCurrentStep(2);
        break;

      case "carrier":
      case "broker":
        setCurrentStep(3);
        break;
    }
  };

  const goToNextStep = () => {
    setCurrentStep((step) =>
      Math.min(step + 1, 4),
    );
  };

  const goToPreviousStep = () => {
    setCurrentStep((step) =>
      Math.max(step - 1, 1),
    );
  };

  return (
          <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="flex-1">
        <header className="border-b border-slate-200 bg-white px-6 py-5 md:px-10">
  <div>
    <h1 className="text-lg font-semibold">
      New waste receipt
    </h1>

    <p className="mt-1 text-sm text-slate-500">
      Record an incoming waste movement.
    </p>
  </div>
</header>

                <div className="px-6 py-10 md:px-10">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10">
              <h2 className="text-3xl font-semibold tracking-tight">
                Record waste movement
              </h2>

              <p className="mt-2 max-w-2xl text-slate-600">
                Enter the movement details below, then check the
                receipt before submission.
              </p>
            </div>

            {/* Stepper */}

            <div className="mb-10">
              <div className="grid grid-cols-4 gap-2">
                {[
                  {
                    number: 1,
                    label: "Movement",
                  },
                  {
                    number: 2,
                    label: "Waste & EWC",
                  },
                  {
                    number: 3,
                    label: "Carrier & Broker",
                  },
                  {
                    number: 4,
                    label: "Check & Submit",
                  },
                ].map((step) => (
                  <button
                    key={step.number}
                    type="button"
                    onClick={() =>
                      setCurrentStep(step.number)
                    }
                    className={`border-b-2 pb-3 text-left text-sm font-medium transition ${
                      currentStep === step.number
                        ? "border-slate-900 text-slate-900"
                        : currentStep > step.number
                          ? "border-slate-300 text-slate-700"
                          : "border-slate-200 text-slate-400"
                    }`}
                  >
                    <span className="mr-2">
                      {step.number}.
                    </span>

                    {step.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 1 — Movement */}

            {currentStep === 1 && (
              <div
                ref={movementRef}
                id="movement"
              >
                <MovementSection
                  dateTimeReceived={
                    dateTimeReceived
                  }
                  setDateTimeReceived={
                    setDateTimeReceived
                  }
                  uniqueReferenceId={
                    uniqueReferenceId
                  }
                  setUniqueReferenceId={
                    setUniqueReferenceId
                  }
                  otherReferences={
                    otherReferences
                  }
                  addOtherReference={
                    addOtherReference
                  }
                  updateOtherReference={
                    updateOtherReference
                  }
                  removeOtherReference={
                    removeOtherReference
                  }
                  specialHandlingRequirements={
                    specialHandlingRequirements
                  }
                  setSpecialHandlingRequirements={
                    setSpecialHandlingRequirements
                  }
                  showSpecialHandling={
                    showSpecialHandling
                  }
                  setShowSpecialHandling={
                    setShowSpecialHandling
                  }
                  movementContainsHazardous={
                    movementContainsHazardous
                  }
                  hazardousWasteConsignmentCode={
                    hazardousWasteConsignmentCode
                  }
                  setHazardousWasteConsignmentCode={
                    setHazardousWasteConsignmentCode
                  }
                  reasonForNoConsignmentCode={
                    reasonForNoConsignmentCode
                  }
                  setReasonForNoConsignmentCode={
                    setReasonForNoConsignmentCode
                  }
                />
              </div>
            )}

                        {/* Step 2 — Waste & EWC */}

            {currentStep === 2 && (
              <div
                ref={wasteRef}
                id="waste"
              >
                <WasteItemsSection
                  wasteItems={wasteItems}
                  onWasteItemsChange={
                    updateWasteItems
                  }
                  hazardousWasteConsignmentCode={
                    hazardousWasteConsignmentCode
                  }
                  onHazardousWasteConsignmentCodeChange={
                    setHazardousWasteConsignmentCode
                  }
                  reasonForNoConsignmentCode={
                    reasonForNoConsignmentCode
                  }
                  onReasonForNoConsignmentCodeChange={
                    setReasonForNoConsignmentCode
                  }
                  onMovementContainsHazardousChange={
                    setMovementContainsHazardous
                  }
                />
              </div>
            )}

            {/* Step 3 — Carrier & Broker */}

            {currentStep === 3 && (
              <div
                ref={carrierRef}
                id="carrier"
              >
   
                 <CarrierSection
             carrier={carrier}
            onCarrierChange={setCarrier}
               />
                

                <div
                  ref={brokerRef}
                  id="broker"
                  className="mt-8"
                >
                  <BrokerDealerSection
               broker={broker}
            onBrokerChange={setBroker}
                    />
                  
                </div>
              </div>
            )}

            

            {/* Step 4 — Check & Submit */}

{currentStep === 4 && (
  <>
    <ReceivingSiteSection
      onSiteProfileChange={
        setSiteProfile
      }
    />

    <div
      ref={receiptCheckRef}
      id="receipt-check"
      className="mt-8"
    >
      <ReceiptCheckSection
        dateTimeReceived={
          dateTimeReceived
        }
        uniqueReferenceId={
          uniqueReferenceId
        }
        otherReferences={
          otherReferences
        }
        wasteItems={
          wasteItems
        }
        carrierOrganisationName={
          carrier.organisationName
        }
        meansOfTransport={
          carrier.meansOfTransport
        }
        vehicleRegistration={
          carrier.vehicleRegistration
        }
        brokerPresent={
          broker.present
        }
        brokerOrganisationName={
          broker.organisationName
        }
        siteProfile={
          siteProfile
            ? {
                siteName:
                  siteProfile.site_name,
              }
            : undefined
        }
        receiptFullAddress={
          siteProfile?.address
            .full_address || ""
        }
        receiptPostcode={
          siteProfile?.address
            .postcode || ""
        }
        complianceResult={
          complianceResult
        }
        validationIssues={
          validationIssues
        }
        defraResponse={
          defraResponse
        }
        
       submissionStatus={
      submissionStatus
        }
        isSubmitting={
          isSubmitting
        }
        submitted={
          submitted
        }
        submitReceipt={
          submitReceipt
        }
        createNewReceipt={
          createNewReceipt
        }
        submitMessage={
          submitMessage
        }
        receiptCode={
          receiptCode
        }
        getReferenceTypeLabel={(
          type,
        ) =>
          getReferenceTypeLabel(
            type as
              | OtherReferenceType
              | "",
          )
        }
        onEditSection={
          handleEditSection
        }
      />
    </div>
  </>
)}
            {/* Step navigation */}

            <div className="mt-10 flex items-center justify-between border-t border-slate-200 pt-6">
              <button
                type="button"
                onClick={goToPreviousStep}
                disabled={currentStep === 1}
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-40"
              >
                Back
              </button>

              {currentStep < 4 && (
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Continue
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}