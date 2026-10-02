"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type SiteProfile = {
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

const API_BASE_URL = "http://127.0.0.1:8000";

export default function SiteProfilePage() {
  const [profile, setProfile] = useState<SiteProfile>({
    organisation_name: "",
    site_name: "",
    address: {
      full_address: "",
      postcode: "",
    },
    authorisation_number: "",
    api_code: "",
    email_address: "",
    phone_number: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

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

        const response = await fetch(`${API_BASE_URL}/site-profile`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load Site Profile.");
        }

        const data: SiteProfile = await response.json();

        setProfile(data);
      } catch (err) {
        console.error(err);
        setError("We couldn't load your Site Profile.");
      } finally {
        setLoading(false);
      }
    }

    loadSiteProfile();
  }, []);

  function updateProfile(
    field: keyof SiteProfile,
    value: string
  ) {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));

    setSaved(false);
  }

  function updateAddress(
    field: "full_address" | "postcode",
    value: string
  ) {
    setProfile((current) => ({
      ...current,
      address: {
        ...current.address,
        [field]: value,
      },
    }));

    setSaved(false);
  }

  async function saveSiteProfile() {
    try {
      setSaving(true);
      setError("");
      setSaved(false);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("You are not authenticated.");
      }

      const response = await fetch(`${API_BASE_URL}/site-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
          errorData?.detail || "Failed to save Site Profile."
        );
      }

      const savedProfile: SiteProfile = await response.json();

      setProfile(savedProfile);
      setSaved(true);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "We couldn't save your Site Profile."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <section className="flex-1">
          <header className="border-b border-slate-200 bg-white px-8 py-6">
            <h1 className="text-2xl font-semibold">
              Site Profile
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Loading your receiving site details...
            </p>
          </header>

          <div className="p-8">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              Loading...
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="flex-1">
        <header className="border-b border-slate-200 bg-white px-8 py-6">
          <h1 className="text-2xl font-semibold">
            Site Profile
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage the receiving site details used by DTS Works.
          </p>
        </header>

        <div className="mx-auto max-w-4xl p-8">
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {saved && (
            <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              Site Profile saved successfully.
            </div>
          )}

          <div className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <div>
                <h2 className="text-lg font-semibold">
                  Organisation
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  The organisation responsible for this receiving site.
                </p>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Organisation name
                  </label>

                  <input
                    type="text"
                    value={profile.organisation_name}
                    onChange={(event) =>
                      updateProfile(
                        "organisation_name",
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Site name
                  </label>

                  <input
                    type="text"
                    value={profile.site_name}
                    onChange={(event) =>
                      updateProfile(
                        "site_name",
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <div>
                <h2 className="text-lg font-semibold">
                  Site address
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  The physical address of the receiving site.
                </p>
              </div>

              <div className="mt-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Full address
                  </label>

                  <textarea
                    value={profile.address.full_address}
                    onChange={(event) =>
                      updateAddress(
                        "full_address",
                        event.target.value
                      )
                    }
                    rows={3}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                  />
                </div>

                <div className="max-w-sm">
                  <label className="block text-sm font-medium text-slate-700">
                    Postcode
                  </label>

                  <input
                    type="text"
                    value={profile.address.postcode}
                    onChange={(event) =>
                      updateAddress(
                        "postcode",
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <div>
                <h2 className="text-lg font-semibold">
                  Authorisation
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Regulatory and DWT identification details for this site.
                </p>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Authorisation number
                  </label>

                  <input
                    type="text"
                    value={profile.authorisation_number}
                    onChange={(event) =>
                      updateProfile(
                        "authorisation_number",
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    API code
                  </label>

                  <input
                    type="text"
                    value={profile.api_code}
                    onChange={(event) =>
                      updateProfile(
                        "api_code",
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <div>
                <h2 className="text-lg font-semibold">
                  Contact details
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Optional contact details for this receiving site.
                </p>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Email address
                  </label>

                  <input
                    type="email"
                    value={profile.email_address ?? ""}
                    onChange={(event) =>
                      updateProfile(
                        "email_address",
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Phone number
                  </label>

                  <input
                    type="tel"
                    value={profile.phone_number ?? ""}
                    onChange={(event) =>
                      updateProfile(
                        "phone_number",
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                  />
                </div>
              </div>
            </section>

            <div className="flex items-center justify-end gap-4">
              {saved && (
                <span className="text-sm text-slate-500">
                  Changes saved
                </span>
              )}

              <button
                type="button"
                onClick={saveSiteProfile}
                disabled={saving}
                className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Site Profile"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}