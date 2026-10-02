import { useEffect, useMemo, useState } from "react";

type RegistryEntry = {
  code: string;
  [key: string]: unknown;
};

type EwcEntry = {
  code: string;
  isHazardous: boolean;
  entryTypeDesc: string;
  chapter: string;
  subChapter: string;
  description: string;
};

type Component = {
  code: string;
  name: string;
  concentration: string;
};

type DisposalRecovery = {
  code: string;
  weightAmount: string;
  weightUnit: string;
  isEstimate: boolean;
};

export type WasteItem = {
  ewcCodes: string[];
  selectedEwcEntries: Array<EwcEntry | null>;
  wasteDescription: string;

  physicalForm: string;

  numberOfContainers: string;
  typeOfContainers: string;

  weightAmount: string;
  weightUnit: string;
  isEstimate: boolean;

  containsPops: boolean;
  popsSource: string;
  popsComponents: Component[];

  containsHazardous: boolean;
  hazardousManuallySet: boolean;
  hazardousSource: string;
  hazardousProperties: string[];
  hazardousComponents: Component[];
  showHazardousDetails: boolean;

  disposalRecoveryCodes: DisposalRecovery[];
};

type WasteItemsSectionProps = {
  wasteItems: WasteItem[];
  onWasteItemsChange: (items: WasteItem[]) => void;

  hazardousWasteConsignmentCode?: string;
  onHazardousWasteConsignmentCodeChange?: (
    value: string,
  ) => void;

  reasonForNoConsignmentCode?: string;
  onReasonForNoConsignmentCodeChange?: (
    value: string,
  ) => void;

  onMovementContainsHazardousChange?: (
    value: boolean,
  ) => void;
};
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const physicalForms = [
  "Gas",
  "Liquid",
  "Solid",
  "Powder",
  "Sludge",
  "Mixed",
];

const weightUnits = [
  "Grams",
  "Kilograms",
  "Tonnes",
];

const componentSources = [
  ["NOT_PROVIDED", "Not provided"],
  ["PROVIDED_WITH_WASTE", "Provided with waste"],
  ["GUIDANCE", "Guidance"],
  ["OWN_TESTING", "Own testing"],
] as const;

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

function createEmptyComponent(): Component {
  return {
    code: "",
    name: "",
    concentration: "",
  };
}

 export function createEmptyWasteItem(): WasteItem {
  return {
    ewcCodes: [""],
    selectedEwcEntries: [null],

    wasteDescription: "",

    physicalForm: "",

    numberOfContainers: "",
    typeOfContainers: "",

    weightAmount: "",
    weightUnit: "Tonnes",
    isEstimate: false,

    containsPops: false,
    popsSource: "",
    popsComponents: [],

    containsHazardous: false,
    hazardousManuallySet: false,
    hazardousSource: "",
    hazardousProperties: [],
    hazardousComponents: [],
    showHazardousDetails: false,

    disposalRecoveryCodes: [],
  };
}

async function searchRegistry<T>(
  registryName: string,
  query?: string,
  limit = 8,
): Promise<T[]> {
  const params = new URLSearchParams();

  if (query?.trim()) {
    params.set("query", query.trim());
  }

  params.set("limit", String(limit));

  const response = await fetch(
    `${API_BASE_URL}/registry/${registryName}?${params.toString()}`,
  );

  if (!response.ok) {
    throw new Error(
      `${registryName} registry request failed: ${response.status}`,
    );
  }

  return (await response.json()) as T[];
}

function getRegistryLabel(
  entry: RegistryEntry,
): string {
  const possibleLabels = [
    entry.name,
    entry.description,
    entry.shortDesc,
    entry.shortDescription,
    entry.chemicalName,
    entry.title,
    entry.label,
  ];

  const label = possibleLabels.find(
    (value) =>
      typeof value === "string" &&
      value.trim().length > 0,
  );

  return label
    ? String(label)
    : entry.code;
}

