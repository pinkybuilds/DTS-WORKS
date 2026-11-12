"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useOrganisation } from "../../contexts/OrganisationContext";

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

export default function AppNavigation() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const {
    organisations,
    selectedOrganisation,
    loading,
    error,
    selectOrganisation,
    sites,
    selectedSite,
    siteLoading,
    siteError,
    selectSite,
  } = useOrganisation();

  return (
    <>
      <header className="relative z-50 w-full border-b border-slate-300 bg-[#0f172a]">
        <div className="flex h-[76px] items-center justify-between px-5 md:px-8">
          <div className="flex items-center">
            <img
              src="/branding/dts works logo real.png"
              alt="DTS Works"
              className="h-45 w-auto object-contain"
            />
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            aria-label={
              menuOpen ? "Close navigation" : "Open navigation"
            }
            aria-expanded={menuOpen}
            className="rounded-lg p-2 text-white transition hover:bg-white/10"
          >
            <span className="text-2xl leading-none">
              {menuOpen ? "×" : "☰"}
            </span>
          </button>
        </div>
      </header>

      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-40 bg-black/10"
          />

          <nav className="fixed right-0 top-[76px] z-50 w-72 max-w-[85vw] border-l border-b border-slate-200 bg-white p-4 shadow-xl">
            <div className="mb-5 space-y-4 border-b border-slate-200 pb-5">
              <div>
                <label
                  htmlFor="organisation-selector"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Organisation
                </label>

                {loading ? (
                  <p className="text-sm text-slate-500">
                    Loading organisations...
                  </p>
                ) : error ? (
                  <p className="text-sm text-red-600">{error}</p>
                ) : organisations.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No organisations available.
                  </p>
                ) : (
                  <select
                    id="organisation-selector"
                    value={selectedOrganisation?.organisation_id ?? ""}
                    onChange={(event) =>
                      selectOrganisation(event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500"
                  >
                    <option value="" disabled>
                      Select an organisation
                    </option>

                    {organisations.map((organisation) => (
                      <option
                        key={organisation.organisation_id}
                        value={organisation.organisation_id}
                      >
                        {organisation.organisation_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label
                  htmlFor="site-selector"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Site
                </label>

                {siteLoading ? (
                  <p className="text-sm text-slate-500">
                    Loading sites...
                  </p>
                ) : siteError ? (
                  <p className="text-sm text-red-600">{siteError}</p>
                ) : !selectedOrganisation ? (
                  <p className="text-sm text-slate-500">
                    Select an organisation first.
                  </p>
                ) : sites.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No sites found for this organisation.
                  </p>
                ) : (
                  <select
                    id="site-selector"
                    value={selectedSite?.site_id ?? ""}
                    onChange={(event) => selectSite(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500"
                  >
                    <option value="" disabled>
                      Select a site
                    </option>

                    {sites.map((site) => (
                      <option key={site.site_id} value={site.site_id}>
                        {site.site_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

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
                    className={`block rounded-lg px-4 py-3 text-sm transition ${
                      isActive
                        ? "bg-slate-100 font-medium text-slate-900"
                        : "font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </>
      )}
    </>
  );
}