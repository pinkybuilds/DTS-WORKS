"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useOrganisation } from "@/contexts/OrganisationContext";

type ReceiptData = {
  waste_items?: {
    ewc_codes?: string[];
    waste_description?: string;
  }[];
};

type Movement = {
  id: string;
  date_time_received: string | null;
  waste_tracking_id: string | null;
  status: string | null;
  defra_status: string | null;
  receipt_data: ReceiptData | null;
};

export default function Home() {
  const [recentReceipts, setRecentReceipts] = useState<Movement[]>([]);
  const [loadingReceipts, setLoadingReceipts] = useState(true);

  const {
    selectedOrganisation,
    loading,
    sites,
    selectedSite,
    siteLoading,
    siteError,
  } = useOrganisation();

  useEffect(() => {
    let active = true;

    const loadRecentReceipts = async () => {
      if (loading || siteLoading) {
        setLoadingReceipts(true);
        return;
      }

      if (!selectedOrganisation || !selectedSite) {
        setRecentReceipts([]);
        setLoadingReceipts(false);
        return;
      }

      setLoadingReceipts(true);

      const { data, error } = await supabase
        .from("movements")
        .select(`
          id,
          date_time_received,
          waste_tracking_id,
          status,
          defra_status,
          receipt_data
        `)
        .eq("site_id", selectedSite.site_id)
        .order("date_time_received", { ascending: false })
        .limit(3);

      if (!active) {
        return;
      }

      if (error) {
        console.error("Failed to load recent receipts:", error);
        setRecentReceipts([]);
      } else {
        setRecentReceipts(data ?? []);
      }

      setLoadingReceipts(false);
    };

    void loadRecentReceipts();

    return () => {
      active = false;
    };
  }, [
    loading,
    siteLoading,
    selectedOrganisation?.organisation_id,
    selectedSite?.site_id,
  ]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="w-full">
        <div className="px-6 pt-7 md:px-10 md:pt-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            Dashboard
          </h1>
        </div>

        <div className="px-6 pb-10 pt-6 md:px-10 md:pb-12 md:pt-7">
          <div className="mb-8">
            <h2 className="text-3xl font-semibold tracking-tight">
              Welcome back
            </h2>

            <p className="mt-2 max-w-xl text-slate-600">
              Manage your waste movements and keep every receipt
              compliance-ready.
            </p>
          </div>

          <div className="mb-10">
            <Link
              href="/receipts/new-receipt"
              className="inline-block rounded-xl bg-[#0f172a] px-6 py-4 text-left text-white transition hover:bg-slate-800"
            >
              <div className="text-sm font-semibold">
                + New waste receipt
              </div>

              <div className="mt-1 text-sm text-slate-300">
                Record incoming waste
              </div>
            </Link>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold">
                Recent receipts
              </h3>

              <Link
                href="/receipts"
                className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
              >
                View all receipts →
              </Link>
            </div>

            {loading || siteLoading || loadingReceipts ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                <p className="text-sm text-slate-500">
                  Loading recent receipts...
                </p>
              </div>
            ) : siteError ? (
              <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
                <p className="text-sm text-red-600">{siteError}</p>
              </div>
            ) : !selectedOrganisation ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                <p className="text-sm font-medium text-slate-700">
                  Select an organisation
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Open the navigation menu to choose an organisation.
                </p>
              </div>
            ) : sites.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                <p className="text-sm font-medium text-slate-700">
                  No sites available
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  This organisation does not have any sites yet.
                </p>
              </div>
            ) : !selectedSite ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                <p className="text-sm font-medium text-slate-700">
                  Select a site
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Open the navigation menu and choose a site to view its receipts.
                </p>
              </div>
            ) : recentReceipts.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                <p className="text-sm font-medium text-slate-700">
                  No receipts yet
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Your recorded waste receipts will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentReceipts.map((receipt) => {
                  const wasteItem =
                    receipt.receipt_data?.waste_items?.[0];

                  const wasteDescription =
                    wasteItem?.waste_description || "Waste receipt";

                  const ewcCode =
                    wasteItem?.ewc_codes?.[0] || "—";

                  const displayId =
                    receipt.waste_tracking_id || receipt.id;

                  const status =
                    receipt.defra_status === "ACCEPTED"
                      ? "Accepted"
                      : receipt.defra_status === "REJECTED"
                        ? "Rejected"
                        : receipt.status || "—";

                  const statusClass =
                    receipt.defra_status === "ACCEPTED"
                      ? "bg-green-50 text-green-700"
                      : receipt.defra_status === "REJECTED"
                        ? "bg-red-50 text-red-700"
                        : "bg-slate-100 text-slate-700";

                  return (
                    <Link
                      key={receipt.id}
                      href={`/receipts/${receipt.id}`}
                      className="block rounded-2xl border border-slate-800 bg-white px-5 py-4 transition hover:bg-slate-50 hover:shadow-sm md:px-6 md:py-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-3">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {wasteDescription}
                            </p>

                            <span
                              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}
                            >
                              {status}
                            </span>
                          </div>

                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                            <span>EWC: {ewcCode}</span>

                            <span className="text-slate-300">
                              •
                            </span>

                            <span>
                              {receipt.date_time_received
                                ? new Date(
                                    receipt.date_time_received,
                                  ).toLocaleDateString("en-GB")
                                : "—"}
                            </span>
                          </div>

                          <p className="mt-1 truncate text-xs text-slate-400">
                            {displayId}
                          </p>
                        </div>

                        <span
                          aria-hidden="true"
                          className="shrink-0 text-lg text-slate-500"
                        >
                          →
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}