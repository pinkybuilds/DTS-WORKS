"use client";

import { useState } from "react";

import type { WasteItem } from "./WasteItemsSection";
import Link from "next/link";

type OtherReference = {
  type: string;
  reference: string;
};

type SiteProfile = {
  siteName: string;
};

type ComplianceIssue = {
  code: string;
  message: string;
  title?: string;
  field?: string;
  value?: string;
};

type ComplianceResult = {
  status:
    | "PASS"
    | "ERROR"
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

type ReceiptCheckSectionProps = {
  dateTimeReceived?: string;
  uniqueReferenceId?: string;
  otherReferences?: OtherReference[];
  wasteItems?: WasteItem[];
  carrierOrganisationName?: string;
  meansOfTransport?: string;
  vehicleRegistration?: string;
  brokerPresent?: boolean;
  brokerOrganisationName?: string;
  siteProfile?: SiteProfile;
  receiptFullAddress?: string;
  receiptPostcode?: string;
  complianceResult?: ComplianceResult | null;
  validationIssues?: string[];
  submitted?: boolean;
  isSubmitting?: boolean;
  submitReceipt?: () => void;
  submitMessage?: string;
  receiptCode?: string;
  defraResponse?: DefraResponse | null;
 submissionStatus?: SubmissionStatus | null;
  getReferenceTypeLabel?: (type: string) => string;
  onEditSection?: (section: string) => void;
  createNewReceipt?: () => void;
};

export default function ReceiptCheckSection({
  dateTimeReceived = "",
  uniqueReferenceId = "",
  otherReferences = [],
  wasteItems = [],
  carrierOrganisationName = "",
  meansOfTransport = "",
  vehicleRegistration = "",
  brokerPresent = false,
  brokerOrganisationName = "",
  siteProfile = {
    siteName: "Receiving site",
  },
  receiptFullAddress = "",
  receiptPostcode = "",
  complianceResult = null,
  validationIssues = [],
  submitted = false,
  isSubmitting = false,
  submitReceipt = () => {},
  submitMessage = "",
  receiptCode = "",
  defraResponse = null,
  submissionStatus = null,
  getReferenceTypeLabel = (type: string) => type,
  onEditSection,
  createNewReceipt = () => {},
}: ReceiptCheckSectionProps) {
  const [showCheckResults, setShowCheckResults] =
    useState(false);

  const [showReviewDetails, setShowReviewDetails] =
    useState(true);

  const totalWasteItems = wasteItems.length;

  const totalWeight = wasteItems.reduce(
    (total, item) => {
      const amount = Number(item.weightAmount);

      if (!Number.isFinite(amount)) {
        return total;
      }

      if (
        item.weightUnit.toLowerCase() ===
        "tonnes"
      ) {
        return total + amount;
      }

      if (
        item.weightUnit.toLowerCase() ===
        "kilograms"
      ) {
        return total + amount / 1000;
      }

      if (
        item.weightUnit.toLowerCase() ===
        "grams"
      ) {
        return total + amount / 1_000_000;
      }

      return total;
    },
    0,
  );

  const defraErrors =
    typeof defraResponse?.response === "object" &&
    defraResponse.response !== null &&
    "validation" in defraResponse.response &&
    typeof defraResponse.response.validation ===
      "object" &&
    defraResponse.response.validation !== null &&
    "errors" in defraResponse.response.validation &&
    Array.isArray(
      defraResponse.response.validation.errors,
    )
      ? defraResponse.response.validation.errors.map(
          (error: {
            key?: string;
            errorType?: string;
            message?: string;
          }) => {
            if (
              error.key ===
              "hazardousWasteConsignmentCode"
            ) {
              return {
                title:
                  "Hazardous waste consignment code",
                message:
                  "The hazardous waste consignment code is not in a valid format. Please check the format required for your environmental regulator.",
              };
            }

            if (
              error.key ===
              "wasteItems.0.hazardous.components"
            ) {
              return {
                title:
                  "Hazardous waste components",
                message:
                  "Hazardous waste components are required when the receipt contains hazardous waste.",
              };
            }

            return {
              title:
                error.key ||
                "DEFRA validation issue",
              message:
                error.message ||
                "DEFRA returned a validation error.",
            };
          },
        )
      : [];

  const defraWarnings =
    typeof defraResponse?.response === "object" &&
    defraResponse.response !== null &&
    "validation" in defraResponse.response &&
    typeof defraResponse.response.validation ===
      "object" &&
    defraResponse.response.validation !== null &&
    "warnings" in defraResponse.response.validation &&
    Array.isArray(
      defraResponse.response.validation.warnings,
    )
      ? defraResponse.response.validation.warnings.map(
          (warning: {
            key?: string;
            errorType?: string;
            message?: string;
          }) => {
            if (
              warning.key ===
              "wasteItems.0.disposalOrRecoveryCodes"
            ) {
              return {
                title:
                  "Disposal or recovery codes",
                message:
                  "Disposal or recovery codes were not provided. DEFRA recommends these codes for proper waste tracking and compliance.",
              };
            }

            return {
              title:
                warning.key ||
                "DEFRA warning",
              message:
                warning.message ||
                "DEFRA returned a warning for this receipt.",
            };
          },
        )
      : [];

  const defraRecommendations =
    typeof defraResponse?.response === "object" &&
    defraResponse.response !== null &&
    "validation" in defraResponse.response &&
    typeof defraResponse.response.validation ===
      "object" &&
    defraResponse.response.validation !== null &&
    "recommendations" in
      defraResponse.response.validation &&
    Array.isArray(
      defraResponse.response.validation
        .recommendations,
    )
      ? defraResponse.response.validation.recommendations.map(
          (recommendation: {
            key?: string;
            errorType?: string;
            message?: string;
          }) => ({
            title:
              recommendation.key ||
              "DEFRA recommendation",
            message:
              recommendation.message ||
              "DEFRA returned a recommendation for this receipt.",
          }),
        )
      : [];

  const validOtherReferences =
    otherReferences.filter(
      (reference) =>
        reference.type &&
        reference.reference.trim(),
    );

  const validWasteItems = wasteItems.filter(
    (item) =>
      item.ewcCodes.some(Boolean) ||
      item.wasteDescription.trim() ||
      item.weightAmount.trim(),
  );

  const hasSubmissionResult =
    submitted || !!submissionStatus;

  function openCheck() {
    setShowCheckResults(true);
    setShowReviewDetails(true);
  }

  function closeCheck() {
    setShowCheckResults(false);
    setShowReviewDetails(false);
  }

  function handleSubmit() {
    setShowCheckResults(true);
    setShowReviewDetails(true);

    if (
      submitted ||
      isSubmitting ||
      hasSubmissionResult
    ) {
      return;
    }

    /*
     * The backend is the compliance gate.
     *
     * page.tsx sends the receipt to /log-waste.
     * The backend then:
     *
     * 1. Validates the receipt schema
     * 2. Runs ComplianceEngine
     * 3. Stops if compliance does not pass
     * 4. Sends to DEFRA if compliance passes
     *
     * Therefore we must NOT require a frontend
     * complianceResult === PASS before calling
     * submitReceipt().
     */

    submitReceipt();
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      {/* CHECK RECEIPT */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            6. Check receipt
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Quick check before you submit.
          </p>
        </div>

        <button
          type="button"
          onClick={
            showCheckResults
              ? closeCheck
              : openCheck
          }
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          {showCheckResults
            ? "Hide check"
            : "View check"}
        </button>
      </div>

      {/* SUMMARY */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Received
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-900">
            {dateTimeReceived
              ? new Date(
                  dateTimeReceived,
                ).toLocaleString()
              : "Not provided"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Waste
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-900">
            {totalWasteItems}{" "}
            {totalWasteItems === 1
              ? "item"
              : "items"}{" "}
            · {totalWeight.toFixed(3)} tonnes
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Carrier
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-900">
            {carrierOrganisationName ||
              "Not provided"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Receiving site
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-900">
            {siteProfile.siteName}
          </p>
        </div>
      </div>

      {/* REVIEW DETAILS */}
      <div className="mt-6 border-t border-slate-200 pt-6">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-900">
            Review details
          </h4>

          <button
            type="button"
            onClick={() =>
              setShowReviewDetails(
                (current) => !current,
              )
            }
            className="text-sm font-semibold text-slate-700 hover:text-slate-900"
          >
            {showReviewDetails
              ? "Hide details"
              : "View details"}
          </button>
        </div>

        {showReviewDetails && (
          <div className="mt-4 space-y-4">
            {/* MOVEMENT */}
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h5 className="text-sm font-semibold text-slate-900">
                    Movement
                  </h5>

                  <div className="mt-2 space-y-1 text-sm text-slate-600">
                    <p>
                      <span className="font-medium text-slate-700">
                        Date/time received:
                      </span>{" "}
                      {dateTimeReceived
                        ? new Date(
                            dateTimeReceived,
                          ).toLocaleString()
                        : "Not provided"}
                    </p>

                    <p>
                      <span className="font-medium text-slate-700">
                        Unique reference:
                      </span>{" "}
                      {uniqueReferenceId ||
                        "Not provided"}
                    </p>

                    {validOtherReferences.length >
                      0 && (
                      <div>
                        <p className="font-medium text-slate-700">
                          Other references:
                        </p>

                        <ul className="mt-1 list-disc pl-5">
                          {validOtherReferences.map(
                            (reference, index) => (
                              <li
                                key={`${reference.type}-${index}`}
                              >
                                {getReferenceTypeLabel(
                                  reference.type,
                                )}
                                :{" "}
                                {
                                  reference.reference
                                }
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onEditSection?.("movement")
                  }
                  className="text-sm font-semibold text-slate-700 hover:text-slate-900"
                >
                  Edit
                </button>
              </div>
            </div>

            {/* WASTE */}
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h5 className="text-sm font-semibold text-slate-900">
                    Waste
                  </h5>

                  <div className="mt-2 space-y-3">
                    {validWasteItems.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        No waste items provided.
                      </p>
                    ) : (
                      validWasteItems.map(
                        (item, index) => (
                          <div
                            key={`waste-${index}`}
                            className="rounded-lg bg-slate-50 p-3 text-sm"
                          >
                            <p className="font-medium text-slate-900">
                              Waste item {index + 1}
                            </p>

                            {item.ewcCodes.filter(
                              Boolean,
                            ).length > 0 && (
                              <p className="mt-1 text-slate-600">
                                <span className="font-medium text-slate-700">
                                  EWC:
                                </span>{" "}
                                {item.ewcCodes
                                  .filter(Boolean)
                                  .join(", ")}
                              </p>
                            )}

                            {item.wasteDescription.trim() && (
                              <p className="mt-1 text-slate-600">
                                <span className="font-medium text-slate-700">
                                  Description:
                                </span>{" "}
                                {
                                  item.wasteDescription
                                }
                              </p>
                            )}

                            {item.weightAmount.trim() && (
                              <p className="mt-1 text-slate-600">
                                <span className="font-medium text-slate-700">
                                  Weight:
                                </span>{" "}
                                {
                                  item.weightAmount
                                }{" "}
                                {
                                  item.weightUnit
                                }
                              </p>
                            )}
                          </div>
                        ),
                      )
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onEditSection?.("waste")
                  }
                  className="text-sm font-semibold text-slate-700 hover:text-slate-900"
                >
                  Edit
                </button>
              </div>
            </div>

            {/* CARRIER */}
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h5 className="text-sm font-semibold text-slate-900">
                    Carrier
                  </h5>

                  <div className="mt-2 space-y-1 text-sm text-slate-600">
                    <p>
                      <span className="font-medium text-slate-700">
                        Organisation:
                      </span>{" "}
                      {carrierOrganisationName ||
                        "Not provided"}
                    </p>

                    <p>
                      <span className="font-medium text-slate-700">
                        Means of transport:
                      </span>{" "}
                      {meansOfTransport ||
                        "Not provided"}
                    </p>

                    <p>
                      <span className="font-medium text-slate-700">
                        Vehicle registration:
                      </span>{" "}
                      {vehicleRegistration ||
                        "Not provided"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onEditSection?.("carrier")
                  }
                  className="text-sm font-semibold text-slate-700 hover:text-slate-900"
                >
                  Edit
                </button>
              </div>
            </div>

            {/* BROKER / DEALER */}
            {brokerPresent && (
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h5 className="text-sm font-semibold text-slate-900">
                      Broker / dealer
                    </h5>

                    <p className="mt-2 text-sm text-slate-600">
                      <span className="font-medium text-slate-700">
                        Organisation:
                      </span>{" "}
                      {brokerOrganisationName ||
                        "Not provided"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onEditSection?.("broker")
                    }
                    className="text-sm font-semibold text-slate-700 hover:text-slate-900"
                  >
                    Edit
                  </button>
                </div>
              </div>
            )}

            {/* RECEIVING SITE */}
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h5 className="text-sm font-semibold text-slate-900">
                    Receiving site
                  </h5>

                  <div className="mt-2 space-y-1 text-sm text-slate-600">
                    <p>
                      <span className="font-medium text-slate-700">
                        Site:
                      </span>{" "}
                      {siteProfile.siteName}
                    </p>

                    <p>
                      <span className="font-medium text-slate-700">
                        Address:
                      </span>{" "}
                      {receiptFullAddress ||
                        "Not provided"}
                    </p>

                    <p>
                      <span className="font-medium text-slate-700">
                        Postcode:
                      </span>{" "}
                      {receiptPostcode ||
                        "Not provided"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onEditSection?.(
                      "receiving-site",
                    )
                  }
                  className="text-sm font-semibold text-slate-700 hover:text-slate-900"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* COMPLIANCE */}
      <div className="mt-6 border-t border-slate-200 pt-6">
        <h4 className="text-sm font-semibold text-slate-900">
          Compliance
        </h4>

        {complianceResult &&
        complianceResult.status !== "PASS" ? (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">
              {complianceResult.status.replaceAll(
                "_",
                " ",
              )}
            </p>

            {complianceResult.issues.length >
              0 && (
              <div className="mt-3 space-y-2">
                {complianceResult.issues.map(
                  (issue, index) => (
                    <div
                      key={`${issue.code}-${index}`}
                      className="rounded-lg bg-white p-3"
                    >
                      <p className="text-sm font-semibold text-slate-900">
                        {issue.title ||
                          issue.code}
                      </p>

                      <p className="mt-1 text-sm text-slate-600">
                        {issue.message}
                      </p>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">
              Ready for checking
            </p>

            <p className="mt-1 text-sm text-slate-600">
              Submit the receipt to run the
              compliance checks.
            </p>
          </div>
        )}
      </div>

      {/* VALIDATION ISSUES */}
      {validationIssues.length > 0 && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-900">
            Please review the following:
          </p>

          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-800">
            {validationIssues.map(
              (issue, index) => (
                <li key={index}>{issue}</li>
              ),
            )}
          </ul>
        </div>
      )}

      {/* SUBMIT */}
<div className="mt-6 flex flex-col items-stretch justify-end gap-3 sm:flex-row sm:items-center">
  <button
    type="button"
    onClick={handleSubmit}
    disabled={
      submitted ||
      isSubmitting ||
      hasSubmissionResult
    }
    className={`rounded-xl px-6 py-3 text-sm font-semibold ${
      submitted ||
      isSubmitting ||
      hasSubmissionResult
        ? "cursor-not-allowed bg-slate-200 text-slate-400"
        : "bg-slate-900 text-white hover:bg-slate-800"
    }`}
  >
    {isSubmitting
      ? "Submitting..."
      : submissionStatus === "DEFRA_REJECTED"
        ? "Rejected"
        : submissionStatus === "ACCEPTED"
          ? "Submitted"
          : hasSubmissionResult
            ? "Submission issue"
            : "Submit waste receipt"}
  </button>
</div>

{/* SUBMIT MESSAGE */}
{submitMessage && !defraResponse && (
  <p className="mt-4 text-right text-sm text-slate-600">
    {submitMessage}
  </p>
)}
            {/* SUCCESS */}
      {submissionStatus === "ACCEPTED" && (
        <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5">
          <p className="text-sm font-semibold text-green-900">
            Waste receipt submitted
          </p>

          <p className="mt-1 text-sm text-green-800">
            The receipt was accepted by DEFRA.
          </p>

          {receiptCode && (
            <p className="mt-3 text-sm text-green-900">
              <span className="font-semibold">
                Receipt reference:
              </span>{" "}
              {receiptCode}
            </p>
          )}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
            {receiptCode && (
              <Link
                href={`/receipts/${receiptCode}`}
                className="rounded-xl border border-green-300 px-5 py-2.5 text-sm font-semibold text-green-700 hover:bg-green-100"
              >
                View receipt
              </Link>
            )}

            <button
              type="button"
              onClick={createNewReceipt}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Create new receipt
            </button>
          </div>

          {defraWarnings.length > 0 && (
            <div className="mt-4 border-t border-green-200 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                DEFRA warning
              </p>

              <div className="mt-2 space-y-2">
                {defraWarnings.map(
                  (warning, index) => (
                    <div key={index}>
                      <p className="text-sm font-semibold text-slate-800">
                        {warning.title}
                      </p>

                      <p className="mt-1 text-sm text-slate-600">
                        {warning.message}
                      </p>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* DEFRA RECOMMENDATIONS */}
      {defraRecommendations.length > 0 && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-semibold text-slate-900">
            Recommendations
          </p>

          <div className="mt-3 space-y-3">
            {defraRecommendations.map(
              (recommendation, index) => (
                <div key={index}>
                  <p className="text-sm font-semibold text-slate-900">
                    {recommendation.title}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    {recommendation.message}
                  </p>
                </div>
              ),
            )}
          </div>
        </div>
      )}

      {/* DEFRA REJECTION */}
      {submissionStatus === "DEFRA_REJECTED" && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-semibold text-red-900">
            DEFRA could not accept this receipt
          </p>

          {defraErrors.length > 0 && (
            <div className="mt-3 space-y-3">
              {defraErrors.map(
                (error, index) => (
                  <div key={index}>
                    <p className="text-sm font-semibold text-red-900">
                      {error.title}
                    </p>

                    <p className="mt-1 text-sm text-red-800">
                      {error.message}
                    </p>
                  </div>
                ),
              )}
            </div>
          )}

          {receiptCode && (
            <p className="mt-3 text-sm text-red-900">
              <span className="font-semibold">
                Receipt reference:
              </span>{" "}
              {receiptCode}
            </p>
          )}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
            {receiptCode && (
              <Link
                href={`/receipts/${receiptCode}`}
                className="rounded-xl border border-red-300 px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100"
              >
                View receipt
              </Link>
            )}

            <button
              type="button"
              onClick={createNewReceipt}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Create new receipt
            </button>
          </div>
        </div>
      )}

      {/* DEFRA SERVICE CHARGE REQUIRED */}
      {submissionStatus ===
        "DEFRA_SERVICE_CHARGE_REQUIRED" && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-900">
            DEFRA service charge required
          </p>

          <p className="mt-1 text-sm text-amber-800">
            A service charge is required before DEFRA
            can process this receipt.
          </p>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={createNewReceipt}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Create new receipt
            </button>
          </div>
        </div>
      )}
      {/* DEFRA UNEXPECTED RESPONSE */}
      {submissionStatus === "DEFRA_UNEXPECTED_RESPONSE" && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-900">
            DEFRA returned an unexpected response
          </p>

          <p className="mt-1 text-sm text-amber-800">
            DEFRA returned a response that DTS Works
            did not expect. The receipt was not accepted.
          </p>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={createNewReceipt}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Create new receipt
            </button>
          </div>
        </div>
      )}

      {/* DEFRA UNAVAILABLE */}
      {submissionStatus === "SERVICE_UNAVAILABLE" && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-900">
            DEFRA is currently unavailable
          </p>

          <p className="mt-1 text-sm text-amber-800">
            DTS Works could not connect to DEFRA.
            The receipt has not been accepted.
          </p>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={createNewReceipt}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Create new receipt
            </button>
          </div>
        </div>
      )}

      {/* DEFRA AUTHENTICATION ERROR */}
      {submissionStatus === "AUTHENTICATION_ERROR" && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-semibold text-red-900">
            DEFRA authentication error
          </p>

          <p className="mt-1 text-sm text-red-800">
            DTS Works could not authenticate with DEFRA.
            The receipt has not been accepted.
          </p>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={createNewReceipt}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Create new receipt
            </button>
          </div>
        </div>
      )}

      {/* INTERNAL ERROR */}
      {submissionStatus === "INTERNAL_ERROR" && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-semibold text-red-900">
            The receipt could not be processed
          </p>

          <p className="mt-1 text-sm text-red-800">
            An unexpected error occurred while processing
            the receipt. The receipt has not been recorded
            as accepted.
          </p>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={createNewReceipt}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Create new receipt
            </button>
          </div>
        </div>
      )}
    </section>
  )
}