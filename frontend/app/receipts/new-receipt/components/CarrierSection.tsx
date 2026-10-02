"use client";

import { useState } from "react";

const transportModes = [
  "Road",
  "Rail",
  "Water",
  "Air",
  "Other",
];

const ENGLAND_WALES_PATTERNS = [
  /^CBDL\d+$/i,
  /^CBDU\d+$/i,
];

const SCOTLAND_PATTERNS = [
  /^WCR*\/R*\/\d{7}$/i,
  /^SCO*\/\d{6}$/i,
  /^SEA*\/\d{6}$/i,
  /^SNO*\/\d{6}$/i,
  /^SWE*\/\d{6}$/i,
  /^WCR*\/\d{6}$/i,
  /^PCT-[A-Z]-\d{3,7}$/i,
];

const NORTHERN_IRELAND_PATTERNS = [
  /^ROC\s?UT\s?\d{1,5}$/i,
  /^ROC\s?LT\s?\d{1,5}$/i,
];

function isValidCarrierRegistration(
  value: string,
): boolean {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return false;
  }

  const patterns = [
    ...ENGLAND_WALES_PATTERNS,
    ...SCOTLAND_PATTERNS,
    ...NORTHERN_IRELAND_PATTERNS,
  ];

  return patterns.some((pattern) =>
    pattern.test(trimmedValue),
  );
}

export type CarrierData = {
  organisationName: string;
  registrationNumber: string;
  noRegistrationReason: string;
  meansOfTransport: string;
  vehicleRegistration: string;
  phone: string;
  email: string;
  address: string;
  postcode: string;
};

type CarrierSectionProps = {
  carrier: CarrierData;
  onCarrierChange: (
    carrier: CarrierData,
  ) => void;
};

export default function CarrierSection({
  carrier,
  onCarrierChange,
}: CarrierSectionProps) {
  const [
    registrationNumberTouched,
    setRegistrationNumberTouched,
  ] = useState(false);

  const [showOptionalDetails, setShowOptionalDetails] =
    useState(false);

  const inputClass =
    "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

  const registrationNumberInvalid =
    registrationNumberTouched &&
    carrier.registrationNumber.trim().length > 0 &&
    !isValidCarrierRegistration(
      carrier.registrationNumber,
    );

  const updateCarrier = (
    updates: Partial<CarrierData>,
  ) => {
    onCarrierChange({
      ...carrier,
      ...updates,
    });
  };

  return (
    <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-slate-900">
        3. Carrier
      </h3>

      <p className="mt-1 mb-6 text-sm text-slate-500">
        Record who transported the waste.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-800">
            Organisation name{" "}
            <span className="text-red-600">*</span>
          </label>

          <input
            value={carrier.organisationName}
            onChange={(e) => {
              updateCarrier({
                organisationName: e.target.value,
              });
            }}
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-800">
            Registration number
            <span className="ml-1 text-xs font-normal text-slate-500">
              (or give a reason below)
            </span>
          </label>

          <input
            value={carrier.registrationNumber}
            onChange={(e) => {
              const value = e.target.value;

              setRegistrationNumberTouched(false);

              updateCarrier({
                registrationNumber: value,
                noRegistrationReason: value
                  ? ""
                  : carrier.noRegistrationReason,
              });
            }}
            onBlur={() => {
              setRegistrationNumberTouched(true);
            }}
            placeholder="Carrier registration"
            className={inputClass}
          />

          {registrationNumberInvalid && (
            <p className="mt-2 text-sm text-amber-700">
              ⚠️ Invalid format
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-800">
            Reason for no registration number
            <span className="ml-1 text-xs font-normal text-slate-500">
              (conditional)
            </span>
          </label>

          <select
            value={carrier.noRegistrationReason}
            onChange={(e) => {
              updateCarrier({
                noRegistrationReason: e.target.value,
              });
            }}
            disabled={Boolean(
              carrier.registrationNumber,
            )}
            className={`${inputClass} ${
              carrier.registrationNumber
                ? "cursor-not-allowed bg-slate-100 text-slate-400"
                : ""
            }`}
          >
            <option value="">
              Select reason
            </option>

            <option value="ON_SITE">
              ON_SITE — Movement within same premises
            </option>

            <option value="HOUSEHOLD">
              HOUSEHOLD — Householder transporting own waste
            </option>

            <option value="ONE_OFF">
              ONE_OFF — One-off or infrequent transport
            </option>

            <option value="MARINE">
              MARINE — Marine transport
            </option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-800">
            Means of transport{" "}
            <span className="text-red-600">*</span>
          </label>

          <select
            value={carrier.meansOfTransport}
            onChange={(e) => {
              updateCarrier({
                meansOfTransport: e.target.value,
              });
            }}
            className={inputClass}
          >
            <option value="">
              Select transport
            </option>

            {transportModes.map((mode) => (
              <option
                key={mode}
                value={mode}
              >
                {mode}
              </option>
            ))}
          </select>
        </div>

        {carrier.meansOfTransport === "Road" && (
          <div>
            <label className="text-sm font-medium text-slate-800">
              Vehicle registration{" "}
              <span className="text-red-600">*</span>
            </label>

            <input
              value={carrier.vehicleRegistration}
              onChange={(e) => {
                updateCarrier({
                  vehicleRegistration:
                    e.target.value,
                });
              }}
              placeholder="Vehicle registration"
              className={inputClass}
            />
          </div>
        )}
      </div>

      <div className="mt-6 border-t border-slate-200 pt-6">
        <button
          type="button"
          onClick={() =>
            setShowOptionalDetails(
              (current) => !current,
            )
          }
          className="text-sm font-medium text-slate-700 hover:text-slate-950"
        >
          {showOptionalDetails
            ? "− Hide optional contact details"
            : "+ Add carrier contact details"}
        </button>

        {showOptionalDetails && (
          <div className="mt-5 grid gap-6 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-800">
                Phone{" "}
                <span className="text-xs font-normal text-slate-500">
                  (optional)
                </span>
              </label>

              <input
                value={carrier.phone}
                onChange={(e) => {
                  updateCarrier({
                    phone: e.target.value,
                  });
                }}
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-800">
                Email{" "}
                <span className="text-xs font-normal text-slate-500">
                  (optional)
                </span>
              </label>

              <input
                type="email"
                value={carrier.email}
                onChange={(e) => {
                  updateCarrier({
                    email: e.target.value,
                  });
                }}
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-800">
                Address{" "}
                <span className="text-xs font-normal text-slate-500">
                  (optional)
                </span>
              </label>

              <textarea
                rows={2}
                value={carrier.address}
                onChange={(e) => {
                  updateCarrier({
                    address: e.target.value,
                  });
                }}
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-800">
                Postcode{" "}
                {carrier.address ? (
                  <span className="text-red-600">
                    *
                  </span>
                ) : (
                  <span className="text-xs font-normal text-slate-500">
                    (optional)
                  </span>
                )}
              </label>

              <input
                value={carrier.postcode}
                onChange={(e) => {
                  updateCarrier({
                    postcode: e.target.value,
                  });
                }}
                className={inputClass}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}