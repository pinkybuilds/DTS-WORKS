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

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/onboarding" ||
    pathname === "/terms" ||
    pathname === "/privacy";

  useEffect(() => {
    if (isAuthRoute) {
      setIsCheckingAuth(false);
      setIsRedirecting(false);
      return;
    }

    let isActive = true;

    const checkAuthentication = async () => {
      setIsCheckingAuth(true);
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

      setIsCheckingAuth(false);
    };

    checkAuthentication();

    return () => {
      isActive = false;
    };
  }, [pathname, router, isAuthRoute]);

  if (isAuthRoute) {
    return <main className="min-h-screen">{children}</main>;
  }

  if (isCheckingAuth || isRedirecting) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">
          Loading DTS Works...
        </p>
      </main>
    );
  }

  return (
    <div className="min-h-screen">
      <AppNavigation />
      <main className="min-w-0">{children}</main>
    </div>
  );
}