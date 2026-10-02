 
"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase/client";

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] =
    useState(true);

  const [email, setEmail] = useState("Loading...");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email) {
        setEmail(user.email);
      } else {
        setEmail("Not configured yet");
      }
    };

    loadUser();
  }, []);

  const handleSignOut = async () => {
    setSignOutError("");
    setIsSigningOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      setSignOutError(error.message);
      setIsSigningOut(false);
      return;
    }

    window.location.href = "/login";
  };

  return (
    <main className="min-h-screen bg-slate-50 px-5 pb-10 pt-7 md:px-10 md:pb-12 md:pt-8">
      <div className="mx-auto max-w-4xl">
        {/* Main settings form */}
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-white">
          {/* Header */}
          <div className="px-6 py-6 md:px-8 md:py-7">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Settings
            </h1>

            <p className="mt-2 text-slate-600">
              Manage your account and application preferences.
            </p>
          </div>

          {/* Account */}
          <section className="border-t border-slate-200 px-6 py-7 md:px-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Account
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your account details.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Name
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Not configured yet
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700">
                  Email
                </p>

                <p className="mt-1 break-words text-sm text-slate-500">
                  {email}
                </p>
              </div>
            </div>
          </section>

          {/* Preferences */}
          <section className="border-t border-slate-200 px-6 py-7 md:px-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Preferences
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Control how DTS Works behaves for you.
              </p>
            </div>

            <div className="flex items-center justify-between gap-6">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-700">
                  Email notifications
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Receive important notifications by email.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setEmailNotifications(
                    (current) => !current,
                  )
                }
                aria-pressed={emailNotifications}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                  emailNotifications
                    ? "bg-slate-900"
                    : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    emailNotifications
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </section>

          {/* Application */}
          <section className="border-t border-slate-200 px-6 py-7 md:px-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Application
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Information about this DTS Works environment.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-6">
                <span className="text-sm font-medium text-slate-700">
                  Version
                </span>

                <span className="text-sm text-slate-500">
                  V1
                </span>
              </div>

              <div className="flex items-center justify-between gap-6">
                <span className="text-sm font-medium text-slate-700">
                  Environment
                </span>

                <span className="text-sm text-slate-500">
                  Sandbox
                </span>
              </div>
            </div>
          </section>

          {/* Sign out */}
          <section className="border-t border-slate-200 px-6 py-7 md:px-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Sign out
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Sign out of your DTS Works account.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="w-fit rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSigningOut
                  ? "Signing out..."
                  : "Sign out"}
              </button>
            </div>

            {signOutError && (
              <p
                role="alert"
                className="mt-4 rounded-lg border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-600"
              >
                {signOutError}
              </p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
