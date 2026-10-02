import Link from "next/link";

function SectionHeading({
  number,
  title,
}: {
  number: string;
  title: string;
}) {
  return (
    <h2 className="mt-10 text-xl font-semibold tracking-tight text-[#0B1730]">
      {number}. {title}
    </h2>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 list-disc space-y-2 pl-6 text-[15px] leading-7 text-slate-700">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

      export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#0B1730]">
      <div className="mx-auto max-w-4xl px-6 py-12 sm:px-8 lg:py-16">
        <div className="mb-10">
          <Link
            href="/onboarding"
            className="inline-flex items-center text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            ← Back to setup
          </Link>

          <div className="mt-8">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1E3768]">
              Legal
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#0B1730] sm:text-4xl">
              DTS Works — Terms of Service
            </h1>

            <div className="mt-4 space-y-1 text-sm text-slate-500">
              <p>Effective date: 28 September 2026</p>
              <p>Last updated: 28 September 2026</p>
            </div>
          </div>
        </div>

            

        <article className="rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-10 sm:py-10">
          <p className="text-[15px] leading-7 text-slate-700">
            These Terms of Service (“Terms”) govern your use of DTS Works, a
            digital waste tracking and compliance-support software service
            provided by Roda Protocol Ltd, trading as DTS Works (“DTS Works”,
            “we”, “us” or “our”).
          </p>

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            By creating an account, accessing or using DTS Works, you agree to
            these Terms. If you do not agree to these Terms, you should not use
            the service.
          </p>

          <SectionHeading number="1" title="About DTS Works" />

          <p className="mt-4 text-[15px] leading-7 text-slate-700">
            DTS Works provides software designed to help waste operators manage
            digital waste-tracking workflows and help customers prepare,
            validate and, where supported, submit information through digital
            waste-tracking processes.
          </p>

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            DTS Works is intended to support operators in carrying out their
            own regulatory and operational responsibilities.
          </p>

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            DTS Works does not replace the customer’s own legal, regulatory,
            operational or professional responsibilities.
          </p>

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            DTS Works does not provide legal, environmental consultancy,
            waste-management or other professional advice.
          </p>

          <SectionHeading number="2" title="Customer responsibility" />

          <p className="mt-4 text-[15px] leading-7 text-slate-700">
            You are responsible for ensuring that information entered into DTS
            Works is accurate, complete and up to date.
          </p>

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            This includes, where applicable:
          </p>

          <BulletList
            items={[
              "waste descriptions;",
              "European Waste Catalogue (EWC) codes;",
              "waste weights and quantities;",
              "physical characteristics of waste;",
              "hazardous-waste information;",
              "hazardous properties;",
              "POPs information;",
              "disposal or recovery information;",
              "carrier information;",
              "broker or dealer information;",
              "receiving-site information; and",
              "any other information required for the relevant waste movement.",
            ]}
          />

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            You are responsible for ensuring that the waste activity being
            recorded is lawful and that your organisation holds any permits,
            registrations, authorisations or other permissions required for its
            activities.
          </p>

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            DTS Works may identify missing, inconsistent or potentially
            problematic information based on the rules, data and validation
            logic available within the service.
          </p>

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            A successful validation or submission does not constitute a legal
            determination that the underlying waste activity or information is
            compliant.
          </p>

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            You remain responsible for reviewing the information and taking
            appropriate action where the service identifies an issue.
          </p>

          <SectionHeading
            number="3"
            title="Validation and compliance support"
          />

          <p className="mt-4 text-[15px] leading-7 text-slate-700">
            DTS Works is designed to help identify issues before or during the
            digital waste-tracking process.
          </p>

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            Validation results, warnings, reviews, evidence requests or other
            system outcomes are provided as software-generated compliance
            support.
          </p>

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            They should not be interpreted as legal advice, professional advice
            or a guarantee that a waste movement complies with every applicable
            legal or regulatory requirement.
          </p>

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            The rules, data and validation logic used by DTS Works may not
            reflect every circumstance, exemption, interpretation or regulatory
            development applicable to a customer’s activities.
          </p>

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            You remain responsible for reviewing the information provided by
            the service and taking appropriate action where necessary.
          </p>

          <SectionHeading
            number="4"
            title="Government and third-party systems"
          />

          <p className="mt-4 text-[15px] leading-7 text-slate-700">
            Where DTS Works connects to or communicates with a government
            system, API or other third-party service, DTS Works relies on the
            availability and functionality of that external service.
          </p>

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            We do not control third-party systems and cannot guarantee their
            continuous availability, response times, acceptance criteria or
            future functionality.
          </p>

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            A rejection, warning, delay, outage or other response from a
            third-party system may affect the availability or completion of a
            waste-tracking workflow.
          </p>

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            Where appropriate, DTS Works will display or communicate
            information received from the relevant external system.
          </p>

          <SectionHeading number="5" title="Your account" />

          <p className="mt-4 text-[15px] leading-7 text-slate-700">
            You are responsible for:
          </p>

          <BulletList
            items={[
              "providing accurate account information;",
              "maintaining the security of your login credentials;",
              "ensuring that only authorised persons access your account;",
              "notifying us if you believe your account has been accessed without authorisation; and",
              "ensuring that users acting on behalf of your organisation comply with these Terms.",
            ]}
          />

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            You must not knowingly provide access to unauthorised persons or
            use another organisation’s account without permission.
          </p>

          <SectionHeading number="6" title="Acceptable use" />

          <p className="mt-4 text-[15px] leading-7 text-slate-700">
            You must use DTS Works lawfully and only for its intended purpose.
          </p>

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            You must not:
          </p>

          <BulletList
            items={[
              "misuse or interfere with the service;",
              "attempt to gain unauthorised access to the service or another user’s account;",
              "introduce malicious software or code;",
              "attempt to circumvent security or validation controls;",
              "reverse engineer or unlawfully reproduce the software, except where applicable law expressly permits this;",
              "use the service to carry out unlawful activity; or",
              "knowingly submit false or misleading information.",
            ]}
          />

          <SectionHeading number="7" title="Service availability and changes" />

          <p className="mt-4 text-[15px] leading-7 text-slate-700">
            We aim to keep DTS Works available and functioning reliably, but we
            do not guarantee uninterrupted or error-free availability.
          </p>

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            The service may occasionally be unavailable because of:
          </p>

          <BulletList
            items={[
              "maintenance;",
              "software updates;",
              "security measures;",
              "infrastructure failures;",
              "third-party service or API failures;",
              "network or connectivity problems; or",
              "circumstances outside our reasonable control.",
            ]}
          />

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            We may update, improve or modify DTS Works from time to time,
            including its functionality, interface, validation rules and
            supporting data.
          </p>

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            Where a change materially affects the service, we will take
            reasonable steps to communicate the change where appropriate.
          </p>

          <SectionHeading number="8" title="Intellectual property" />

          <p className="mt-4 text-[15px] leading-7 text-slate-700">
            DTS Works and its underlying software, code, interface, branding,
            documentation, designs, validation logic and other materials are
            owned by or licensed to Roda Protocol Ltd unless otherwise stated.
          </p>

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            Your organisation retains ownership of information and content that
            you submit to DTS Works.
          </p>

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            Except for the rights necessary to provide, secure, maintain and
            operate the service, we do not claim ownership of customer content.
          </p>

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            You receive a limited right to use DTS Works for your organisation’s
            legitimate business purposes in accordance with these Terms.
          </p>

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            You must not copy, sell, distribute, sublicense or commercially
            exploit DTS Works or its underlying materials except where we have
            expressly agreed otherwise in writing or applicable law permits it.
          </p>

          <SectionHeading
            number="9"
            title="Customer data and data protection"
          />

          <p className="mt-4 text-[15px] leading-7 text-slate-700">
            You retain ownership of the information and content that you submit
            to DTS Works.
          </p>

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            DTS Works will process personal data in accordance with applicable
            data-protection law and our{" "}
            <Link
              href="/privacy"
              className="font-medium text-[#1E3768] underline underline-offset-2 hover:text-[#0B1730]"
            >
              Privacy Policy
            </Link>
            .
          </p>

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            Depending on the nature of the processing and the services provided,
            Roda Protocol Ltd may act as a controller or processor of personal
            data.
          </p>

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            Where Roda Protocol Ltd acts as a processor on behalf of a customer,
            the processing will be governed by the applicable data-processing
            terms required by law.
          </p>

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            We may use appropriate third-party service providers to provide
            hosting, infrastructure, authentication, security and other
            services necessary to operate DTS Works. Where required by
            applicable data-protection law, appropriate contractual arrangements
            and safeguards will apply to such processing.
          </p>

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            Nothing in these Terms removes or reduces either party’s
            responsibilities under applicable data-protection law.
          </p>

          <SectionHeading number="10" title="Security" />

          <p className="mt-4 text-[15px] leading-7 text-slate-700">
            We will take reasonable technical and organisational measures
            appropriate to the nature of the service and the risks involved to
            protect information held within DTS Works against unauthorised
            access, loss, alteration or disclosure.
          </p>

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            You are responsible for maintaining appropriate security practices
            on your own systems and for protecting your account credentials and
            devices.
          </p>

          <SectionHeading number="11" title="Fees and payment" />

          <p className="mt-4 text-[15px] leading-7 text-slate-700">
            Where DTS Works is provided on a paid basis, applicable prices,
            billing arrangements and payment terms will be communicated to you
            before or during the relevant subscription or purchase.
          </p>

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            You are responsible for paying applicable fees in accordance with
            the agreed payment terms.
          </p>

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            We may suspend access to paid services where fees remain overdue,
            subject to applicable law and any agreed contractual notice
            requirements.
          </p>

          <SectionHeading number="12" title="Suspension and termination" />

          <p className="mt-4 text-[15px] leading-7 text-slate-700">
            We may suspend or restrict access to DTS Works where reasonably
            necessary to:
          </p>

          <BulletList
            items={[
              "protect the security or integrity of the service;",
              "investigate suspected misuse;",
              "address unlawful activity;",
              "comply with legal or regulatory requirements;",
              "address serious breaches of these Terms; or",
              "prevent harm to DTS Works, our customers or third parties.",
            ]}
          />

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            Where reasonably practicable, we will provide notice and an
            opportunity to resolve the relevant issue before suspension.
          </p>

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            Either party may terminate a subscription or service arrangement in
            accordance with the applicable commercial terms.
          </p>

          <SectionHeading number="13" title="Responsibility and liability" />

          <p className="mt-4 text-[15px] leading-7 text-slate-700">
            We will provide DTS Works with reasonable care and skill.
          </p>

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            We do not guarantee that DTS Works will identify every possible
            regulatory, operational or data-quality issue, or that use of DTS
            Works will by itself make a customer’s activities legally compliant.
          </p>

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            To the extent permitted by law, we are not responsible for losses
            arising from inaccurate, incomplete or misleading information
            supplied by the customer, or from the customer’s failure to comply
            with its own legal, regulatory or operational responsibilities.
          </p>

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            We are also not responsible for failures caused by third-party
            systems, government APIs, telecommunications networks, hosting or
            infrastructure providers, or circumstances outside our reasonable
            control.
          </p>

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            Nothing in these Terms excludes or limits liability where doing so
            would be unlawful.
          </p>

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            Any liability limitations applicable to a particular paid service
            may be set out in the applicable commercial agreement.
          </p>

          <SectionHeading
            number="14"
            title="Events outside our reasonable control"
          />

          <p className="mt-4 text-[15px] leading-7 text-slate-700">
            We are not responsible for delay or failure caused by circumstances
            reasonably outside our control, including significant
            infrastructure failures, cyber incidents affecting third-party
            infrastructure, government-system outages, telecommunications
            failures, natural disasters, or other events of a similar nature.
          </p>

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            We will take reasonable steps to restore affected services where
            possible.
          </p>

          <SectionHeading number="15" title="Changes to these Terms" />

          <p className="mt-4 text-[15px] leading-7 text-slate-700">
            We may update these Terms from time to time to reflect changes to
            DTS Works, applicable law, regulatory requirements or our business.
          </p>

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            The current version will be made available through the DTS Works
            website or application.
          </p>

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            Where changes materially affect your rights or obligations, we will
            take reasonable steps to notify you.
          </p>

          <SectionHeading number="16" title="Governing law" />

          <p className="mt-4 text-[15px] leading-7 text-slate-700">
            These Terms are governed by the laws of England and Wales.
          </p>

          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            The courts of England and Wales will have jurisdiction over disputes
            arising from these Terms, subject to any mandatory legal rights or
            requirements that apply.
          </p>

          <SectionHeading number="17" title="Contact" />

                    <p className="mt-4 text-[15px] leading-7 text-slate-700">
            If you have questions about these Terms, DTS Works or your use of
            the service, please contact:
          </p>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-[15px] leading-7 text-slate-700">
            <p className="font-semibold text-[#0B1730]">
              Roda Protocol Ltd trading as DTS Works
            </p>
            <p className="mt-2">Email: support@dtsworks.com</p>
            <p>Website: https://www.dtsworks.com</p>
          </div>

          <SectionHeading number="18" title="Acceptance" />

          <p className="mt-4 text-[15px] leading-7 text-slate-700">
            By creating an account, accessing or using DTS Works, you
            acknowledge that you have had an opportunity to read these Terms and
            agree to be bound by them.
          </p>

          <div className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-500">
            Last updated: 28 September 2026
          </div>

          <div className="mt-6 border-t border-slate-200 pt-6">
            <Link
              href="/onboarding"
              className="inline-flex items-center text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              ← Back to setup
            </Link>
          </div>
        </article>

        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link
            href="/privacy"
            className="font-medium text-[#1E3768] hover:underline"
          >
            Privacy Policy
          </Link>

          <Link
            href="/onboarding"
            className="font-medium text-[#1E3768] hover:underline"
          >
            Back to setup
          </Link>
        </div>
      </div>
    </main>
  );
}