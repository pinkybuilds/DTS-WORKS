export type ComplianceIssue = {
  code: string;
  message: string;
  severity: "ERROR" | "WARNING";
};

export type ComplianceCheckResult = {
  status: "PASS" | "WARNING" | "ERROR";
  issues: ComplianceIssue[];
};

type WasteItem = {
  ewcCode: string;
  wasteDescription: string;
  physicalForm: string;
  numberOfContainers: string;
  typeOfContainers: string;
  weightAmount: string;
  weightUnit: string;
  isEstimate: boolean;
  containsPops: boolean;
  containsHazardous: boolean;
  hazardousSource: string;
  hazardousProperties: string[];
  popsComponents: {
    code: string;
    chemicalName: string;
    concentration: string;
  }[];
  disposalRecoveryCode: string;
};

type ReceiptFormData = {
  wasteItems: WasteItem[];

  carrier: {
    registrationNumber: string;
    organisationName: string;
    vehicleRegistration: string;
    meansOfTransport: string;
  };

  receiver: {
    siteName: string;
    authorisationNumber: string;
  };

  receipt: {
    fullAddress: string;
    postcode: string;
  };
};

export function runMvpComplianceCheck(
  data: ReceiptFormData
): ComplianceCheckResult {
  const issues: ComplianceIssue[] = [];

  if (data.wasteItems.length === 0) {
    issues.push({
      code: "WASTE_ITEMS_REQUIRED",
      message: "At least one waste item is required.",
      severity: "ERROR",
    });
  }

  data.wasteItems.forEach((item, index) => {
    const itemNumber = index + 1;

    if (!item.ewcCode.trim()) {
      issues.push({
        code: "EWC_CODE_REQUIRED",
        message: `Waste item ${itemNumber}: EWC code is required.`,
        severity: "ERROR",
      });
    } else if (!/^\d{6}$/.test(item.ewcCode.trim())) {
      issues.push({
        code: "EWC_CODE_INVALID",
        message: `Waste item ${itemNumber}: EWC code must contain 6 digits.`,
        severity: "ERROR",
      });
    }

    if (!item.wasteDescription.trim()) {
      issues.push({
        code: "WASTE_DESCRIPTION_REQUIRED",
        message: `Waste item ${itemNumber}: waste description is required.`,
        severity: "ERROR",
      });
    }

    if (!item.physicalForm) {
      issues.push({
        code: "PHYSICAL_FORM_REQUIRED",
        message: `Waste item ${itemNumber}: physical form is required.`,
        severity: "ERROR",
      });
    }

    if (!item.numberOfContainers.trim()) {
      issues.push({
        code: "NUMBER_OF_CONTAINERS_REQUIRED",
        message: `Waste item ${itemNumber}: number of containers is required.`,
        severity: "ERROR",
      });
    } else {
      const numberOfContainers = Number(item.numberOfContainers);

      if (
        !Number.isInteger(numberOfContainers) ||
        numberOfContainers < 0
      ) {
        issues.push({
          code: "NUMBER_OF_CONTAINERS_INVALID",
          message: `Waste item ${itemNumber}: number of containers must be a whole number of 0 or more.`,
          severity: "ERROR",
        });
      }
    }

    if (!item.typeOfContainers.trim()) {
      issues.push({
        code: "CONTAINER_TYPE_REQUIRED",
        message: `Waste item ${itemNumber}: container type is required.`,
        severity: "ERROR",
      });
    }

    if (!item.weightAmount.trim()) {
      issues.push({
        code: "WEIGHT_REQUIRED",
        message: `Waste item ${itemNumber}: weight is required.`,
        severity: "ERROR",
      });
    } else {
      const weight = Number(item.weightAmount);

      if (!Number.isFinite(weight) || weight <= 0) {
        issues.push({
          code: "WEIGHT_INVALID",
          message: `Waste item ${itemNumber}: weight must be greater than 0.`,
          severity: "ERROR",
        });
      }
    }

    if (!item.weightUnit) {
      issues.push({
        code: "WEIGHT_UNIT_REQUIRED",
        message: `Waste item ${itemNumber}: weight unit is required.`,
        severity: "ERROR",
      });
    }

    if (item.containsHazardous) {
      if (!item.hazardousSource) {
        issues.push({
          code: "HAZARDOUS_SOURCE_REQUIRED",
          message: `Waste item ${itemNumber}: source of hazardous information is required.`,
          severity: "ERROR",
        });
      }

      if (item.hazardousProperties.length === 0) {
        issues.push({
          code: "HAZARDOUS_PROPERTIES_REQUIRED",
          message: `Waste item ${itemNumber}: at least one hazardous property must be selected.`,
          severity: "ERROR",
        });
      }
    }

    if (item.containsPops) {
      if (item.popsComponents.length === 0) {
        issues.push({
          code: "POPS_COMPONENTS_REQUIRED",
          message: `Waste item ${itemNumber}: POPs information requires at least one component.`,
          severity: "ERROR",
        });
      } else {
        item.popsComponents.forEach((component, componentIndex) => {
          if (!component.code.trim()) {
            issues.push({
              code: "POPS_CODE_REQUIRED",
              message: `Waste item ${itemNumber}, POPs component ${
                componentIndex + 1
              }: POPs code is required.`,
              severity: "ERROR",
            });
          }
        });
      }
    }
  });

  if (!data.carrier.organisationName.trim()) {
    issues.push({
      code: "CARRIER_ORGANISATION_REQUIRED",
      message: "Carrier organisation name is required.",
      severity: "ERROR",
    });
  }

  if (!data.carrier.meansOfTransport) {
    issues.push({
      code: "MEANS_OF_TRANSPORT_REQUIRED",
      message: "Means of transport is required.",
      severity: "ERROR",
    });
  }

  if (
    data.carrier.meansOfTransport === "Road" &&
    !data.carrier.vehicleRegistration.trim()
  ) {
    issues.push({
      code: "VEHICLE_REGISTRATION_REQUIRED",
      message:
        "Vehicle registration is required when the means of transport is Road.",
      severity: "ERROR",
    });
  }

  if (!data.receiver.siteName.trim()) {
    issues.push({
      code: "RECEIVER_SITE_REQUIRED",
      message: "Waste receiver site name is required.",
      severity: "ERROR",
    });
  }

  if (!data.receiver.authorisationNumber.trim()) {
    issues.push({
      code: "AUTHORISATION_NUMBER_REQUIRED",
      message: "Site authorisation number is required.",
      severity: "ERROR",
    });
  }

  if (!data.receipt.fullAddress.trim()) {
    issues.push({
      code: "RECEIPT_ADDRESS_REQUIRED",
      message: "Receipt address is required.",
      severity: "ERROR",
    });
  }

  if (!data.receipt.postcode.trim()) {
    issues.push({
      code: "RECEIPT_POSTCODE_REQUIRED",
      message: "Receipt postcode is required.",
      severity: "ERROR",
    });
  }

  if (issues.some((issue) => issue.severity === "ERROR")) {
    return {
      status: "ERROR",
      issues,
    };
  }

  return {
    status: "PASS",
    issues: [],
  };
}