"use client";

import { useState } from "react";

export type BrokerData = {
  present: boolean;
  organisationName: string;
  registrationNumber: string;
  phone: string;
  email: string;
  address: string;
  postcode: string;
};

type BrokerDealerSectionProps = {
  broker: BrokerData;
  onBrokerChange: (broker: BrokerData) => void;
};

export default function BrokerDealerSection({
  broker,
  onBrokerChange,
}: BrokerDealerSectionProps) {
  const [showOptionalDetails, setShowOptionalDetails] =
    useState(false);

  const inputClass =
    "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

  const updateBroker = (
    updates: Partial<BrokerData>,
  ) => {
    onBrokerChange({
      ...broker,
      ...updates,
    });
  };

  const handleBrokerPresentChange = (
    checked: boolean,
  ) => {
    updateBroker({
      present: checked,
    });

    if (!checked) {
      setShowOptionalDetails(false);
    }
  };

  return (
    <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            4. Broker / dealer
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Optional. Complete only when a broker or dealer is involved.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-800">
          <input
            type="checkbox"
            checked={broker.present}
            onChange={(e) =>
              handleBrokerPresentChange(
                e.target.checked,
              )
            }
            className="h-4 w-4"
          />

          Broker / dealer involved
        </label>
      </div>

      {broker.present && (
        <div className="mt-6">
          <div>
            <label className="text-sm font-medium text-slate-800">
              Organisation name{" "}
              <span className="text-red-600">*</span>
            </label>

            <input
              value={broker.organisationName}
              onChange={(e) => {
                updateBroker({
                  organisationName: e.target.value,
                });
              }}
              className={inputClass}
            />
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
                ? "− Hide optional broker details"
                : "+ Add broker contact / registration"}
            </button>

            {showOptionalDetails && (
              <div className="mt-5 grid gap-6 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-800">
                    Registration number{" "}
                    <span className="text-xs font-normal text-slate-500">
                      (optional)
                    </span>
                  </label>

                  <input
                    value={broker.registrationNumber}
                    onChange={(e) => {
                      updateBroker({
                        registrationNumber:
                          e.target.value,
                      });
                    }}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-800">
                    Phone{" "}
                    <span className="text-xs font-normal text-slate-500">
                      (optional)
                    </span>
                  </label>

                  <input
                    value={broker.phone}
                    onChange={(e) => {
                      updateBroker({
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
                    value={broker.email}
                    onChange={(e) => {
                      updateBroker({
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
                    value={broker.address}
                    onChange={(e) => {
                      updateBroker({
                        address: e.target.value,
                      });
                    }}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-800">
                    Postcode{" "}
                    {broker.address ? (
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
                    value={broker.postcode}
                    onChange={(e) => {
                      updateBroker({
                        postcode: e.target.value,
                      });
                    }}
                    className={inputClass}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}