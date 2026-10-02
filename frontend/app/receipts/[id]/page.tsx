"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type ReceiptData = {
  movement?: {
    api_code?: string;
    date_time_received?: string;
    unique_reference_id?: string;
    other_references?: {
      label?: string;
      reference?: string;
    }[];
    special_handling_requirements?: string;
    hazardous_waste_consignment_code?: string;
    reason_for_no_consignment_code?: string;
  };

  waste_items?: {
    ewc_codes?: string[];
    waste_description?: string;
    physical_form?: string;
    number_of_containers?: number;
    type_of_containers?: string;
    weight?: {
      metric?: string;
      amount?: number;
      is_estimate?: boolean;
    };
    contains_pops?: boolean;
    contains_hazardous?: boolean;
    pops?: unknown;
    hazardous?: unknown;
    disposal_or_recovery_codes?: unknown[];
  }[];

  carrier?: {
    organisation_name?: string;
    registration_number?: string;
    reason_for_no_registration_number?: string;
    means_of_transport?: string;
    vehicle_registration?: string;
    phone_number?: string;
    email_address?: string;
    address?: {
      full_address?: string;
      postcode?: string;
    };
  };

  broker?: {
    organisation_name?: string;
    registration_number?: string;
    phone_number?: string;
    email_address?: string;
    address?: {
      full_address?: string;
      postcode?: string;
    };
  };

  receiver?: {
    site_name?: string;
    email_address?: string;
    phone_number?: string;
    authorisation_number?: string;
  };

  receipt?: {
    address?: {
      full_address?: string;
      postcode?: string;
    };
  };
};

type DefraValidationIssue = {
  key?: string;
  message?: string;
  errorType?: string;
};

type DefraResponse = {
  validation?: {
    errors?: DefraValidationIssue[];
    warnings?: DefraValidationIssue[];
    recommendations?: DefraValidationIssue[];
  };
  wasteTrackingId?: string;
};

type Movement = {
  id: string;
  status: string | null;
  unique_reference_id: string | null;
  date_time_received: string | null;
  waste_tracking_id: string | null;
  compliance_status: string | null;
  defra_status: string | null;
  defra_response: DefraResponse | null;
  receipt_data: ReceiptData | null;
  created_at: string;
};

