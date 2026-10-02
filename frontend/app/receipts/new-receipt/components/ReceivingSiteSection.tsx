"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export type SiteProfile = {
  organisation_name: string;
  site_name: string;
  address: {
    full_address: string;
    postcode: string;
  };
  authorisation_number: string;
  api_code: string;
  email_address: string | null;
  phone_number: string | null;
};

type ReceivingSiteSectionProps = {
  onSiteProfileChange?: (
    profile: SiteProfile | null,
  ) => void;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function ReceivingSiteSection({
  onSiteProfileChange,
}: ReceivingSiteSectionProps) {
  const [profile, setProfile] =
    useState<SiteProfile | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [showDetails, setShowDetails] =
    useState(false);

  useEffect(() => {
    async function loadSiteProfile() {
  try {
    setLoading(true);
    setError("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("You are not authenticated.");
    }

    const response = await fetch(
      `${API_BASE_URL}/site-profile`,
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      },
    );

        if (!response.ok) {
          throw new Error(
            "Failed to load receiving site details.",
          );
        }

        const data: SiteProfile =
          await response.json();

        setProfile(data);
        onSiteProfileChange?.(data);
      } catch (err) {
        console.error(err);

        setProfile(null);
        onSiteProfileChange?.(null);

        setError(
          "We couldn't load the receiving site details.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadSiteProfile();
  }, [onSiteProfileChange]);

  if (loading) {
    return (
      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900">
          5. Receiving site
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Loading receiving site details...
        </p>

        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          Loading...
        </div>
      </section>
    );
  }

  if (error || !profile) {
    return (
      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900">
          5. Receiving site
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          The receiving site is taken from your Site Profile.
        </p>

        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error ||
            "Receiving site details are unavailable."}
        </div>

        <a
          href="/site-profile"
          className="mt-4 inline-flex text-sm font-medium text-slate-700 underline underline-offset-2 hover:text-slate-950"
        >
          Go to Site Profile
        </a>
      </section>
    );
  }

  return (
    <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">
          5. Receiving site
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          This receipt will be recorded against your receiving site.
        </p>
      </div>

      <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">
              {profile.site_name}
            </p>

            <p className="mt-1 text-sm text-slate-600">
              {profile.organisation_name}
            </p>

            <p className="mt-1 text-sm text-slate-600">
              {profile.address.full_address}
            </p>

            <p className="text-sm text-slate-600">
              {profile.address.postcode}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowDetails((current) => !current)
            }
            className="shrink-0 text-left text-sm font-medium text-slate-700 hover:text-slate-950 sm:text-right"
          >
            {showDetails
              ? "Hide details"
              : "View details"}
          </button>
        </div>

        {showDetails && (
          <div className="mt-5 border-t border-slate-200 pt-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Organisation
                </p>

                <p className="mt-1 text-sm text-slate-900">
                  {profile.organisation_name}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Site
                </p>

                <p className="mt-1 text-sm text-slate-900">
                  {profile.site_name}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Address
                </p>

                <p className="mt-1 whitespace-pre-line text-sm text-slate-900">
                  {profile.address.full_address}
                </p>

                <p className="text-sm text-slate-900">
                  {profile.address.postcode}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Authorisation number
                </p>

                <p className="mt-1 text-sm text-slate-900">
                  {profile.authorisation_number}
                </p>
              </div>

              {(profile.email_address ||
                profile.phone_number) && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Contact
                  </p>

                  {profile.email_address && (
                    <p className="mt-1 text-sm text-slate-900">
                      {profile.email_address}
                    </p>
                  )}

                  {profile.phone_number && (
                    <p className="text-sm text-slate-900">
                      {profile.phone_number}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-slate-200 pt-5">
              <a
                href="/site-profile"
                className="text-sm font-medium text-slate-700 underline underline-offset-2 hover:text-slate-950"
              >
                Edit Site Profile
              </a>

              <span className="text-xs text-slate-500">
                Changes to the receiving site are made in Site Profile.
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}