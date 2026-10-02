"use client";

import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#0B1730]">
      <div className="mx-auto max-w-4xl px-6 py-12 sm:px-8 sm:py-16">
        <div className="mb-10">
          <Link
            href="/onboarding"
            className="inline-flex items-center text-sm font-medium text-[#1E3768] transition hover:opacity-70"
          >
            ← Back to setup
          </Link>
        </div>

        <header className="mb-12 border-b border-slate-200 pb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-500">
            DTS Works
          </p>

          <h1 className="text-3xl font-semibold tracking-tight text-[#0B1730] sm:text-4xl">
            Privacy Policy
          </h1>

          <div className="mt-4 space-y-1 text-sm text-slate-500">
            <p>Effective date: 28 September 2026</p>
            <p>Last updated: 28 September 2026</p>
          </div>
        </header>

        <div className="space-y-10 text-[15px] leading-7 text-slate-700">
          <section>
            <p>
              This Privacy Policy explains how Roda Protocol Ltd, trading as
              DTS Works (&quot;DTS Works&quot;, &quot;we&quot;, &quot;us&quot;
              or &quot;our&quot;), collects, uses, stores and protects
              personal information when you use DTS Works.
            </p>

            <p className="mt-4">
              We aim to be clear about what information we collect, why we
              need it and how it is used.
            </p>
          </section>

          <section>
            <SectionHeading number="1" title="Who we are" />

            <p>
              DTS Works is a digital waste-tracking and compliance-support
              software service provided by Roda Protocol Ltd.
            </p>

            <p className="mt-4">
              DTS Works provides software to help waste operators manage
              digital waste-tracking workflows, prepare and validate waste
              information and, where supported, submit relevant information
              through digital waste-tracking processes.
            </p>

            <p className="mt-4">
              If you have questions about this Privacy Policy or how we
              handle information, you can contact us using the details below.
            </p>

            <div className="mt-5 rounded-lg border border-slate-200 bg-white p-5">
              <p className="font-medium text-[#0B1730]">
                Roda Protocol Ltd trading as DTS Works
              </p>

              <p className="mt-2">
                Email:Support@dtsworks.com
              </p>

              <p>
                Website: https://www.dtsworks.com
              </p>
            </div>
          </section>

          <section>
            <SectionHeading number="2" title="Information we collect" />

            <p>
              Depending on how you use DTS Works, we may collect and store
              information including:
            </p>

            <BulletList
              items={[
                "your name;",
                "email address;",
                "phone number, where you choose to provide one;",
                "organisation name;",
                "receiving-site name;",
                "receiving-site address and postcode;",
                "authorisation or permit information;",
                "API codes used to identify or connect a receiving site with relevant digital waste-tracking services;",
                "account and authentication information;",
                "information entered into waste receipts and digital waste-tracking records; and",
                "other information necessary to operate and support the DTS Works service.",
              ]}
            />

            <p className="mt-4">
              Waste-tracking information may include information about waste
              movements, waste descriptions, EWC codes, quantities,
              hazardous-waste information, carriers, brokers or dealers,
              receiving sites and other information required for the relevant
              waste-tracking process.
            </p>

            <p className="mt-4">
              Not all information entered into DTS Works will necessarily be
              personal information. Some information relates to organisations,
              sites, waste movements or regulatory records rather than
              identifiable individuals.
            </p>
          </section>

          <section>
            <SectionHeading number="3" title="How we use your information" />

            <p>
              We collect and use information to provide and operate DTS
              Works.
            </p>

            <p className="mt-4">This includes using information to:</p>

            <BulletList
              items={[
                "create and manage user accounts;",
                "identify the organisation and receiving site associated with a DTS Works account;",
                "maintain accurate receiving-site and authorisation records;",
                "create, manage and maintain waste receipts;",
                "associate waste movements with the appropriate receiving site and organisation;",
                "validate information entered into DTS Works;",
                "support digital waste-tracking workflows;",
                "prepare relevant information for submission through supported government or regulatory systems;",
                "submit relevant information to the appropriate government or regulatory system where a supported integration is used;",
                "maintain the security and integrity of DTS Works;",
                "provide support relating to the service;",
                "comply with applicable legal or regulatory requirements; and",
                "maintain appropriate business and service records.",
              ]}
            />

            <p className="mt-4">
              The information associated with a receiving site, including its
              authorisation information and API code, may be used to help
              identify the correct site when processing and submitting
              waste-tracking information.
            </p>
          </section>

          <section>
            <SectionHeading number="4" title="Who we share information with" />

            <p>We do not sell personal information.</p>

            <p className="mt-4">
              We may share or provide access to information where this is
              necessary to operate DTS Works or provide a requested
              waste-tracking service.
            </p>

            <Subheading>Government and regulatory systems</Subheading>

            <p>
              Where DTS Works provides a supported integration with a
              government or regulatory system, relevant information may be
              transmitted to that system as part of the waste-tracking
              process.
            </p>

            <p className="mt-4">
              For example, information may be submitted to the relevant
              Environment Agency digital waste-tracking service where the
              customer uses that functionality.
            </p>

            <Subheading>Service providers</Subheading>

            <p>
              We use third-party service providers that help us operate DTS
              Works, including providers of hosting, database, authentication,
              infrastructure and security services.
            </p>

            <p className="mt-4">
              For example, DTS Works currently uses Supabase for services
              including database and authentication infrastructure.
            </p>

            <p className="mt-4">
              These providers process or store information as necessary to
              provide the services they supply to DTS Works.
            </p>

            <Subheading>Legal or regulatory requirements</Subheading>

            <p>
              We may disclose information where we are required to do so by
              law, regulation, legal process or a lawful request from an
              appropriate authority.
            </p>
          </section>

          <section>
            <SectionHeading number="5" title="How long we keep information" />

            <p>
              We retain information for as long as reasonably necessary for
              the purposes described in this Privacy Policy, including
              providing and operating DTS Works, maintaining appropriate
              business records, resolving disputes, and meeting applicable
              legal, regulatory and contractual requirements.
            </p>

            <p className="mt-4">
              Waste-tracking and waste-related records may be subject to
              specific legal or regulatory retention requirements. Different
              types of waste records may have different retention periods
              depending on the nature of the waste, the record and the role of
              the organisation involved.
            </p>

            <p className="mt-4">
              Where applicable, DTS Works will retain relevant records for the
              period required by the applicable waste-tracking or
              environmental requirements.
            </p>

            <p className="mt-4">
              We periodically review information held by DTS Works and will
              delete or anonymise information when it is no longer required,
              subject to any legal, regulatory or legitimate business
              requirement to retain it.
            </p>
          </section>

          <section>
            <SectionHeading number="6" title="Security" />

            <p>
              We take reasonable technical and organisational measures
              designed to protect information held by DTS Works against
              unauthorised access, loss, misuse, alteration or disclosure.
            </p>

            <p className="mt-4">
              These measures may include appropriate access controls,
              authentication, security protections and controls around the
              systems and services used to operate DTS Works.
            </p>

            <p className="mt-4">
              Access to information is limited according to operational
              requirements.
            </p>

            <p className="mt-4">
              We cannot guarantee that any internet-based service can be
              completely secure or that unauthorised access will never occur.
              However, we take reasonable steps to protect the information we
              hold and to reduce the risks associated with unauthorised
              access, loss or misuse.
            </p>

            <p className="mt-4">
              You are also responsible for keeping your account credentials
              and devices secure and for ensuring that people using your
              organisation&apos;s account are authorised to do so.
            </p>
          </section>

          <section>
            <SectionHeading number="7" title="Data protection" />

            <p>
              We process personal information in accordance with applicable
              data-protection laws.
            </p>

            <p className="mt-4">
              Depending on the nature of the information and the reason it is
              being processed, Roda Protocol Ltd may act as a controller or
              processor of personal information.
            </p>

            <p className="mt-4">
              Where we process personal information on behalf of a customer,
              our processing will be carried out in accordance with the
              applicable arrangements and requirements.
            </p>

            <p className="mt-4">
              We may use appropriate service providers to support the
              operation of DTS Works. Where required, appropriate contractual
              and organisational arrangements will be used in relation to the
              processing of personal information.
            </p>

            <p className="mt-4">
              We may update this section as our understanding of our
              data-protection responsibilities and our processing arrangements
              develops.
            </p>
          </section>

          <section>
            <SectionHeading
              number="8"
              title="Your data protection rights"
            />

            <p>
              Depending on the circumstances and the applicable
              data-protection laws, you may have rights in relation to your
              personal information.
            </p>

            <p className="mt-4">These may include the right to:</p>

            <BulletList
              items={[
                "request access to personal information we hold about you;",
                "ask us to correct inaccurate or incomplete information;",
                "request deletion of personal information where applicable;",
                "request restriction of certain processing;",
                "object to certain processing;",
                "request transfer of personal information where the right to data portability applies; and",
                "withdraw consent where processing is based on consent.",
              ]}
            />

            <p className="mt-4">
              These rights are subject to applicable legal conditions and
              exceptions.
            </p>

            <p className="mt-4">
              If you would like to exercise a data-protection right, you can
              contact us using the contact details provided in this Privacy
              Policy.
            </p>
          </section>

          <section>
            <SectionHeading number="9" title="Cookies and website" />

            <p>
              DTS Works may use cookies and similar technologies that are
              necessary to operate, secure and maintain the website and
              application.
            </p>

            <p className="mt-4">
              We may introduce additional technologies, including analytics or
              other non-essential cookies, as the service develops.
            </p>

            <p className="mt-4">
              Where applicable, we will provide appropriate information and
              obtain any consent required by law before using non-essential
              cookies or similar technologies.
            </p>
          </section>

          <section>
            <SectionHeading number="10" title="Changes to this Privacy Policy" />

            <p>
              We may update this Privacy Policy from time to time to reflect
              changes to DTS Works, the information we collect and use, our
              service providers, applicable law, regulatory requirements or
              our business practices.
            </p>

            <p className="mt-4">
              The current version of this Privacy Policy will be made
              available through the DTS Works website or application.
            </p>

            <p className="mt-4">
              Where appropriate, we will take reasonable steps to communicate
              material changes.
            </p>

            <p className="mt-4">
              The effective date and last updated date at the beginning of
              this Privacy Policy indicate the version currently in effect.
            </p>
          </section>

          <section>
            <SectionHeading number="11" title="Contact" />

            <p>
              If you have questions about this Privacy Policy or how DTS
              Works handles information, please contact:
            </p>

            <div className="mt-5 rounded-lg border border-slate-200 bg-white p-5">
              <p className="font-medium text-[#0B1730]">
                Roda Protocol Ltd trading as DTS Works
              </p>

              <p className="mt-2">
                Email: support@dtsworks.com
              </p>

              <p>
                Website: https://www.dtsworks.com
              </p>
            </div>
          </section>

          <section>
            <SectionHeading number="12" title="Complaints" />

            <p>
              If you have concerns about how DTS Works handles your personal
              information, we encourage you to contact us first so that we can
              try to resolve your concern.
            </p>

            <p className="mt-4">
              You also have the right to complain to the Information
              Commissioner&apos;s Office (ICO), the UK&apos;s independent
              supervisory authority for data protection.
            </p>

            <p className="mt-4">
              Information about contacting the ICO is available through the
              ICO&apos;s website.
            </p>
          </section>
        </div>

        <footer className="mt-16 border-t border-slate-200 pt-8 text-sm text-slate-500">
  <p>Last updated: 28 September 2026</p>

  <div className="mt-6 border-t border-slate-200 pt-6">
    <Link
      href="/onboarding"
      className="inline-flex items-center text-sm font-medium text-slate-600 transition hover:text-slate-900"
    >
      ← Back to setup
    </Link>
  </div>

  <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
    <Link
      href="/terms"
      className="font-medium text-[#1E3768] hover:opacity-70"
    >
      Terms of Service
    </Link>

    <Link
      href="/onboarding"
      className="font-medium text-[#1E3768] hover:opacity-70"
    >
      Back to setup
    </Link>
  </div>
  </footer>
      </div>
    </main>
  );
}

function SectionHeading({
  number,
  title,
}: {
  number: string;
  title: string;
}) {
  return (
    <h2 className="mb-4 text-xl font-semibold tracking-tight text-[#0B1730] sm:text-2xl">
      <span className="mr-2 text-slate-400">{number}.</span>
      {title}
    </h2>
  );
}

function Subheading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 mt-7 text-base font-semibold text-[#0B1730]">
      {children}
    </h3>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 list-disc space-y-2 pl-6">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}