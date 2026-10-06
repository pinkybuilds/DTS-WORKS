"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type OnboardingStep = 1 | 2 | 3 | 4;

type Plan = "starter" | "professional" | "business";

type OnboardingErrorType =
  | "network"
  | "auth"
  | "validation"
  | "server"
  | "unknown";

type OnboardingDraft = {
  step?: number;
  firstName?: string;
  organisationName?: string;
  siteName?: string;
  fullAddress?: string;
  postcode?: string;
  authorisationNumber?: string;
  apiCode?: string;
  emailAddress?: string;
  phoneNumber?: string;
  acceptedLegal?: boolean;
  selectedPlan?: Plan | "";
  onboardingSaved?: boolean;
};

const TERMS_VERSION = "TOS-2026-09-28";
const PRIVACY_POLICY_VERSION = "PRIVACY-2026-09-28";

const ONBOARDING_DRAFT_KEY = "dts-works-onboarding-draft";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

/*
 * This is the backend endpoint we will create in checkout.py.
 *
 * The frontend sends only the DTS Works plan name.
 * The backend remains responsible for mapping the plan
 * to the correct Stripe Price ID.
 */
const STRIPE_CHECKOUT_ENDPOINT = "/stripe/create-checkout-session";

const PLANS: {
  id: Plan;
  name: string;
  price: string;
  description: string;
  sites: string;
}[] = [
  {
    id: "starter",
    name: "Starter",
    price: "£69/month",
    description: "For single-site operations.",
    sites: "1 site",
  },
  {
    id: "professional",
    name: "Professional",
    price: "£99/month",
    description: "For growing operations.",
    sites: "2–3 sites",
  },
  {
    id: "business",
    name: "Business",
    price: "£199/month",
    description: "For larger, high-volume operations.",
    sites: "Large / high-volume operations",
  },
];

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState<OnboardingStep>(1);

  const [firstName, setFirstName] = useState("");
  const [organisationName, setOrganisationName] = useState("");
  const [siteName, setSiteName] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [postcode, setPostcode] = useState("");
  const [authorisationNumber, setAuthorisationNumber] = useState("");
  const [apiCode, setApiCode] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const DEV_PREVIEW = process.env.NODE_ENV !== "production";


  const [acceptedLegal, setAcceptedLegal] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState<Plan | "">("");

  const [onboardingSaved, setOnboardingSaved] = useState(false);

  const [isDraftLoaded, setIsDraftLoaded] = useState(false);

  const [validationError, setValidationError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitErrorType, setSubmitErrorType] =
    useState<OnboardingErrorType | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  /*
   * Restore an existing onboarding draft.
   *
   * We also look for ?plan=starter, ?plan=professional or
   * ?plan=business so the public Pricing page can carry
   * the customer's selected plan into onboarding.
   */
  useEffect(() => {
    const savedDraft = sessionStorage.getItem(ONBOARDING_DRAFT_KEY);

    let planFromUrl: Plan | "" = "";

    try {
      const params = new URLSearchParams(window.location.search);
      const plan = params.get("plan");

      if (
        plan === "starter" ||
        plan === "professional" ||
        plan === "business"
      ) {
        planFromUrl = plan;
      }
    } catch {
      planFromUrl = "";
    }

    if (!savedDraft) {
      if (planFromUrl) {
        setSelectedPlan(planFromUrl);
      }

      setIsDraftLoaded(true);
      return;
    }

    try {
      const draft: OnboardingDraft = JSON.parse(savedDraft);

      if (draft.step && draft.step >= 1 && draft.step <= 4) {
        setStep(draft.step as OnboardingStep);
      }

      setFirstName(draft.firstName ?? "");
      setOrganisationName(draft.organisationName ?? "");
      setSiteName(draft.siteName ?? "");
      setFullAddress(draft.fullAddress ?? "");
      setPostcode(draft.postcode ?? "");
      setAuthorisationNumber(draft.authorisationNumber ?? "");
      setApiCode(draft.apiCode ?? "");
      setEmailAddress(draft.emailAddress ?? "");
      setPhoneNumber(draft.phoneNumber ?? "");
      setAcceptedLegal(draft.acceptedLegal ?? false);

      if (
        draft.selectedPlan === "starter" ||
        draft.selectedPlan === "professional" ||
        draft.selectedPlan === "business"
      ) {
        setSelectedPlan(draft.selectedPlan);
      } else if (planFromUrl) {
        setSelectedPlan(planFromUrl);
      }

      setOnboardingSaved(draft.onboardingSaved ?? false);
    } catch {
      sessionStorage.removeItem(ONBOARDING_DRAFT_KEY);

      if (planFromUrl) {
        setSelectedPlan(planFromUrl);
      }
    } finally {
      setIsDraftLoaded(true);
    }
  }, []);

  /*
   * Persist the onboarding draft so the user can leave and
   * come back without losing their information.
   */
  useEffect(() => {
    if (!isDraftLoaded) {
      return;
    }

    const draft: OnboardingDraft = {
      step,
      firstName,
      organisationName,
      siteName,
      fullAddress,
      postcode,
      authorisationNumber,
      apiCode,
      emailAddress,
      phoneNumber,
      acceptedLegal,
      selectedPlan,
      onboardingSaved,
    };

    sessionStorage.setItem(
      ONBOARDING_DRAFT_KEY,
      JSON.stringify(draft),
    );
  }, [
    isDraftLoaded,
    step,
    firstName,
    organisationName,
    siteName,
    fullAddress,
    postcode,
    authorisationNumber,
    apiCode,
    emailAddress,
    phoneNumber,
    acceptedLegal,
    selectedPlan,
    onboardingSaved,
  ]);

  const clearErrors = () => {
    setValidationError("");
    setSubmitError("");
    setSubmitErrorType(null);
  };

  const goBack = () => {
    clearErrors();

    if (step === 1) {
      return;
    }

    if (step === 2) {
      setStep(1);
      return;
    }

    if (step === 3) {
      setStep(2);
      return;
    }

    setStep(3);
  };

  const goContinue = () => {
    if (DEV_PREVIEW) {
  clearErrors();
  setValidationError("");
  setSubmitError("");
  setSubmitErrorType(null);

  setStep((currentStep) => {
  if (currentStep === 1) return 2;
  if (currentStep === 2) return 3;
  if (currentStep === 3) return 4;
  return currentStep;
});

  return;
}
    clearErrors();

    if (step === 1) {
      const missingFields: string[] = [];

      if (!firstName.trim()) {
        missingFields.push("First name");
      }

      if (!organisationName.trim()) {
        missingFields.push("Organisation name");
      }

      if (missingFields.length > 0) {
        setValidationError(
          `${missingFields.join(", ")} ${
            missingFields.length === 1 ? "is" : "are"
          } required.`,
        );

        return;
      }

      setStep(2);
      return;
    }

    if (step === 2) {
      const missingFields: string[] = [];

      if (!siteName.trim()) {
        missingFields.push("Site name");
      }

      if (!fullAddress.trim()) {
        missingFields.push("Full address");
      }

      if (!postcode.trim()) {
        missingFields.push("Postcode");
      }

      if (missingFields.length > 0) {
        setValidationError(
          `${missingFields.join(", ")} ${
            missingFields.length === 1 ? "is" : "are"
          } required.`,
        );

        return;
      }

      setStep(3);
      return;
    }

    if (step === 3) {
      const missingFields: string[] = [];

      if (!authorisationNumber.trim()) {
        missingFields.push("Authorisation number");
      }

      if (!apiCode.trim()) {
        missingFields.push("API code");
      }

      if (missingFields.length > 0) {
        setValidationError(
          `${missingFields.join(", ")} ${
            missingFields.length === 1 ? "is" : "are"
          } required.`,
        );

        return;
      }

      if (!acceptedLegal) {
        setValidationError(
          "You must agree to the DTS Works Terms of Service and acknowledge the Privacy Policy before continuing.",
        );

        return;
      }

      /*
       * Step 4 is the payment stage.
       *
       * The organisation/site/profile/legal information is saved
       * before Stripe is opened.
       */
      if (onboardingSaved) {
        setStep(4);
        return;
      }

      handleSaveOnboarding();
    }
  };

  /*
   * Save organisation, receiving site, authorisation,
   * contact and legal acceptance before payment.
   *
   * This deliberately does NOT activate a subscription.
   */
  const handleSaveOnboarding = async () => {
    clearErrors();

    const missingFields: string[] = [];

    if (!firstName.trim()) {
      missingFields.push("First name");
    }

    if (!organisationName.trim()) {
      missingFields.push("Organisation name");
    }

    if (!siteName.trim()) {
      missingFields.push("Site name");
    }

    if (!fullAddress.trim()) {
      missingFields.push("Full address");
    }

    if (!postcode.trim()) {
      missingFields.push("Postcode");
    }

    if (!authorisationNumber.trim()) {
      missingFields.push("Authorisation number");
    }

    if (!apiCode.trim()) {
      missingFields.push("API code");
    }

    if (missingFields.length > 0) {
      setValidationError(
        `${missingFields.join(", ")} ${
          missingFields.length === 1 ? "is" : "are"
        } required.`,
      );

      return;
    }

    if (!acceptedLegal) {
      setValidationError(
        "You must agree to the DTS Works Terms of Service and acknowledge the Privacy Policy before continuing.",
      );

      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error(
          "Unable to retrieve Supabase session:",
          error,
        );

        setSubmitErrorType("auth");
        setSubmitError(
          "Your session has expired. Please sign in again.",
        );

        return;
      }

      const session = data.session;

      if (!session?.access_token) {
        setSubmitErrorType("auth");
        setSubmitError(
          "Your session has expired. Please sign in again.",
        );

        return;
      }

      let response: Response;

      try {
        response = await fetch(
          `${API_BASE_URL}/onboarding`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              full_name: firstName.trim(),
              organisation_name: organisationName.trim(),
              site_name: siteName.trim(),
              full_address: fullAddress.trim(),
              postcode: postcode.trim(),
              authorisation_number: authorisationNumber.trim(),
              api_code: apiCode.trim(),
              email_address: emailAddress.trim() || null,
              phone_number: phoneNumber.trim() || null,
              terms_version: TERMS_VERSION,
              privacy_policy_version: PRIVACY_POLICY_VERSION,
            }),
          },
        );
      } catch (error) {
        console.error(
          "Onboarding request failed:",
          error,
        );

        setSubmitErrorType("network");
        setSubmitError(
          "We couldn't connect to DTS Works. Please check your connection and try again. Your setup information has not been lost.",
        );

        return;
      }

      let result: {
        detail?: string | Array<{ msg?: string }>;
      } = {};

      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        setSubmitErrorType("auth");
        setSubmitError(
          "Your session has expired. Please sign in again.",
        );

        return;
      }

      if (
        response.status === 400 ||
        response.status === 422
      ) {
        setSubmitErrorType("validation");

        const detail = result?.detail;

        if (typeof detail === "string") {
          setSubmitError(detail);
        } else if (
          Array.isArray(detail) &&
          detail.length > 0
        ) {
          setSubmitError(
            detail[0]?.msg ||
              "Check the information you entered and try again.",
          );
        } else {
          setSubmitError(
            "Check the information you entered and try again.",
          );
        }

        return;
      }

      if (!response.ok) {
        console.error(
          "Onboarding server error:",
          response.status,
          result,
        );

        setSubmitErrorType("server");
        setSubmitError(
          "Something went wrong while saving your setup. Please try again.",
        );

        return;
      }

      /*
       * The organisation/site/profile/legal information now exists
       * in DTS Works, so the user can safely proceed to payment.
       */
      setOnboardingSaved(true);
      setStep(4);
    } catch (error) {
      console.error(
        "Unexpected onboarding error:",
        error,
      );

      setSubmitErrorType("unknown");
      setSubmitError(
        "Something unexpected happened. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /*
   * Start Stripe Checkout.
   *
   * IMPORTANT:
   * The backend endpoint is authoritative.
   * The frontend sends only the DTS Works plan name.
   *
   * The backend will:
   * - authenticate the user
   * - resolve the organisation
   * - map the plan to its Stripe Price ID
   * - create/reuse the Stripe customer
   * - create the Checkout Session
   * - return the Checkout URL
   *
   * It must NOT activate the subscription.
   * The webhook will do that later.
   */
  const handleContinueToPayment = async () => {
    clearErrors();

    if (!selectedPlan) {
      setValidationError(
        "Please choose a plan before continuing to payment.",
      );

      return;
    }

    if (!onboardingSaved) {
      setValidationError(
        "Please complete your setup details before continuing to payment.",
      );

      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error(
          "Unable to retrieve Supabase session:",
          error,
        );

        setSubmitErrorType("auth");
        setSubmitError(
          "Your session has expired. Please sign in again.",
        );

        return;
      }

      const session = data.session;

      if (!session?.access_token) {
        setSubmitErrorType("auth");
        setSubmitError(
          "Your session has expired. Please sign in again.",
        );

        return;
      }

      let response: Response;

      try {
        response = await fetch(
          `${API_BASE_URL}${STRIPE_CHECKOUT_ENDPOINT}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              plan: selectedPlan,
            }),
          },
        );
      } catch (error) {
        console.error(
          "Stripe Checkout request failed:",
          error,
        );

        setSubmitErrorType("network");
        setSubmitError(
          "We couldn't connect to DTS Works. Please check your connection and try again.",
        );

        return;
      }

      let result: {
        detail?: string | Array<{ msg?: string }>;
        checkout_url?: string;
        url?: string;
      } = {};

      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        setSubmitErrorType("auth");
        setSubmitError(
          "Your session has expired. Please sign in again.",
        );

        return;
      }

      if (
        response.status === 400 ||
        response.status === 422
      ) {
        setSubmitErrorType("validation");

        const detail = result?.detail;

        if (typeof detail === "string") {
          setSubmitError(detail);
        } else if (
          Array.isArray(detail) &&
          detail.length > 0
        ) {
          setSubmitError(
            detail[0]?.msg ||
              "Check your plan selection and try again.",
          );
        } else {
          setSubmitError(
            "Check your plan selection and try again.",
          );
        }

        return;
      }

      if (!response.ok) {
        console.error(
          "Stripe Checkout server error:",
          response.status,
          result,
        );

        setSubmitErrorType("server");
        setSubmitError(
          "Something went wrong while preparing payment. Please try again.",
        );

        return;
      }

      const checkoutUrl =
        result.checkout_url || result.url;

      if (!checkoutUrl) {
        console.error(
          "Stripe Checkout response did not contain a checkout URL:",
          result,
        );

        setSubmitErrorType("server");
        setSubmitError(
          "We couldn't start payment. Please try again.",
        );

        return;
      }

      /*
       * Do not remove the onboarding draft yet.
       *
       * If the customer leaves Stripe without completing payment,
       * we want their onboarding information and selected plan
       * to remain available when they return.
       */
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error(
        "Unexpected Stripe Checkout error:",
        error,
      );

      setSubmitErrorType("unknown");
      setSubmitError(
        "Something unexpected happened while preparing payment. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepLabels = [
    {
      number: 1,
      label: "Organisation",
    },
    {
      number: 2,
      label: "Receiving site",
    },
    {
      number: 3,
      label: "Authorisation",
    },
    {
      number: 4,
      label: "Plan & payment",
    },
  ];

  const selectedPlanDetails =
    PLANS.find((plan) => plan.id === selectedPlan);

  return (
    <main className="min-h-screen bg-[#0B1730] text-white">
      <header className="px-6 py-6 sm:px-10 sm:py-8">
        <Link
          href="/onboarding"
          aria-label="DTS Works home"
          className="inline-flex items-center"
        >
          <Image
            src="/branding/dts works logo real.png"
            alt="DTS Works"
            width={135}
            height={45}
            priority
            className="h-auto w-[105px] sm:w-[120px]"
          />
        </Link>
      </header>

      <section className="px-6 pb-16 pt-6 sm:px-8 sm:pt-10">
        <div className="mx-auto w-full max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Set up your workspace
            </h1>

            <p className="mt-3 text-sm text-slate-300 sm:text-base">
              A few details and you&apos;ll be ready to get started
              with DTS Works.
            </p>
          </div>

          <div className="mb-10 overflow-x-auto pb-2">
            <div className="flex min-w-[560px] items-center justify-center">
              {stepLabels.map((item, index) => {
                const isActive = step === item.number;
                const isComplete = step > item.number;

                return (
                  <div
                    key={item.number}
                    className="flex items-center"
                  >
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition ${
                          isActive
                            ? "border-white bg-white text-[#142A52]"
                            : isComplete
                              ? "border-[#1E3768] bg-[#1E3768] text-white"
                              : "border-slate-500/60 text-slate-400"
                        }`}
                      >
                        {isComplete ? "✓" : item.number}
                      </div>

                      <span
                        className={`mt-2 whitespace-nowrap text-xs sm:text-sm ${
                          isActive
                            ? "font-medium text-white"
                            : "text-slate-400"
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>

                    {index < stepLabels.length - 1 && (
                      <div
                        className={`mx-3 mb-6 h-px w-8 sm:w-14 ${
                          step > item.number
                            ? "bg-[#1E3768]"
                            : "bg-slate-600/50"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mx-auto w-full max-w-xl">
  {step === 1 && (
    <div>
      <div className="mb-7">
        <h2 className="text-2xl font-semibold">
          Tell us about your organisation
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-300">
          This is the business or organisation that will use DTS Works.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label
            htmlFor="first-name"
            className="mb-2 block text-sm font-medium text-slate-200"
          >
            First name
          </label>

          <input
            id="first-name"
            type="text"
            required
            value={firstName}
            onChange={(event) => {
              setFirstName(event.target.value);
              setValidationError("");
            }}
            className="w-full rounded-lg border border-slate-500/50 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1E3768] focus:ring-2 focus:ring-[#1E3768]/40"
            placeholder="Your first name"
          />
        </div>

        <div>
          <label
            htmlFor="organisation-name"
            className="mb-2 block text-sm font-medium text-slate-200"
          >
            Organisation name
          </label>

          <input
            id="organisation-name"
            type="text"
            required
            value={organisationName}
            onChange={(event) => {
              setOrganisationName(event.target.value);
              setValidationError("");
            }}
            className="w-full rounded-lg border border-slate-500/50 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1E3768] focus:ring-2 focus:ring-[#1E3768]/40"
            placeholder="e.g. GreenCycle Recycling Ltd"
          />

          <p className="mt-2 text-xs leading-5 text-slate-400">
            Enter the legal or trading name of the
            business responsible for your DTS Works
            workspace.
          </p>
        </div>
      </div>
    </div>
  )}

  {step === 2 && (
    <div>
      <div className="mb-7">
        <h2 className="text-2xl font-semibold">
          Tell us about your receiving site
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-300">
          This is the physical facility where waste is received.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label
            htmlFor="site-name"
            className="mb-2 block text-sm font-medium text-slate-200"
          >
            Receiving site name
          </label>

          <input
            id="site-name"
            type="text"
            required
            value={siteName}
            onChange={(event) => {
              setSiteName(event.target.value);
              setValidationError("");
            }}
            className="w-full rounded-lg border border-slate-500/50 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1E3768] focus:ring-2 focus:ring-[#1E3768]/40"
            placeholder="e.g. GreenCycle Birmingham Facility"
          />

          <p className="mt-2 text-xs leading-5 text-slate-400">
            Give the facility a name that helps you
            recognise it within DTS Works.
          </p>
        </div>

        <div>
          <label
            htmlFor="full-address"
            className="mb-2 block text-sm font-medium text-slate-200"
          >
            Full address
          </label>

          <textarea
            id="full-address"
            required
            rows={3}
            value={fullAddress}
            onChange={(event) => {
              setFullAddress(event.target.value);
              setValidationError("");
            }}
            className="w-full resize-none rounded-lg border border-slate-500/50 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1E3768] focus:ring-2 focus:ring-[#1E3768]/40"
            placeholder="Enter the full receiving-site address"
          />
        </div>

        <div>
          <label
            htmlFor="postcode"
            className="mb-2 block text-sm font-medium text-slate-200"
          >
            Postcode
          </label>

          <input
            id="postcode"
            type="text"
            required
            value={postcode}
            onChange={(event) => {
              setPostcode(event.target.value);
              setValidationError("");
            }}
            className="w-full rounded-lg border border-slate-500/50 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1E3768] focus:ring-2 focus:ring-[#1E3768]/40"
            placeholder="e.g. W12 7ZL"
          />
        </div>

        <div className="rounded-lg border border-slate-500/30 bg-white/5 px-4 py-4">
          <p className="text-sm font-medium text-white">
            Managing multiple sites?
          </p>

          <p className="mt-1 text-sm leading-6 text-slate-300">
            Additional receiving sites can be added from your DTS Works
            workspace, depending on your plan.
          </p>
        </div>
      </div>
    </div>
  )}

  {step === 3 && (
    <div>
      <div className="mb-7">
        <h2 className="text-2xl font-semibold">
          Authorisation &amp; contact
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-300">
          Add the regulatory and contact details DTS Works
          will use for your receiving-site records.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label
            htmlFor="authorisation-number"
            className="mb-2 block text-sm font-medium text-slate-200"
          >
            Authorisation number
          </label>

          <input
            id="authorisation-number"
            type="text"
            required
            value={authorisationNumber}
            onChange={(event) => {
              setAuthorisationNumber(event.target.value);
              setValidationError("");
            }}
            className="w-full rounded-lg border border-slate-500/50 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1E3768] focus:ring-2 focus:ring-[#1E3768]/40"
            placeholder="Enter your authorisation number"
          />
        </div>

        <div>
          <label
            htmlFor="api-code"
            className="mb-2 block text-sm font-medium text-slate-200"
          >
            API code
          </label>

          <input
            id="api-code"
            type="text"
            required
            value={apiCode}
            onChange={(event) => {
              setApiCode(event.target.value);
              setValidationError("");
            }}
            className="w-full rounded-lg border border-slate-500/50 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1E3768] focus:ring-2 focus:ring-[#1E3768]/40"
            placeholder="Enter your API code"
          />
        </div>

        <div>
          <label
            htmlFor="email-address"
            className="mb-2 block text-sm font-medium text-slate-200"
          >
            Email address
          </label>

          <input
            id="email-address"
            type="email"
            value={emailAddress}
            onChange={(event) =>
              setEmailAddress(event.target.value)
            }
            className="w-full rounded-lg border border-slate-500/50 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1E3768] focus:ring-2 focus:ring-[#1E3768]/40"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="phone-number"
            className="mb-2 block text-sm font-medium text-slate-200"
          >
            Phone number{" "}
            <span className="font-normal text-slate-400">
              (optional)
            </span>
          </label>

          <input
            id="phone-number"
            type="tel"
            value={phoneNumber}
            onChange={(event) =>
              setPhoneNumber(event.target.value)
            }
            className="w-full rounded-lg border border-slate-500/50 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1E3768] focus:ring-2 focus:ring-[#1E3768]/40"
            placeholder="Phone number"
          />
        </div>

        <div className="pt-3">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-white">
              Review and accept
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-300">
              Before we save your workspace details,
              please review and accept the following.
            </p>
          </div>

          <label
            htmlFor="legal-acceptance"
            className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-500/40 bg-white/5 px-4 py-4 transition hover:bg-white/[0.07]"
          >
            <input
              id="legal-acceptance"
              type="checkbox"
              checked={acceptedLegal}
              onChange={(event) => {
                setAcceptedLegal(event.target.checked);
                setValidationError("");
              }}
              className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-400 text-[#1E3768] focus:ring-2 focus:ring-[#1E3768]/50"
            />

            <span className="text-sm leading-6 text-slate-200">
              I agree to the{" "}
              <Link
                href="/terms"
                className="font-medium text-white underline underline-offset-2 hover:text-slate-200"
              >
                DTS Works Terms of Service
              </Link>{" "}
              and acknowledge the{" "}
              <Link
                href="/privacy"
                className="font-medium text-white underline underline-offset-2 hover:text-slate-200"
              >
                Privacy Policy
              </Link>
              .
            </span>
          </label>

          {!acceptedLegal && (
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Please accept the Terms of Service and
              acknowledge the Privacy Policy to continue.
            </p>
          )}
        </div>
      </div>
    </div>
  )}

  {step === 4 && (
    <div>
      <div className="mb-7">
        <h2 className="text-2xl font-semibold">
          Choose your DTS Works plan
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-300">
          Your workspace details are saved. Choose the
          plan that fits your operation to continue to
          secure payment.
        </p>
      </div>

      <div className="space-y-4">
        {PLANS.map((plan) => {
          const isSelected = selectedPlan === plan.id;

          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => {
                setSelectedPlan(plan.id);
                setValidationError("");
                setSubmitError("");
                setSubmitErrorType(null);
              }}
              className={`w-full rounded-xl border p-5 text-left transition ${
                isSelected
                  ? "border-white bg-white text-[#142A52] shadow-lg"
                  : "border-slate-500/50 bg-white/5 text-white hover:border-slate-300/70 hover:bg-white/[0.08]"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    {plan.name}
                  </h3>

                  <p
                    className={`mt-1 text-sm ${
                      isSelected
                        ? "text-slate-600"
                        : "text-slate-300"
                    }`}
                  >
                    {plan.description}
                  </p>
                </div>

                <div
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                    isSelected
                      ? "bg-[#142A52] text-white"
                      : "border border-slate-400/40 text-slate-200"
                  }`}
                >
                  {plan.sites}
                </div>
              </div>

              <div className="mt-5 flex items-end justify-between gap-4">
                <p className="text-xl font-semibold">
                  {plan.price}
                </p>

                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                    isSelected
                      ? "border-[#142A52] bg-[#142A52]"
                      : "border-slate-400"
                  }`}
                >
                  {isSelected && (
                    <span className="text-xs text-white">
                      ✓
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg border border-slate-500/30 bg-white/5 px-4 py-4">
        <p className="text-sm font-medium text-white">
          Your setup is almost complete.
        </p>

        <p className="mt-1 text-sm leading-6 text-slate-300">
          Your organisation, receiving site and setup
          details have been saved. Payment is the final
          step before your DTS Works workspace is
          activated.
        </p>
      </div>

      {selectedPlanDetails && (
        <div className="mt-4 rounded-lg border border-[#1E3768] bg-[#1E3768]/30 px-4 py-4">
          <p className="text-sm font-medium text-white">
            Selected plan
          </p>

          <div className="mt-1 flex items-center justify-between gap-4">
            <p className="text-sm text-slate-200">
              {selectedPlanDetails.name}
            </p>

            <p className="text-sm font-semibold text-white">
              {selectedPlanDetails.price}
            </p>
          </div>
        </div>
      )}

      <p className="mt-5 text-xs leading-5 text-slate-400">
        You&apos;ll be securely redirected to Stripe to
        complete payment. DTS Works will only activate
        your subscription after Stripe confirms the
        payment.
      </p>
    </div>
  )}

  {(validationError || submitError) && (
    <div
      role="alert"
      className="mt-6 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
    >
      {validationError ? (
        validationError
      ) : (
        <>
          <p className="font-semibold text-red-100">
            {submitErrorType === "network" &&
              "We couldn't connect to DTS Works"}

            {submitErrorType === "auth" &&
              "Your session needs attention"}

            {submitErrorType === "validation" &&
              "Check your information"}

            {submitErrorType === "server" &&
              "Something went wrong"}

            {submitErrorType === "unknown" &&
              "Something unexpected happened"}
          </p>

          <p className="mt-1">
            {submitError}
          </p>
        </>
      )}
    </div>
  )}

  <div className="mt-10 flex items-center justify-between gap-4">
    <button
      type="button"
      onClick={goBack}
      disabled={step === 1 || isSubmitting}
      className="rounded-lg border border-slate-500/50 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/40 disabled:cursor-not-allowed disabled:opacity-30"
    >
      Back
    </button>

    {step < 3 ? (
      <button
        type="button"
        onClick={goContinue}
        disabled={isSubmitting}
        className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#142A52] transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-white/70 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Continue
      </button>
    ) : step === 3 ? (
      <button
        type="button"
        onClick={goContinue}
       disabled={isSubmitting || (!DEV_PREVIEW && !acceptedLegal)}
        className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#142A52] transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-white/70 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting
          ? "Saving setup…"
          : "Continue to plan"}
      </button>
    ) : (
      <button
        type="button"
        onClick={handleContinueToPayment}
        disabled={isSubmitting || !selectedPlan}
        className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#142A52] transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-white/70 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting
          ? "Preparing payment…"
          : "Continue to payment"}
      </button>
    )}
  </div>

  {step === 3 && (
    <p className="mt-3 text-center text-xs text-slate-400">
      Your organisation and receiving-site information
      will be saved before you continue to payment.
    </p>
  )}

    {step === 4 && (
    <p className="mt-3 text-center text-xs text-slate-400">
      Secure payment is provided by Stripe. Your DTS Works
      subscription will be confirmed after payment is
      verified.
    </p>
  )}
        </div>
      </div>
    </section>
  </main>
);
}
