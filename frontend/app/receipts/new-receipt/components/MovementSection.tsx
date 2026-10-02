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

type MovementSectionProps = {
  dateTimeReceived: string;
  setDateTimeReceived: React.Dispatch<
    React.SetStateAction<string>
  >;

  uniqueReferenceId: string;
  setUniqueReferenceId: React.Dispatch<
    React.SetStateAction<string>
  >;

  otherReferences: OtherReference[];

  addOtherReference: () => void;

  updateOtherReference: (
    index: number,
    field: keyof OtherReference,
    value: string,
  ) => void;

  removeOtherReference: (
    index: number,
  ) => void;

  specialHandlingRequirements: string;

  setSpecialHandlingRequirements: React.Dispatch<
    React.SetStateAction<string>
  >;

  showSpecialHandling: boolean;

  setShowSpecialHandling: React.Dispatch<
    React.SetStateAction<boolean>
  >;

  movementContainsHazardous: boolean;

  hazardousWasteConsignmentCode: string;

  setHazardousWasteConsignmentCode: React.Dispatch<
    React.SetStateAction<string>
  >;

  reasonForNoConsignmentCode: string;

  setReasonForNoConsignmentCode: React.Dispatch<
    React.SetStateAction<string>
  >;
};

const consignmentReasons = [
  [
    "NON_HAZ_WASTE_TRANSFER",
    "Non-Haz Waste Transfer",
  ],
  [
    "NO_DOC_WITH_WASTE",
    "No documentation provided with waste",
  ],
  [
    "HWRC_RECEIPT",
    "Household Waste Recycling Centre receipt",
  ],
] as const;

const otherReferenceTypes: Array<
  [OtherReferenceType, string]
> = [
  [
    "WASTE_TRANSFER_NOTE",
    "Waste transfer note",
  ],
  [
    "HAZARDOUS_WASTE_CONSIGNMENT_NOTE",
    "Hazardous waste consignment note",
  ],
  [
    "WEIGHBRIDGE_TICKET",
    "Weighbridge ticket",
  ],
  [
    "INTERNAL_REFERENCE",
    "Internal reference",
  ],
  ["OTHER", "Other"],
];

function inputClass() {
  return "mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-300";
}

function optionalLabel(label: string) {
  return (
    <span className="font-normal text-slate-500">
      {label}
    </span>
  );
}

export default function MovementSection({
  dateTimeReceived,
  setDateTimeReceived,
  uniqueReferenceId,
  setUniqueReferenceId,
  otherReferences,
  addOtherReference,
  updateOtherReference,
  removeOtherReference,
  specialHandlingRequirements,
  setSpecialHandlingRequirements,
  showSpecialHandling,
  setShowSpecialHandling,
  movementContainsHazardous,
  hazardousWasteConsignmentCode,
  setHazardousWasteConsignmentCode,
  reasonForNoConsignmentCode,
  setReasonForNoConsignmentCode,
}: MovementSectionProps) {
  return (
    <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="text-lg font-semibold">
        1. Movement
      </h3>

      <p className="mt-1 mb-6 text-sm text-slate-500">
        Start with when the waste was received
        and any references or handling notes.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium">
            Date and time received{" "}
            <span>*</span>
          </label>

          <input
            type="datetime-local"
            value={dateTimeReceived}
            onChange={(e) =>
              setDateTimeReceived(e.target.value)
            }
            className={inputClass()}
          />

          <p className="mt-2 text-xs text-slate-500">
            Generated automatically. Edit if needed.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium">
            Unique reference{" "}
            {optionalLabel("(optional)")}
          </label>

          <input
            value={uniqueReferenceId}
            onChange={(e) =>
              setUniqueReferenceId(e.target.value)
            }
            placeholder="e.g. REC-1024"
            className={inputClass()}
          />
        </div>
      </div>

      {/* OTHER REFERENCES */}

      <div className="mt-6 border-t border-slate-200 pt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">
              Other references{" "}
              {optionalLabel("(optional)")}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Link this receipt to paperwork
              or internal references.
            </p>
          </div>

          <button
            type="button"
            onClick={addOtherReference}
            className="self-start rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50"
          >
            + Add reference
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {otherReferences.map(
            (reference, index) => (
              <div
                key={index}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
                  <div>
                    <label className="text-sm font-medium">
                      Reference type
                    </label>

                    <select
                      value={reference.type}
                      onChange={(e) =>
                        updateOtherReference(
                          index,
                          "type",
                          e.target.value,
                        )
                      }
                      className={inputClass()}
                    >
                      <option value="">
                        Select reference type
                      </option>

                      {otherReferenceTypes.map(
                        ([code, label]) => (
                          <option
                            key={code}
                            value={code}
                          >
                            {label}
                          </option>
                        ),
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      Reference number
                    </label>

                    <input
                      value={reference.reference}
                      onChange={(e) =>
                        updateOtherReference(
                          index,
                          "reference",
                          e.target.value,
                        )
                      }
                      placeholder="Reference number"
                      className={inputClass()}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      removeOtherReference(index)
                    }
                    className="mt-2 px-2 pb-3 text-left text-sm text-slate-500 hover:text-slate-900 md:mt-0"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
      </div>

      {/* SPECIAL HANDLING */}

      <div className="mt-6 border-t border-slate-200 pt-6">
        <button
          type="button"
          onClick={() =>
            setShowSpecialHandling(
              (current) => !current,
            )
          }
          className="text-sm font-medium text-slate-700 hover:text-slate-950"
        >
          {showSpecialHandling
            ? "− Special handling requirements"
            : "+ Special handling requirements"}
        </button>

        {showSpecialHandling && (
          <div className="mt-4">
            <label className="text-sm font-medium">
              Special handling requirements{" "}
              {optionalLabel("(optional)")}
            </label>

            <textarea
              rows={3}
              maxLength={5000}
              value={specialHandlingRequirements}
              onChange={(e) =>
                setSpecialHandlingRequirements(
                  e.target.value,
                )
              }
              placeholder="Add handling instructions where relevant"
              className={inputClass()}
            />
          </div>
        )}
      </div>

      {/* HAZARDOUS CONSIGNMENT */}

      {movementContainsHazardous && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-sm font-semibold">
                Hazardous consignment
              </h4>

              <p className="mt-1 text-sm text-slate-500">
                Hazardous waste requires a consignment
                code or the applicable reason when no
                code is provided.
              </p>
            </div>

            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">
              Required
            </span>
          </div>

          <div className="mt-5 grid gap-6 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">
                Consignment code{" "}
                {optionalLabel("(if provided)")}
              </label>

              <input
                value={hazardousWasteConsignmentCode}
                onChange={(e) =>
                  setHazardousWasteConsignmentCode(
                    e.target.value,
                  )
                }
                placeholder="e.g. CJ32LE/A0001"
                className={inputClass()}
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Reason for no consignment code
              </label>

              <select
                value={reasonForNoConsignmentCode}
                onChange={(e) =>
                  setReasonForNoConsignmentCode(
                    e.target.value,
                  )
                }
                className={inputClass()}
              >
                <option value="">
                  Select reason
                </option>

                {consignmentReasons.map(
                  ([code, label]) => (
                    <option
                      key={code}
                      value={code}
                    >
                      {label}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}