function getHazardousPropertySortValue(
  code: string,
): number {
  const match = code.match(
    /^HP[_\s-]?(\d+)$/i,
  );

  if (match) {
    return Number(match[1]);
  }

  if (
    code.toUpperCase() === "HP_POP" ||
    code.toUpperCase() === "HP-POP"
  ) {
    return 100;
  }

  return 1000;
}

 export default function WasteItemsSection({
  wasteItems,
  onWasteItemsChange,
  hazardousWasteConsignmentCode,
  onHazardousWasteConsignmentCodeChange,
  reasonForNoConsignmentCode,
  onReasonForNoConsignmentCodeChange,
  onMovementContainsHazardousChange,
}: WasteItemsSectionProps) {
  const hasHazardousWaste = wasteItems.some(
    (item) =>
      item.containsHazardous ||
      item.selectedEwcEntries.some(
        (entry) => entry?.isHazardous === true,
      ),
  );

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

  const updateWasteItems = (
    updater:
      | WasteItem[]
      | ((items: WasteItem[]) => WasteItem[]),
  ) => {
    const nextItems =
      typeof updater === "function"
        ? updater(wasteItems)
        : updater;

    onWasteItemsChange(nextItems);
  };

  /*
   * ---------------------------------------------------------
   * EWC STATE
   * ---------------------------------------------------------
   */

  const [
    ewcSearchResults,
    setEwcSearchResults,
  ] = useState<EwcEntry[]>([]);

  const [
    activeEwcSearch,
    setActiveEwcSearch,
  ] = useState<{
    index: number;
    slot: number;
  } | null>(null);

  const [
    ewcSearchLoading,
    setEwcSearchLoading,
  ] = useState(false);

  /*
   * ---------------------------------------------------------
   * WASTE DESCRIPTION SEARCH
   * ---------------------------------------------------------
   */

  const [
    descriptionSearchResults,
    setDescriptionSearchResults,
  ] = useState<EwcEntry[]>([]);

  const [
    activeDescriptionSearch,
    setActiveDescriptionSearch,
  ] = useState<number | null>(null);

  const [
    descriptionSearchLoading,
    setDescriptionSearchLoading,
  ] = useState(false);

  /*
   * ---------------------------------------------------------
   * CONTAINER TYPE REGISTRY
   * ---------------------------------------------------------
   */

  const [
    containerTypes,
    setContainerTypes,
  ] = useState<RegistryEntry[]>([]);

  const [
    containerTypesLoading,
    setContainerTypesLoading,
  ] = useState(false);

  /*
   * ---------------------------------------------------------
   * POPS STATE
   * ---------------------------------------------------------
   */

  const [
    popsSearchResults,
    setPopsSearchResults,
  ] = useState<RegistryEntry[]>([]);

  const [
    activePopsSearch,
    setActivePopsSearch,
  ] = useState<{
    index: number;
    componentIndex: number;
  } | null>(null);

  const [
    popsSearchLoading,
    setPopsSearchLoading,
  ] = useState(false);

  /*
   * ---------------------------------------------------------
   * HAZARDOUS PROPERTY REGISTRY
   * ---------------------------------------------------------
   */

  const [
    hazardousProperties,
    setHazardousProperties,
  ] = useState<RegistryEntry[]>([]);

  const [
    hazardousPropertiesLoading,
    setHazardousPropertiesLoading,
  ] = useState(false);

  /*
   * ---------------------------------------------------------
   * DISPOSAL / RECOVERY STATE
   * ---------------------------------------------------------
   */

  const [
    disposalRecoverySearchResults,
    setDisposalRecoverySearchResults,
  ] = useState<RegistryEntry[]>([]);

  const [
    activeDisposalRecoverySearch,
    setActiveDisposalRecoverySearch,
  ] = useState<{
    index: number;
    drIndex: number;
  } | null>(null);

  const [
    disposalRecoverySearchLoading,
    setDisposalRecoverySearchLoading,
  ] = useState(false);

  /*
   * ---------------------------------------------------------
   * LOAD REFERENCE DATA
   * ---------------------------------------------------------
   */

  useEffect(() => {
    async function loadReferenceData() {
      setContainerTypesLoading(true);
      setHazardousPropertiesLoading(true);

      try {
        const [
          containerResults,
          hazardousResults,
        ] = await Promise.all([
          searchRegistry<RegistryEntry>(
            "container_types",
            undefined,
            50,
          ),
          searchRegistry<RegistryEntry>(
            "hazardous_properties",
            undefined,
            50,
          ),
        ]);

        setContainerTypes(
          containerResults,
        );

        setHazardousProperties(
          hazardousResults,
        );
      } catch (error) {
        console.error(
          "Failed to load registry reference data",
          error,
        );
      } finally {
        setContainerTypesLoading(false);
        setHazardousPropertiesLoading(false);
      }
    }

    loadReferenceData();
  }, []);

  /*
   * ---------------------------------------------------------
   * CLOSE SEARCH DROPDOWNS WHEN CLICKING OUTSIDE
   * ---------------------------------------------------------
   */

  useEffect(() => {
    function handleDocumentMouseDown(
      event: MouseEvent,
    ) {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      if (
        target.closest(
          "[data-registry-search-root]",
        )
      ) {
        return;
      }

      setEwcSearchResults([]);
      setActiveEwcSearch(null);

      setDescriptionSearchResults([]);
      setActiveDescriptionSearch(null);

      setPopsSearchResults([]);
      setActivePopsSearch(null);

      setDisposalRecoverySearchResults([]);
      setActiveDisposalRecoverySearch(null);
    }

    document.addEventListener(
      "mousedown",
      handleDocumentMouseDown,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleDocumentMouseDown,
      );
    };
  }, []);

  /*
   * ---------------------------------------------------------
   * WASTE ITEM HELPERS
   * ---------------------------------------------------------
   */

  function updateWasteItem(
    index: number,
    patch: Partial<WasteItem>,
  ) {
    updateWasteItems((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              ...patch,
            }
          : item,
      ),
    );
  }

  function addWasteItem() {
    updateWasteItems((items) => [
      ...items,
      createEmptyWasteItem(),
    ]);
  }

  function removeWasteItem(
    index: number,
  ) {
    updateWasteItems((items) =>
      items.filter(
        (_, itemIndex) =>
          itemIndex !== index,
      ),
    );
  }

  /*
   * ---------------------------------------------------------
   * EWC HELPERS
   * ---------------------------------------------------------
   */

  async function searchEwcCodes(
    index: number,
    slot: number,
    query: string,
  ) {
    const search = query.trim();

    setActiveEwcSearch({
      index,
      slot,
    });

    if (!search) {
      setEwcSearchResults([]);
      return;
    }

    setEwcSearchLoading(true);

    try {
      const results =
        await searchRegistry<EwcEntry>(
          "ewc",
          search,
          8,
        );

      setEwcSearchResults(
        results.slice(0, 8),
      );
    } catch (error) {
      console.error(
        "EWC search failed",
        error,
      );

      setEwcSearchResults([]);
    } finally {
      setEwcSearchLoading(false);
    }
  }

  async function searchEwcByDescription(
    index: number,
    query: string,
  ) {
    const search = query.trim();

    setActiveDescriptionSearch(index);

    if (!search) {
      setDescriptionSearchResults([]);
      return;
    }

    setDescriptionSearchLoading(true);

    try {
      const results =
        await searchRegistry<EwcEntry>(
          "ewc",
          search,
          8,
        );

      setDescriptionSearchResults(
        results.slice(0, 8),
      );
    } catch (error) {
      console.error(
        "EWC description search failed",
        error,
      );

      setDescriptionSearchResults([]);
    } finally {
      setDescriptionSearchLoading(false);
    }
  }

  function getEwcHazardousState(
    item: WasteItem,
  ) {
    return item.selectedEwcEntries.some(
      (entry) =>
        entry?.isHazardous === true,
    );
  }

  function applyHazardousStateFromEwc(
    item: WasteItem,
    selectedEntries: Array<EwcEntry | null>,
  ): Partial<WasteItem> {
    const ewcIsHazardous =
      selectedEntries.some(
        (entry) =>
          entry?.isHazardous === true,
      );

    if (ewcIsHazardous) {
      return {
        containsHazardous: true,
        hazardousManuallySet: false,
        showHazardousDetails: true,
      };
    }

    return {
      containsHazardous:
        item.hazardousManuallySet,
      showHazardousDetails:
        item.hazardousManuallySet
          ? item.showHazardousDetails
          : false,
      ...(item.hazardousManuallySet
        ? {}
        : {
            hazardousSource: "",
            hazardousProperties: [],
            hazardousComponents: [],
          }),
    };
  }

  function selectEwcCode(
    index: number,
    selected: EwcEntry,
    slot = 0,
  ) {
    updateWasteItems((items) =>
      items.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        const ewcCodes = [
          ...item.ewcCodes,
        ];

        const selectedEntries = [
          ...item.selectedEwcEntries,
        ];

        ewcCodes[slot] = selected.code;
        selectedEntries[slot] = selected;

        const nextHazardousState =
          applyHazardousStateFromEwc(
            item,
            selectedEntries,
          );

        return {
          ...item,
          ewcCodes,
          selectedEwcEntries:
            selectedEntries,
          wasteDescription:
            selected.description ||
            item.wasteDescription,
          ...nextHazardousState,
        };
      }),
    );

    setEwcSearchResults([]);
    setActiveEwcSearch(null);
  }

  async function resolveEwcCode(
    index: number,
    slot: number,
    query: string,
  ) {
    const search = query.trim();

    if (!search) {
      return;
    }

    try {
      const results =
        await searchRegistry<EwcEntry>(
          "ewc",
          search,
          8,
        );

      const exactMatch =
        results.find(
          (entry) =>
            entry.code === search,
        );

      if (exactMatch) {
        selectEwcCode(
          index,
          exactMatch,
          slot,
        );
      }
    } catch (error) {
      console.error(
        "EWC lookup failed",
        error,
      );
    }
  }

  function updateEwc(
    index: number,
    slot: number,
    value: string,
  ) {
    updateWasteItems((items) =>
      items.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        const ewcCodes = [
          ...item.ewcCodes,
        ];

        const selectedEntries = [
          ...item.selectedEwcEntries,
        ];

        ewcCodes[slot] = value;
        selectedEntries[slot] = null;

        const nextHazardousState =
          applyHazardousStateFromEwc(
            item,
            selectedEntries,
          );

        return {
          ...item,
          ewcCodes,
          selectedEwcEntries:
            selectedEntries,
          ...nextHazardousState,
        };
      }),
    );
  }

  function addEwcCode(
    index: number,
  ) {
    updateWasteItems((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index &&
        item.ewcCodes.length < 5
          ? {
              ...item,
              ewcCodes: [
                ...item.ewcCodes,
                "",
              ],
              selectedEwcEntries: [
                ...item.selectedEwcEntries,
                null,
              ],
            }
          : item,
      ),
    );
  }

  function removeEwcCode(
    index: number,
    slot: number,
  ) {
    updateWasteItems((items) =>
      items.map((item, itemIndex) => {
        if (
          itemIndex !== index ||
          item.ewcCodes.length === 1
        ) {
          return item;
        }

        const nextEwcCodes =
          item.ewcCodes.filter(
            (_, ewcIndex) =>
              ewcIndex !== slot,
          );

        const nextSelectedEntries =
          item.selectedEwcEntries.filter(
            (_, ewcIndex) =>
              ewcIndex !== slot,
          );

        const nextHazardousState =
          applyHazardousStateFromEwc(
            item,
            nextSelectedEntries,
          );

        return {
          ...item,
          ewcCodes: nextEwcCodes,
          selectedEwcEntries:
            nextSelectedEntries,
          ...nextHazardousState,
        };
      }),
    );
  }

  /*
   * ---------------------------------------------------------
   * POPS
   * ---------------------------------------------------------
   */

  async function searchPops(
    index: number,
    componentIndex: number,
    query: string,
  ) {
    const search = query.trim();

    setActivePopsSearch({
      index,
      componentIndex,
    });

    if (!search) {
      setPopsSearchResults([]);
      return;
    }

    setPopsSearchLoading(true);

    try {
      const results =
        await searchRegistry<RegistryEntry>(
          "pops",
          search,
          8,
        );

      setPopsSearchResults(
        results.slice(0, 8),
      );
    } catch (error) {
      console.error(
        "POPs search failed",
        error,
      );

      setPopsSearchResults([]);
    } finally {
      setPopsSearchLoading(false);
    }
  }

  function selectPops(
    index: number,
    componentIndex: number,
    selected: RegistryEntry,
  ) {
    const name =
      typeof selected.chemicalName ===
      "string"
        ? selected.chemicalName
        : getRegistryLabel(selected);

    updateComponent(
      index,
      "popsComponents",
      componentIndex,
      "code",
      selected.code,
    );

    updateComponent(
      index,
      "popsComponents",
      componentIndex,
      "name",
      name,
    );

    setPopsSearchResults([]);
    setActivePopsSearch(null);
  }

  /*
   * ---------------------------------------------------------
   * HAZARDOUS
   * ---------------------------------------------------------
   */

  function setContainsPops(
    index: number,
    checked: boolean,
  ) {
    updateWasteItem(index, {
      containsPops: checked,
      popsSource: "",
      popsComponents: checked
        ? [createEmptyComponent()]
        : [],
    });
  }

  function setContainsHazardous(
    index: number,
    checked: boolean,
  ) {
    updateWasteItem(index, {
      containsHazardous: checked,
      hazardousManuallySet: checked,
      hazardousSource: checked
        ? ""
        : "",
      hazardousProperties: checked
        ? []
        : [],
      hazardousComponents: checked
        ? [createEmptyComponent()]
        : [],
      showHazardousDetails: checked,
    });
  }

  function updateComponent(
    index: number,
    kind:
      | "popsComponents"
      | "hazardousComponents",
    componentIndex: number,
    field: keyof Component,
    value: string,
  ) {
    updateWasteItems((items) =>
      items.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        return {
          ...item,
          [kind]: item[kind].map(
            (
              component,
              currentIndex,
            ) =>
              currentIndex ===
              componentIndex
                ? {
                    ...component,
                    [field]: value,
                  }
                : component,
          ),
        };
      }),
    );
  }

  function addComponent(
    index: number,
    kind:
      | "popsComponents"
      | "hazardousComponents",
  ) {
    updateWasteItems((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [kind]: [
                ...item[kind],
                createEmptyComponent(),
              ],
            }
          : item,
      ),
    );
  }

  function removeComponent(
    index: number,
    kind:
      | "popsComponents"
      | "hazardousComponents",
    componentIndex: number,
  ) {
    updateWasteItems((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [kind]: item[kind].filter(
                (
                  _,
                  currentIndex,
                ) =>
                  currentIndex !==
                  componentIndex,
              ),
            }
          : item,
      ),
    );
  }

  function toggleHazardousProperty(
    index: number,
    code: string,
  ) {
    updateWasteItems((items) =>
      items.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        return {
          ...item,
          hazardousProperties:
            item.hazardousProperties.includes(
              code,
            )
              ? item.hazardousProperties.filter(
                  (current) =>
                    current !== code,
                )
              : [
                  ...item.hazardousProperties,
                  code,
                ],
        };
      }),
    );
  }

  /*
   * ---------------------------------------------------------
   * DISPOSAL / RECOVERY
   * ---------------------------------------------------------
   */

  async function searchDisposalRecovery(
    index: number,
    drIndex: number,
    query: string,
  ) {
    const search = query.trim();

    setActiveDisposalRecoverySearch({
      index,
      drIndex,
    });

    if (!search) {
      setDisposalRecoverySearchResults(
        [],
      );
      return;
    }

    setDisposalRecoverySearchLoading(
      true,
    );

    try {
      const results =
        await searchRegistry<RegistryEntry>(
          "disposal_recovery",
          search,
          8,
        );

      setDisposalRecoverySearchResults(
        results.slice(0, 8),
      );
    } catch (error) {
      console.error(
        "Disposal/recovery search failed",
        error,
      );

      setDisposalRecoverySearchResults(
        [],
      );
    } finally {
      setDisposalRecoverySearchLoading(
        false,
      );
    }
  }

  function addDisposalRecovery(
    index: number,
  ) {
    const item = wasteItems[index];

    if (!item) {
      return;
    }

    updateWasteItem(index, {
      disposalRecoveryCodes: [
        ...item.disposalRecoveryCodes,
        {
          code: "",
          weightAmount: "",
          weightUnit: "Tonnes",
          isEstimate: false,
        },
      ],
    });
  }

  function updateDisposalRecovery(
    index: number,
    drIndex: number,
    patch: Partial<DisposalRecovery>,
  ) {
    updateWasteItems((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              disposalRecoveryCodes:
                item.disposalRecoveryCodes.map(
                  (
                    disposalRecovery,
                    currentIndex,
                  ) =>
                    currentIndex ===
                    drIndex
                      ? {
                          ...disposalRecovery,
                          ...patch,
                        }
                      : disposalRecovery,
                ),
            }
          : item,
      ),
    );
  }

  function selectDisposalRecovery(
    index: number,
    drIndex: number,
    selected: RegistryEntry,
  ) {
    updateDisposalRecovery(
      index,
      drIndex,
      {
        code: selected.code,
      },
    );

    setDisposalRecoverySearchResults(
      [],
    );

    setActiveDisposalRecoverySearch(
      null,
    );
  }

  function removeDisposalRecovery(
    index: number,
    drIndex: number,
  ) {
    updateWasteItems((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              disposalRecoveryCodes:
                item.disposalRecoveryCodes.filter(
                  (
                    _,
                    currentIndex,
                  ) =>
                    currentIndex !==
                    drIndex,
                ),
            }
          : item,
      ),
    );
  }

  /*
   * ---------------------------------------------------------
   * DERIVED / SORTED DATA
   * ---------------------------------------------------------
   */

  const sortedHazardousProperties =
    useMemo(
      () =>
        [...hazardousProperties].sort(
          (a, b) =>
            getHazardousPropertySortValue(
              a.code,
            ) -
            getHazardousPropertySortValue(
              b.code,
            ),
        ),
      [hazardousProperties],
    );

  /*
   * ---------------------------------------------------------
   * UI
   * ---------------------------------------------------------
   */

  return (
    <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">
          2. Waste items
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Add each waste item included in
          this receipt.
        </p>
      </div>

      <div className="space-y-8">
        {wasteItems.map(
          (item, index) => {
            const ewcIsHazardous =
              getEwcHazardousState(item);

            const itemIsHazardous =
              ewcIsHazardous ||
              item.containsHazardous;

            const classification =
              itemIsHazardous
                ? "Hazardous"
                : "Non-hazardous";

            return (
              <div
                key={index}
                className="rounded-xl border border-slate-200 p-6"
              >
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">
                      Waste item{" "}
                      {index + 1}
                    </h4>

                    <p className="mt-1 text-xs text-slate-500">
                      Add up to 5 EWC codes
                      for this item.
                    </p>
                  </div>

                  {wasteItems.length >
                    1 && (
                    <button
                      type="button"
                      onClick={() =>
                        removeWasteItem(
                          index,
                        )
                      }
                      className="text-sm text-slate-500 hover:text-slate-900"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="space-y-6">
                  {/* EWC + WASTE DESCRIPTION */}

                  <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                    <div>
                      <label className="text-sm font-medium">
                        Waste code (EWC){" "}
                        <span>*</span>
                      </label>

                      <div className="mt-2 space-y-3">
                        {item.ewcCodes.map(
                          (
                            code,
                            ewcIndex,
                          ) => {
                            const results =
                              activeEwcSearch?.index ===
                                index &&
                              activeEwcSearch?.slot ===
                                ewcIndex
                                ? ewcSearchResults
                                : [];

                            return (
                              <div
                                key={
                                  ewcIndex
                                }
                                data-registry-search-root
                                className="relative"
                              >
                                <div className="flex gap-2">
                                  <input
                                    value={
                                      code
                                    }
                                    onChange={(
                                      e,
                                    ) => {
                                      const value =
                                        e
                                          .target
                                          .value;

                                      updateEwc(
                                        index,
                                        ewcIndex,
                                        value,
                                      );

                                      searchEwcCodes(
                                        index,
                                        ewcIndex,
                                        value,
                                      );
                                    }}
                                    onFocus={() => {
                                      searchEwcCodes(
                                        index,
                                        ewcIndex,
                                        code,
                                      );
                                    }}
                                    onBlur={() =>
                                      resolveEwcCode(
                                        index,
                                        ewcIndex,
                                        code,
                                      )
                                    }
                                    placeholder="Search by code or description"
                                    className={inputClass()}
                                  />

                                  {item
                                    .ewcCodes
                                    .length >
                                    1 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeEwcCode(
                                          index,
                                          ewcIndex,
                                        )
                                      }
                                      className="mt-2 px-2 text-sm text-slate-500"
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>

                                {ewcSearchLoading &&
                                  activeEwcSearch?.index ===
                                    index &&
                                  activeEwcSearch?.slot ===
                                    ewcIndex && (
                                  <p className="mt-2 text-xs text-slate-500">
                                    Searching EWC codes…
                                  </p>
                                )}

                                {results.length >
                                  0 && (
                                  <div
                                    data-registry-search-root
                                    className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                                  >
                                    {results.map(
                                      (
                                        ewc,
                                      ) => (
                                        <button
                                          key={
                                            ewc.code
                                          }
                                          type="button"
                                          onClick={() =>
                                            selectEwcCode(
                                              index,
                                              ewc,
                                              ewcIndex,
                                            )
                                          }
                                          className="block w-full border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-slate-50"
                                        >
                                          <div className="text-sm font-medium">
                                            {
                                              ewc.code
                                            }{" "}
                                            —{" "}
                                            {
                                              ewc.description
                                            }
                                          </div>

                                          <div className="mt-1 text-xs text-slate-500">
                                            {ewc.isHazardous
                                              ? "Hazardous"
                                              : "Non-hazardous"}
                                          </div>
                                        </button>
                                      ),
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          },
                        )}
                      </div>

                      {item.ewcCodes
                        .length < 5 && (
                        <button
                          type="button"
                          onClick={() =>
                            addEwcCode(
                              index,
                            )
                          }
                          className="mt-3 text-sm font-medium text-slate-700 hover:text-slate-950"
                        >
                          + Add another EWC
                          code
                        </button>
                      )}
                    </div>

                    <div
                      data-registry-search-root
                      className="relative"
                    >
                      <label className="text-sm font-medium">
                        Waste description{" "}
                        <span>*</span>
                      </label>

                      <input
                        value={
                          item.wasteDescription
                        }
                        onChange={(e) => {
                          const value =
                            e.target.value;

                          updateWasteItem(
                            index,
                            {
                              wasteDescription:
                                value,
                            },
                          );

                          searchEwcByDescription(
                            index,
                            value,
                          );
                        }}
                        onFocus={() => {
                          if (
                            item.wasteDescription.trim()
                          ) {
                            searchEwcByDescription(
                              index,
                              item.wasteDescription,
                            );
                          }
                        }}
                        placeholder="Describe the waste received"
                        className={inputClass()}
                      />

                      {descriptionSearchLoading &&
                        activeDescriptionSearch ===
                          index && (
                        <p className="mt-2 text-xs text-slate-500">
                          Searching matching EWC
                          codes…
                        </p>
                      )}

                      {activeDescriptionSearch ===
                        index &&
                        descriptionSearchResults.length >
                          0 && (
                          <div
                            data-registry-search-root
                            className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                          >
                            {descriptionSearchResults.map(
                              (ewc) => (
                                <button
                                  key={
                                    ewc.code
                                  }
                                  type="button"
                                  onClick={() => {
                                    const firstEmptySlot =
                                      item.ewcCodes.findIndex(
                                        (
                                          currentCode,
                                          slot,
                                        ) =>
                                          !currentCode.trim() ||
                                          !item
                                            .selectedEwcEntries[
                                            slot
                                          ],
                                      );

                                    const slot =
                                      firstEmptySlot >=
                                      0
                                        ? firstEmptySlot
                                        : 0;

                                    selectEwcCode(
                                      index,
                                      ewc,
                                      slot,
                                    );

                                    setDescriptionSearchResults(
                                      [],
                                    );
                                    setActiveDescriptionSearch(
                                      null,
                                    );
                                  }}
                                  className="block w-full border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-slate-50"
                                >
                                  <div className="text-sm font-medium">
                                    {
                                      ewc.code
                                    }{" "}
                                    —{" "}
                                    {
                                      ewc.description
                                    }
                                  </div>

                                  <div className="mt-1 text-xs text-slate-500">
                                    {ewc.isHazardous
                                      ? "Hazardous"
                                      : "Non-hazardous"}
                                  </div>
                                </button>
                              ),
                            )}
                          </div>
                        )}
                    </div>
                  </div>

                  {/* CLASSIFICATION */}

                  {(item.ewcCodes.some(
                    (code) =>
                      code.trim(),
                  ) ||
                    item.containsHazardous) && (
                    <div className="flex flex-wrap gap-3">
                      <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                        <span className="text-slate-500">
                          Hazardous:
                        </span>{" "}
                        <span className="font-medium">
                          {itemIsHazardous
                            ? "Yes"
                            : "No"}
                        </span>
                      </div>

                      <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                        <span className="text-slate-500">
                          Classification:
                        </span>{" "}
                        <span className="font-medium">
                          {classification}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* PHYSICAL / CONTAINER / NUMBER / WEIGHT */}

                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium">
                        Physical form{" "}
                        <span>*</span>
                      </label>

                      <select
                        value={
                          item.physicalForm
                        }
                        onChange={(e) =>
                          updateWasteItem(
                            index,
                            {
                              physicalForm:
                                e.target
                                  .value,
                            },
                          )
                        }
                        className={inputClass()}
                      >
                        <option value="">
                          Select physical form
                        </option>

                        {physicalForms.map(
                          (form) => (
                            <option
                              key={form}
                              value={form}
                            >
                              {form}
                            </option>
                          ),
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">
                        Container type{" "}
                        <span>*</span>
                      </label>

                      <select
                        value={
                          item.typeOfContainers
                        }
                        onChange={(e) =>
                          updateWasteItem(
                            index,
                            {
                              typeOfContainers:
                                e.target
                                  .value,
                            },
                          )
                        }
                        className={inputClass()}
                        disabled={
                          containerTypesLoading
                        }
                      >
                        <option value="">
                          {containerTypesLoading
                            ? "Loading container types…"
                            : "Select container type"}
                        </option>

                        {containerTypes.map(
                          (container) => (
                            <option
                              key={
                                container.code
                              }
                              value={
                                container.code
                              }
                            >
                              {
                                container.code
                              }{" "}
                              —{" "}
                              {getRegistryLabel(
                                container,
                              )}
                            </option>
                          ),
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">
                        Number of containers{" "}
                        <span>*</span>
                      </label>

                      <input
                        type="number"
                        min="0"
                        value={
                          item.numberOfContainers
                        }
                        onChange={(e) =>
                          updateWasteItem(
                            index,
                            {
                              numberOfContainers:
                                e.target
                                  .value,
                            },
                          )
                        }
                        className={inputClass()}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">
                        Weight{" "}
                        <span>*</span>
                      </label>

                      <div className="mt-2 flex gap-2">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={
                            item.weightAmount
                          }
                          onChange={(e) =>
                            updateWasteItem(
                              index,
                              {
                                weightAmount:
                                  e.target
                                    .value,
                              },
                            )
                          }
                          placeholder="Amount"
                          className="w-full rounded-lg border border-slate-300 px-4 py-3"
                        />

                        <select
                          value={
                            item.weightUnit
                          }
                          onChange={(e) =>
                            updateWasteItem(
                              index,
                              {
                                weightUnit:
                                  e.target
                                    .value,
                              },
                            )
                          }
                          className="rounded-lg border border-slate-300 bg-white px-4 py-3"
                        >
                          {weightUnits.map(
                            (unit) => (
                              <option
                                key={unit}
                                value={unit}
                              >
                                {unit}
                              </option>
                            ),
                          )}
                        </select>
                      </div>
                    </div>
                  </div>

                  <label className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={
                        item.isEstimate
                      }
                      onChange={(e) =>
                        updateWasteItem(
                          index,
                          {
                            isEstimate:
                              e.target
                                .checked,
                          },
                        )
                      }
                    />

                    Weight is an estimate
                  </label>

                  {/* POPs */}

                  <div className="border-t border-slate-200 pt-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-medium">
                            Persistent organic
                            pollutants (POPs)
                          </p>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              item.containsPops
                                ? "bg-slate-200 text-slate-800"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {item.containsPops
                              ? "Yes"
                              : "No"}
                          </span>
                        </div>
                      </div>

                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={
                            item.containsPops
                          }
                          onChange={(e) =>
                            setContainsPops(
                              index,
                              e.target
                                .checked,
                            )
                          }
                        />

                        Contains POPs
                      </label>
                    </div>

                    {item.containsPops && (
                      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
                        <label className="text-sm font-medium">
                          Source of components{" "}
                          <span>*</span>
                        </label>

                        <select
                          value={
                            item.popsSource
                          }
                          onChange={(e) =>
                            updateWasteItem(
                              index,
                              {
                                popsSource:
                                  e.target
                                    .value,
                              },
                            )
                          }
                          className={inputClass()}
                        >
                          <option value="">
                            Select source
                          </option>

                          {componentSources.map(
                            ([
                              code,
                              label,
                            ]) => (
                              <option
                                key={code}
                                value={code}
                              >
                                {label}
                              </option>
                            ),
                          )}
                        </select>

                        <div className="mt-5 space-y-3">
                          {item.popsComponents.map(
                            (
                              component,
                              componentIndex,
                            ) => {
                              const results =
                                activePopsSearch?.index ===
                                  index &&
                                activePopsSearch?.componentIndex ===
                                  componentIndex
                                  ? popsSearchResults
                                  : [];

                              return (
                                <div
                                  key={
                                    componentIndex
                                  }
                                  className="rounded-lg border border-slate-200 bg-white p-4"
                                >
                                  <div className="mb-4 flex items-center justify-between">
                                    <p className="text-sm font-medium">
                                      POPs
                                      component{" "}
                                      {componentIndex +
                                        1}
                                    </p>

                                    {item
                                      .popsComponents
                                      .length >
                                      1 && (
                                      <button
                                        type="button"
                                       onClick={() =>
                                          removeComponent(
                                            index,
                                            "popsComponents",
                                            componentIndex,
                                          )
                                        }
                                        className="text-xs text-slate-500"
                                      >
                                        Remove
                                      </button>
                                    )}
                                  </div>

                                  <div className="grid gap-4 md:grid-cols-2">
                                    <div
                                      data-registry-search-root
                                      className="relative"
                                    >
                                      <label className="text-sm font-medium">
                                        POPs code
                                      </label>

                                      <input
                                        value={
                                          component.code
                                        }
                                        onChange={(
                                          e,
                                        ) => {
                                          const value =
                                            e
                                              .target
                                              .value;

                                          updateComponent(
                                            index,
                                            "popsComponents",
                                            componentIndex,
                                            "code",
                                            value,
                                          );

                                          searchPops(
                                            index,
                                            componentIndex,
                                            value,
                                          );
                                        }}
                                        onFocus={() =>
                                          searchPops(
                                            index,
                                            componentIndex,
                                            component.code,
                                          )
                                        }
                                        placeholder="Search POPs code or substance"
                                        className={inputClass()}
                                      />

                                      {popsSearchLoading &&
                                        activePopsSearch?.index ===
                                          index &&
                                        activePopsSearch?.componentIndex ===
                                          componentIndex && (
                                          <p className="mt-2 text-xs text-slate-500">
                                            Searching
                                            POPs…
                                          </p>
                                        )}

                                      {results.length >
                                        0 && (
                                        <div
                                          data-registry-search-root
                                          className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                                        >
                                          {results.map(
                                            (
                                              pop,
                                            ) => (
                                              <button
                                                key={
                                                  pop.code
                                                }
                                                type="button"
                                                onClick={() =>
                                                  selectPops(
                                                    index,
                                                    componentIndex,
                                                    pop,
                                                  )
                                                }
                                                className="block w-full border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-slate-50"
                                              >
                                                <div className="text-sm font-medium">
                                                  {
                                                    pop.code
                                                  }{" "}
                                                  —{" "}
                                                  {getRegistryLabel(
                                                    pop,
                                                  )}
                                                </div>
                                              </button>
                                            ),
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    <div>
                                      <label className="text-sm font-medium">
                                        Chemical
                                        name
                                      </label>

                                      <input
                                        value={
                                          component.name
                                        }
                                        onChange={(
                                          e,
                                        ) =>
                                          updateComponent(
                                            index,
                                            "popsComponents",
                                            componentIndex,
                                            "name",
                                            e.target
                                              .value,
                                          )
                                        }
                                        placeholder="Optional"
                                        className={inputClass()}
                                      />
                                    </div>

                                    <div>
                                      <label className="text-sm font-medium">
                                        Concentration{" "}
                                        {optionalLabel(
                                          "(mg/kg, optional)",
                                        )}
                                      </label>

                                      <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={
                                          component.concentration
                                        }
                                        onChange={(
                                          e,
                                        ) =>
                                          updateComponent(
                                            index,
                                            "popsComponents",
                                            componentIndex,
                                            "concentration",
                                            e.target
                                              .value,
                                          )
                                        }
                                        className={inputClass()}
                                      />
                                    </div>
                                  </div>
                                </div>
                              );
                            },
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            addComponent(
                              index,
                              "popsComponents",
                            )
                          }
                          className="mt-5 rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium hover:bg-white"
                        >
                          + Add another POPs
                          component
                        </button>
                      </div>
                    )}
                  </div>

                  {/* HAZARDOUS */}

                  <div className="border-t border-slate-200 pt-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-medium">
                            Hazardous waste
                          </p>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              itemIsHazardous
                                ? "bg-slate-200 text-slate-800"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {itemIsHazardous
                              ? "Yes"
                              : "No"}
                          </span>
                        </div>

                        {ewcIsHazardous && (
                          <p className="mt-1 text-xs text-slate-500">
                            The selected EWC
                            code is
                            classified as
                            hazardous.
                          </p>
                        )}
                      </div>

                      {!ewcIsHazardous && (
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={
                              item.containsHazardous
                            }
                            onChange={(e) =>
                              setContainsHazardous(
                                index,
                                e.target
                                  .checked,
                              )
                            }
                          />

                          Contains hazardous
                          waste
                        </label>
                      )}

                      {itemIsHazardous && (
                        <button
                          type="button"
                          onClick={() =>
                            updateWasteItem(
                              index,
                              {
                                showHazardousDetails:
                                  !item.showHazardousDetails,
                              },
                            )
                          }
                          className="self-start rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50"
                        >
                          {item.showHazardousDetails
                            ? "Hide hazardous details"
                            : "Add hazardous details"}
                        </button>
                      )}
                    </div>

                    {itemIsHazardous &&
                      item.showHazardousDetails && (
                        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
                          <h5 className="text-sm font-semibold">
                            Hazardous waste
                            information
                          </h5>

                          <p className="mt-1 text-sm text-slate-500">
                            Complete the
                            source,
                            hazardous
                            properties
                            and
                            components
                            where
                            required or
                            available.
                          </p>

                          <label className="mt-5 block text-sm font-medium">
                            Source of
                            components{" "}
                            <span>*</span>
                          </label>

                          <select
                            value={
                              item.hazardousSource
                            }
                            onChange={(e) =>
                              updateWasteItem(
                                index,
                                {
                                  hazardousSource:
                                    e.target
                                      .value,
                                },
                              )
                            }
                            className={inputClass()}
                          >
                            <option value="">
                              Select source
                            </option>

                            {componentSources.map(
                              ([
                                code,
                                label,
                              ]) => (
                                <option
                                  key={code}
                                  value={code}
                                >
                                  {label}
                                </option>
                              ),
                            )}
                          </select>

                          <div className="mt-5">
                            <label className="text-sm font-medium">
                              Hazardous
                              properties
                            </label>

                            <p className="mt-1 text-sm text-slate-500">
                              Select all
                              properties
                              identified
                              for this
                              waste.
                            </p>

                            {hazardousPropertiesLoading ? (
                              <p className="mt-4 text-sm text-slate-500">
                                Loading
                                hazardous
                                properties…
                              </p>
                            ) : (
                              <div className="mt-4 grid gap-3 md:grid-cols-2">
                                {sortedHazardousProperties.map(
                                  (
                                    property,
                                  ) => (
                                    <label
                                      key={
                                        property.code
                                      }
                                      className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 hover:bg-slate-50"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={item.hazardousProperties.includes(
                                          property.code,
                                        )}
                                        onChange={() =>
                                          toggleHazardousProperty(
                                            index,
                                            property.code,
                                          )
                                        }
                                        className="mt-1"
                                      />

                                      <span className="text-sm font-medium">
                                        {
                                          property.code
                                        }{" "}
                                        —{" "}
                                        {getRegistryLabel(
                                          property,
                                        )}
                                      </span>
                                    </label>
                                  ),
                                )}
                              </div>
                            )}
                          </div>

                          <div className="mt-6">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <label className="text-sm font-medium">
                                  Hazardous
                                  components{" "}
                                  {optionalLabel(
                                    "(depending on source)",
                                  )}
                                </label>

                                <p className="mt-1 text-xs text-slate-500">
                                  Component
                                  details
                                  are
                                  collected
                                  according
                                  to the
                                  selected
                                  source.
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  addComponent(
                                    index,
                                    "hazardousComponents",
                                  )
                                }
                                className="self-start rounded-lg border border-slate-300 px-3 py-2 text-sm"
                              >
                                + Add component
                              </button>
                            </div>

                            <div className="mt-4 space-y-3">
                              {item.hazardousComponents.map(
                                (
                                  component,
                                  componentIndex,
                                ) => (
                                  <div
                                    key={
                                      componentIndex
                                    }
                                    className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"
                                  >
                                    <input
                                      value={
                                        component.name
                                      }
                                      onChange={(
                                        e,
                                      ) =>
                                        updateComponent(
                                          index,
                                          "hazardousComponents",
                                          componentIndex,
                                          "name",
                                          e.target
                                            .value,
                                        )
                                      }
                                      placeholder="Component name"
                                      className={inputClass()}
                                    />

                                    <input
                                      type="number"
                                      min="0"
                                      step="any"
                                      value={
                                        component.concentration
                                      }
                                      onChange={(
                                        e,
                                      ) =>
                                        updateComponent(
                                          index,
                                          "hazardousComponents",
                                          componentIndex,
                                          "concentration",
                                          e.target
                                            .value,
                                        )
                                      }
                                      placeholder="Concentration mg/kg"
                                      className={inputClass()}
                                    />

                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeComponent(
                                          index,
                                          "hazardousComponents",
                                          componentIndex,
                                        )
                                      }
                                      className="mt-2 px-2 text-sm text-slate-500"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                  </div>

                  {/* DISPOSAL / RECOVERY */}

                  <div className="border-t border-slate-200 pt-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <label className="text-sm font-medium">
                          Disposal / recovery
                        </label>

                        <p className="mt-1 text-xs text-slate-500">
                          Add one or more D/R
                          codes for this
                          waste item.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          addDisposalRecovery(
                            index,
                          )
                        }
                        className="self-start rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium"
                      >
                        + Add code
                      </button>
                    </div>

                    <div className="mt-4 space-y-3">
                      {item.disposalRecoveryCodes.map(
                        (
                          dr,
                          drIndex,
                        ) => {
                          const results =
                            activeDisposalRecoverySearch?.index ===
                              index &&
                            activeDisposalRecoverySearch?.drIndex ===
                              drIndex
                              ? disposalRecoverySearchResults
                              : [];

                          return (
                            <div
                              key={drIndex}
                              className="rounded-lg border border-slate-200 p-4"
                            >
                              <div className="grid gap-4 md:grid-cols-2">
                                <div
                                  data-registry-search-root
                                  className="relative"
                                >
                                  <label className="text-sm font-medium">
                                    Code
                                  </label>

                                  <input
                                    value={
                                      dr.code
                                    }
                                    onChange={(
                                      e,
                                    ) => {
                                      const value =
                                        e.target.value.toUpperCase();

                                      updateDisposalRecovery(
                                        index,
                                        drIndex,
                                        {
                                          code: value,
                                        },
                                      );

                                      searchDisposalRecovery(
                                        index,
                                        drIndex,
                                        value,
                                      );
                                    }}
                                    onFocus={() =>
                                      searchDisposalRecovery(
                                        index,
                                        drIndex,
                                        dr.code,
                                      )
                                    }
                                    placeholder="Search D/R code or description"
                                    className={inputClass()}
                                  />

                                  {disposalRecoverySearchLoading &&
                                    activeDisposalRecoverySearch?.index ===
                                      index &&
                                    activeDisposalRecoverySearch?.drIndex ===
                                      drIndex && (
                                    <p className="mt-2 text-xs text-slate-500">
                                      Searching
                                      disposal/recovery
                                      codes…
                                    </p>
                                  )}

                                  {results.length >
                                    0 && (
                                    <div
                                      data-registry-search-root
                                      className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                                    >
                                      {results.map(
                                        (
                                          result,
                                        ) => (
                                          <button
                                            key={
                                              result.code
                                            }
                                            type="button"
                                            onClick={() =>
                                              selectDisposalRecovery(
                                                index,
                                                drIndex,
                                                result,
                                              )
                                            }
                                            className="block w-full border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-slate-50"
                                          >
                                            <div className="text-sm font-medium">
                                              {
                                                result.code
                                              }{" "}
                                              —{" "}
                                              {getRegistryLabel(
                                                result,
                                              )}
                                            </div>
                                          </button>
                                        ),
                                      )}
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <label className="text-sm font-medium">
                                    Weight
                                  </label>

                                  <div className="mt-2 flex gap-2">
                                    <input
                                      type="number"
                                      min="0"
                                      step="any"
                                      value={
                                        dr.weightAmount
                                      }
                                      onChange={(
                                        e,
                                      ) =>
                                        updateDisposalRecovery(
                                          index,
                                          drIndex,
                                          {
                                            weightAmount:
                                              e
                                                .target
                                                .value,
                                          },
                                        )
                                      }
                                      className="w-full rounded-lg border border-slate-300 px-4 py-3"
                                    />

                                    <select
                                      value={
                                        dr.weightUnit
                                      }
                                      onChange={(
                                        e,
                                      ) =>
                                        updateDisposalRecovery(
                                          index,
                                          drIndex,
                                          {
                                            weightUnit:
                                              e
                                                .target
                                                .value,
                                          },
                                        )
                                      }
                                      className="rounded-lg border border-slate-300 bg-white px-4 py-3"
                                    >
                                      {weightUnits.map(
                                        (
                                          unit,
                                        ) => (
                                          <option
                                            key={
                                              unit
                                            }
                                            value={
                                              unit
                                            }
                                          >
                                            {
                                              unit
                                            }
                                          </option>
                                        ),
                                      )}
                                    </select>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-3 flex items-center justify-between">
                                <label className="flex items-center gap-2 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={
                                      dr.isEstimate
                                    }
                                    onChange={(
                                      e,
                                    ) =>
                                      updateDisposalRecovery(
                                        index,
                                        drIndex,
                                        {
                                          isEstimate:
                                            e
                                              .target
                                              .checked,
                                        },
                                      )
                                    }
                                  />

                                  Weight is an
                                  estimate
                                </label>

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeDisposalRecovery(
                                      index,
                                      drIndex,
                                    )
                                  }
                                  className="text-sm text-slate-500"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          },
        )}
{/* SHARED HAZARDOUS CONSIGNMENT */}

{hasHazardousWaste && (
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
          <span className="font-normal text-slate-500">
            (if provided)
          </span>
        </label>

        <input
          value={hazardousWasteConsignmentCode ?? ""}
          onChange={(e) =>
            onHazardousWasteConsignmentCodeChange?.(
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
          value={reasonForNoConsignmentCode ?? ""}
          onChange={(e) =>
            onReasonForNoConsignmentCodeChange?.(
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
      </div>

      <button
        type="button"
        onClick={addWasteItem}
        className="mt-6 rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium hover:bg-slate-50"
      >
        + Add another waste item
      </button>
    </section>
  );
}