export default function ReceiptPage() {
  const params = useParams();
  const id = params.id as string;

  const [movement, setMovement] =
    useState<Movement | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadReceipt = async () => {
      setLoading(true);
      setError("");

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error(
            "You are not authenticated.",
          );
        }

        const { data, error } =
          await supabase
            .from("movements")
            .select(
              `
                id,
                status,
                unique_reference_id,
                date_time_received,
                waste_tracking_id,
                compliance_status,
                defra_status,
                defra_response,
                receipt_data,
                created_at
              `,
            )
            .eq("id", id)
            .single();

        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error(
            "Receipt not found.",
          );
        }

        setMovement(data as Movement);
      } catch (error) {
        console.error(
          "Failed to load receipt:",
          error,
        );

        setError(
          error instanceof Error
            ? error.message
            : "The receipt could not be loaded.",
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadReceipt();
    }
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <section className="flex-1">
          <header className="border-b border-slate-200 bg-white px-6 py-5 md:px-10">
            <h1 className="text-lg font-semibold">
              Waste receipt
            </h1>
          </header>

          <div className="px-6 py-10 md:px-10">
            <div className="mx-auto max-w-5xl">
              <p className="text-sm text-slate-500">
                Loading receipt...
              </p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (error || !movement) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <section className="flex-1">
          <header className="border-b border-slate-200 bg-white px-6 py-5 md:px-10">
            <h1 className="text-lg font-semibold">
              Waste receipt
            </h1>
          </header>

          <div className="px-6 py-10 md:px-10">
            <div className="mx-auto max-w-5xl">
              <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                <p className="text-sm font-semibold text-red-900">
                  Receipt could not be loaded
                </p>

                <p className="mt-1 text-sm text-red-800">
                  {error ||
                    "The requested receipt could not be found."}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const receipt =
    movement.receipt_data;

  const movementData =
    receipt?.movement;

  const wasteItems =
    receipt?.waste_items || [];

  const carrier =
    receipt?.carrier;

  const broker =
    receipt?.broker;

  const receiver =
    receipt?.receiver;

  const receiptAddress =
    receipt?.receipt?.address;

  const defraResponse =
    movement.defra_response;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="flex-1">
        <header className="border-b border-slate-200 bg-white px-6 py-5 md:px-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold">
                Waste receipt
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Recorded waste movement
              </p>
            </div>

            <a
              href="/receipts"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              ← Receipts
            </a>
          </div>
        </header>

        <div className="px-6 py-10 md:px-10">
          <div className="mx-auto max-w-5xl space-y-6">

            {/* Receipt summary */}

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Waste receipt
                  </p>

                  <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                    Receipt details
                  </h2>
                </div>

                <div
                  className={`rounded-lg px-4 py-3 ${
                    movement.defra_status === "REJECTED"
                      ? "bg-red-50"
                      : movement.defra_status === "ACCEPTED"
                        ? "bg-green-50"
                        : "bg-slate-50"
                  }`}
                >
                  <p
                    className={`text-xs font-semibold uppercase tracking-wide ${
                      movement.defra_status === "REJECTED"
                        ? "text-red-700"
                        : movement.defra_status === "ACCEPTED"
                          ? "text-green-700"
                          : "text-slate-500"
                    }`}
                  >
                    Status
                  </p>

                  <p
                    className={`mt-1 text-sm font-semibold ${
                      movement.defra_status === "REJECTED"
                        ? "text-red-900"
                        : movement.defra_status === "ACCEPTED"
                          ? "text-green-900"
                          : "text-slate-900"
                    }`}
                  >
                    {movement.defra_status === "ACCEPTED"
                      ? "Accepted by DEFRA"
                      : movement.defra_status === "REJECTED"
                        ? "Rejected by DEFRA"
                        : movement.status ||
                          "Recorded"}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-5 border-t border-slate-100 pt-6 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    DEFRA waste tracking ID
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {movement.waste_tracking_id ||
                      "Not available"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Receipt reference
                  </p>

                  <p className="mt-1 break-all text-sm font-medium text-slate-900">
                    {movement.id}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Date & time received
                  </p>

                  <p className="mt-1 text-sm text-slate-900">
                    {movement.date_time_received
                      ? new Date(
                          movement.date_time_received,
                        ).toLocaleString()
                      : "Not provided"}
                  </p>
                </div>

                {movement.unique_reference_id && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Unique reference
                    </p>

                    <p className="mt-1 text-sm text-slate-900">
                      {
                        movement.unique_reference_id
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Movement */}

            {movementData && (
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="text-lg font-semibold">
                  Movement
                </h2>

                <div className="mt-5 space-y-4">
                  {movementData.other_references &&
                    movementData.other_references.length >
                      0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Other references
                        </p>

                        <div className="mt-2 space-y-2">
                          {movementData.other_references.map(
                            (reference, index) => (
                              <div
                                key={index}
                                className="rounded-lg bg-slate-50 p-3"
                              >
                                <p className="text-sm font-medium text-slate-900">
                                  {reference.label ||
                                    "Reference"}
                                </p>

                                <p className="mt-1 text-sm text-slate-600">
                                  {
                                    reference.reference
                                  }
                                </p>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                  {movementData.special_handling_requirements && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Special handling requirements
                      </p>

                      <p className="mt-1 text-sm text-slate-900">
                        {
                          movementData.special_handling_requirements
                        }
                      </p>
                    </div>
                  )}

                  {movementData.hazardous_waste_consignment_code && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Hazardous waste consignment code
                      </p>

                      <p className="mt-1 text-sm text-slate-900">
                        {
                          movementData.hazardous_waste_consignment_code
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Waste */}

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold">
                Waste
              </h2>

              <div className="mt-5 space-y-5">
                {wasteItems.map(
                  (item, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-slate-200 p-5"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">
                          Waste item {index + 1}
                        </p>

                        {item.contains_hazardous && (
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                            Hazardous
                          </span>
                        )}
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            EWC code
                          </p>

                          <p className="mt-1 text-sm text-slate-900">
                            {item.ewc_codes?.join(
                              ", ",
                            ) ||
                              "Not provided"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Waste description
                          </p>

                          <p className="mt-1 text-sm text-slate-900">
                            {item.waste_description ||
                              "Not provided"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Physical form
                          </p>

                          <p className="mt-1 text-sm text-slate-900">
                            {item.physical_form ||
                              "Not provided"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Weight
                          </p>

                          <p className="mt-1 text-sm text-slate-900">
                            {item.weight?.amount ??
                              "Not provided"}{" "}
                            {item.weight?.metric ||
                              ""}
                            {item.weight?.is_estimate
                              ? " (estimated)"
                              : ""}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Containers
                          </p>

                          <p className="mt-1 text-sm text-slate-900">
                            {item.number_of_containers ??
                              "Not provided"}{" "}
                            {item.type_of_containers ||
                              ""}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            POPs
                          </p>

                          <p className="mt-1 text-sm text-slate-900">
                            {item.contains_pops
                              ? "Yes"
                              : "No"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Carrier */}

            {carrier && (
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="text-lg font-semibold">
                  Carrier
                </h2>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Organisation
                    </p>

                    <p className="mt-1 text-sm text-slate-900">
                      {
                        carrier.organisation_name
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Registration
                    </p>

                    <p className="mt-1 text-sm text-slate-900">
                      {carrier.registration_number ||
                        "Not provided"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Means of transport
                    </p>

                    <p className="mt-1 text-sm text-slate-900">
                      {
                        carrier.means_of_transport
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Vehicle registration
                    </p>

                    <p className="mt-1 text-sm text-slate-900">
                      {carrier.vehicle_registration ||
                        "Not provided"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Broker */}

            {broker && (
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="text-lg font-semibold">
                  Broker / dealer
                </h2>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Organisation
                    </p>

                    <p className="mt-1 text-sm text-slate-900">
                      {
                        broker.organisation_name
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Registration
                    </p>

                    <p className="mt-1 text-sm text-slate-900">
                      {broker.registration_number ||
                        "Not provided"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Receiving site */}

            {receiver && (
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="text-lg font-semibold">
                  Receiving site
                </h2>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Site
                    </p>

                    <p className="mt-1 text-sm text-slate-900">
                      {receiver.site_name}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Authorisation number
                    </p>

                    <p className="mt-1 text-sm text-slate-900">
                      {
                        receiver.authorisation_number
                      }
                    </p>
                  </div>

                  {receiptAddress && (
                    <div className="md:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Address
                      </p>

                      <p className="mt-1 text-sm text-slate-900">
                        {
                          receiptAddress.full_address
                        }
                        {receiptAddress.postcode
                          ? `, ${receiptAddress.postcode}`
                          : ""}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

                        {/* DEFRA STATUS */}

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold">
                DEFRA status
              </h2>

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Submission status
                </p>

                <p className="mt-1 text-sm font-medium text-slate-900">
                  {movement.defra_status === "ACCEPTED"
                    ? "Accepted by DEFRA"
                    : movement.defra_status === "REJECTED"
                      ? "Rejected by DEFRA"
                      : movement.defra_status ===
                          "SERVICE_CHARGE_REQUIRED"
                        ? "Service charge required"
                        : movement.defra_status ===
                            "DEFRA_UNEXPECTED_RESPONSE"
                          ? "Unexpected DEFRA response"
                          : movement.defra_status ===
                              "SERVICE_UNAVAILABLE"
                            ? "DEFRA unavailable"
                            : movement.defra_status ===
                                "AUTHENTICATION_ERROR"
                              ? "DEFRA authentication error"
                              : movement.defra_status ||
                                "Not available"}
                </p>
              </div>

              {/* DEFRA rejection reasons */}

              {movement.defra_status === "REJECTED" &&
                defraResponse?.validation?.errors &&
                defraResponse.validation.errors.length > 0 && (
                  <div className="mt-5 border-t border-slate-100 pt-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                      DEFRA rejection reasons
                    </p>

                    <div className="mt-3 space-y-3">
                      {defraResponse.validation.errors.map(
                        (error, index) => {
                          let title =
                            error.key ||
                            "DEFRA validation error";

                          let message =
                            error.message ||
                            "DEFRA returned a validation error.";

                          if (
                            error.key ===
                            "hazardousWasteConsignmentCode"
                          ) {
                            title =
                              "Hazardous waste consignment code";

                            message =
                              "The hazardous waste consignment code is not in a valid format. Please check the format required for your environmental regulator.";
                          }

                          if (
                            error.key ===
                            "wasteItems.0.hazardous.components"
                          ) {
                            title =
                              "Hazardous waste components";

                            message =
                              "Hazardous waste components are required when the receipt contains hazardous waste.";
                          }

                          return (
                            <div
                              key={index}
                              className="rounded-lg border border-red-200 bg-red-50 p-4"
                            >
                              <p className="text-sm font-semibold text-red-900">
                                {title}
                              </p>

                              <p className="mt-1 text-sm text-red-800">
                                {message}
                              </p>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>
                )}

              {/* DEFRA warnings */}

              {defraResponse?.validation?.warnings &&
                defraResponse.validation.warnings.length > 0 && (
                  <div className="mt-5 border-t border-slate-100 pt-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                      Warnings
                    </p>

                    <div className="mt-3 space-y-3">
                      {defraResponse.validation.warnings.map(
                        (warning, index) => (
                          <div
                            key={index}
                            className="rounded-lg border border-amber-200 bg-amber-50 p-4"
                          >
                            <p className="text-sm font-semibold text-amber-900">
                              {warning.message ||
                                "DEFRA returned a warning for this receipt."}
                            </p>

                            {warning.key && (
                              <p className="mt-1 text-xs text-amber-800">
                                {warning.key}
                              </p>
                            )}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}