"use client"
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";

import { supabase } from "@/lib/supabase/client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

console.log("API:", API_BASE_URL);
console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setErrorMessage("");
    setIsSigningIn(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setIsSigningIn(false);
      return;
    }

    const accessToken = data.session?.access_token;

    if (!accessToken) {
      setErrorMessage(
        "Your session could not be established. Please try again.",
      );
      setIsSigningIn(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/site-profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        // Account setup is complete.
        window.location.href = "/";
        return;
      }

      let detail = "";

      try {
        const errorData = await response.json();
        detail = errorData?.detail || "";
      } catch {
        // Ignore invalid or non-JSON error responses.
      }

      if (response.status === 404) {
        setErrorMessage(
          detail ||
            "Your account is signed in, but we could not find your workspace.",
        );
        setIsSigningIn(false);
        return;
      }

      setErrorMessage(
        detail || "We could not check your account setup. Please try again.",
      );
      setIsSigningIn(false);
    } catch {
      setErrorMessage(
        "We could not connect to DTS Works. Please try again.",
      );
      setIsSigningIn(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0B1730] text-white">
      <header className="px-6 py-6 sm:px-10 sm:py-8">
        <Link
          href="/"
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

      <section className="flex min-h-[calc(100vh-150px)] items-center justify-center px-6 pb-16 pt-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Welcome back 👋
            </h1>

            <p className="mt-3 text-sm text-slate-300 sm:text-base">
              Sign in to continue with DTS Works.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Email address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border border-slate-500/50 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1E3768] focus:ring-2 focus:ring-[#1E3768]/40"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-lg border border-slate-500/50 bg-white px-4 py-3 pr-12 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1E3768] focus:ring-2 focus:ring-[#1E3768]/40"
                  placeholder="Enter your password"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 transition hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#1E3768]/40"
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                      aria-hidden="true"
                    >
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                      aria-hidden="true"
                    >
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                      <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c6.5 0 10 8 10 8a18.5 18.5 0 0 1-3.1 4.4" />
                      <path d="M6.1 6.1C3.5 8.1 2 12 2 12s3.5 8 10 8c1.8 0 3.4-.5 4.8-1.2" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {errorMessage && (
              <p
                role="alert"
                className="rounded-lg border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
              >
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isSigningIn}
              className="w-full rounded-lg bg-white px-4 py-3.5 text-sm font-semibold text-[#142A52] transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-white/70 focus:ring-offset-2 focus:ring-offset-[#0B1730] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSigningIn ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-300">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-white underline underline-offset-4 transition hover:text-slate-200"
            >
              Create one
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}