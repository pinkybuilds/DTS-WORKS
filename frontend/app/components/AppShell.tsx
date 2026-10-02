"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AppNavigation from "./AppNavigation";
import { supabase } from "@/lib/supabase/client";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/onboarding" ||
    pathname === "/terms" ||
    pathname === "/privacy";

  useEffect(() => {
    if (isAuthRoute) {
      setIsCheckingOnboarding(false);
      setIsRedirecting(false);
      return;
    }

    let isActive = true;

    const checkAuthenticationAndOnboarding = async () => {
      setIsCheckingOnboarding(true);
      setIsRedirecting(false);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!isActive) {
        return;
      }

      // A user without a confirmed email is not authenticated
      // for DTS Works, even if Supabase has created the account.
      if (!user?.email_confirmed_at) {
        setIsRedirecting(true);
        router.replace("/login");
        return;
      }

      try {
        const response = await fetch(
          "http://127.0.0.1:8000/site-profile",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${
                (
                  await supabase.auth.getSession()
                ).data.session?.access_token ?? ""
              }`,
            },
          },
        );

        if (!isActive) {
          return;
        }

        if (response.status === 401 || response.status === 403) {
          setIsRedirecting(true);
          router.replace("/login");
          return;
        }

        if (response.status === 404) {
          setIsRedirecting(true);
          router.replace("/onboarding");
          return;
        }

        if (!response.ok) {
          console.error(
            "Unable to verify onboarding status:",
            response.status,
          );

          setIsCheckingOnboarding(false);
          return;
        }

        setIsCheckingOnboarding(false);
      } catch (error) {
        if (!isActive) {
          return;
        }

        console.error(
          "Unable to connect to DTS Works backend:",
          error,
        );

        setIsCheckingOnboarding(false);
      }
    };

    checkAuthenticationAndOnboarding();

    return () => {
      isActive = false;
    };
  }, [pathname, router, isAuthRoute]);

  if (isAuthRoute) {
    return <main className="min-h-screen">{children}</main>;
  }

  if (isCheckingOnboarding || isRedirecting) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">
          Loading DTS Works...
        </p>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen">
      <AppNavigation />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}


