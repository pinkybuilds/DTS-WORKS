"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navigationItems = [
  {
    label: "Dashboard",
    href: "/",
  },
  {
    label: "Receipts",
    href: "/receipts",
  },
  
  {
    label: "Site Profile",
    href: "/site-profile",
  },
  {
    label: "Settings",
    href: "/settings",
  },
];

const getBackNavigation = (pathname: string) => {
  if (pathname === "/receipts/new-receipt") {
    return {
      href: "/receipts",
      label: "Receipts",
    };
  }

  if (pathname === "/receipts") {
    return {
      href: "/",
      label: "Dashboard",
    };
  }

  if (
    pathname === "/compliance" ||
    pathname === "/site-profile" ||
    pathname === "/settings"
  ) {
    return {
      href: "/",
      label: "Dashboard",
    };
  }

  return null;
};

export default function AppNavigation() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const backNavigation = getBackNavigation(pathname);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden min-h-screen w-64 shrink-0 border-r border-slate-200 bg-white md:block">
        

        <nav className="space-y-2 p-6">
          {navigationItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" &&
                pathname.startsWith(`${item.href}/`));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-4 py-3 text-sm ${
                  isActive
                    ? "bg-slate-100 font-medium text-slate-900"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile navigation */}
      <div className="md:hidden">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5">
          <div className="flex flex-col items-start">
            <img
              src="/branding/dts works logo real.png"
              alt="DTS"
              className="h-6 w-auto object-contain"
            />

            <span className="mt-0.5 text-[9px] font-semibold tracking-[0.18em] text-[#173A5E]">
              WORKS
            </span>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            aria-label={
              menuOpen
                ? "Close navigation"
                : "Open navigation"
            }
            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100"
          >
            <span className="text-2xl leading-none">
              {menuOpen ? "×" : "☰"}
            </span>
          </button>
        </header>

        {menuOpen && (
          <nav className="border-b border-slate-200 bg-white px-5 py-4">
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" &&
                    pathname.startsWith(`${item.href}/`));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`block rounded-lg px-4 py-3 text-sm ${
                      isActive
                        ? "bg-slate-100 font-medium text-slate-900"
                        : "font-medium text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </div>

      {/* Contextual back link */}
      {backNavigation && (
        <div className="border-b border-slate-200 bg-white px-6 py-4 md:hidden">
          <Link
            href={backNavigation.href}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            ← {backNavigation.label}
          </Link>
        </div>
      )}
    </>
  );
}