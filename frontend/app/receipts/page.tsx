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

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const {
    selectedOrganisation,
    loading: organisationLoading,
    sites,
    selectedSite,
    siteLoading,
    siteError,
  } = useOrganisation();

  useEffect(() => {
    let active = true;

    const loadReceipts = async () => {
      if (organisationLoading || siteLoading) {
        setLoading(true);
        return;
      }

      if (!selectedOrganisation || !selectedSite) {
        setReceipts([]);
        setError("");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      const { data, error: queryError } = await supabase
        .from("movements")
        .select(
          `
            id,
            date_time_received,
            waste_tracking_id,
            status,
            defra_status,
            receipt_data
          `,
        )
        .eq("site_id", selectedSite.site_id)
        .order("date_time_received", { ascending: false });

      if (!active) {
        return;
      }

      if (queryError) {
        console.error("Failed to load receipts:", queryError);
        setReceipts([]);
        setError("We couldn't load your receipts.");
      } else {
        setReceipts(data ?? []);
      }

      setLoading(false);
    };

    void loadReceipts();

    return () => {
      active = false;
    };
  }, [
    organisationLoading,
    siteLoading,
    selectedOrganisation?.organisation_id,
    selectedSite?.site_id,
  ]);

  const formatDate = (date: string | null) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusLabel = (receipt: Movement) => {
    if (receipt.defra_status === "ACCEPTED") {
      return "Accepted";
    }

    if (receipt.defra_status === "REJECTED") {
      return "Rejected";
    }

    if (receipt.status === "SUBMITTED") {
      return "Submitted";
    }

    return receipt.status || "—";
  };

  const getStatusClasses = (receipt: Movement) => {
    if (receipt.defra_status === "ACCEPTED") {
      return "bg-green-50 text-green-700";
    }

    if (receipt.defra_status === "REJECTED") {
      return "bg-red-50 text-red-700";
    }

    return "bg-slate-100 text-slate-700";
  };

  const selectionMessage = !selectedOrganisation
    ? "Select an organisation from the navigation menu to view its receipts."
    : sites.length === 0
      ? "This organisation does not have any sites yet."
      : "Select a site from the navigation menu to view its receipts.";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="w-full">
        <div className="px-5 pb-10 pt-7 md:px-10 md:pb-12 md:pt-8">
          <div className="mb-6">
            <Link
              href="/"
              className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              ← Dashboard
            </Link>
          </div>

          <div className="mb-9">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">
                  Waste receipts
                </h1>

                <p className="mt-2 max-w-2xl text-slate-600">
                  View and manage waste movements recorded through DTS Works.
                </p>
              </div>

              <Link
                href="/receipts/new-receipt"
                className="inline-flex w-fit items-center justify-center rounded-xl bg-[#0f172a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                + New waste receipt
              </Link>
            </div>
          </div>

          {organisationLoading || siteLoading || loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-sm text-slate-500">
                Loading receipts...
              </p>
            </div>
          ) : siteError ? (
            <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
              <p className="text-sm font-medium text-red-700">
                {siteError}
              </p>
            </div>
          ) : !selectedOrganisation || !selectedSite ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-sm font-medium text-slate-700">
                {selectionMessage}
              </p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-sm font-medium text-red-700">
                {error}
              </p>
            </div>
          ) : receipts.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-sm font-medium text-slate-700">
                No receipts yet
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Recorded waste receipts will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {receipts.map((receipt) => {
                const firstWasteItem =
                  receipt.receipt_data?.waste_items?.[0];

                const wasteDescription =
                  firstWasteItem?.waste_description || "—";

                const ewc =
                  firstWasteItem?.ewc_codes?.[0] || "—";

                const receiptId =
                  receipt.waste_tracking_id || receipt.id;

                return (
                  <Link
                    key={receipt.id}
                    href={`/receipts/${receipt.id}`}
                    className="group block rounded-2xl border border-slate-800 bg-white px-5 py-4 transition hover:bg-slate-50 hover:shadow-sm md:px-6 md:py-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {wasteDescription}
                          </p>

                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                              receipt,
                            )}`}
                          >
                            {getStatusLabel(receipt)}
                          </span>
                        </div>

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span>EWC: {ewc}</span>

                          <span className="text-slate-300">
                            •
                          </span>

                          <span>
                            {formatDate(receipt.date_time_received)}
                          </span>
                        </div>

                        <p className="mt-1 truncate text-xs text-slate-400">
                          {receiptId}
                        </p>
                      </div>

                      <span
                        aria-hidden="true"
                        className="shrink-0 text-lg text-slate-500 transition-transform group-hover:translate-x-0.5"
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
      </section>
    </main>
  );
}