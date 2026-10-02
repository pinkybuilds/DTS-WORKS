
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

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

  useEffect(() => {
    const loadReceipts = async () => {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
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
        .order("date_time_received", { ascending: false });

      if (error) {
        console.error("Failed to load receipts:", error);
        setError("We couldn't load your receipts.");
        setLoading(false);
        return;
      }

      setReceipts(data ?? []);
      setLoading(false);
    };

    loadReceipts();
  }, []);

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
      return "text-green-700";
    }

    if (receipt.defra_status === "REJECTED") {
      return "text-red-700";
    }

    return "text-slate-700";
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="w-full">
        <div className="px-5 py-8 md:px-10 md:py-10">
          {/* Page heading */}
          <div className="mb-8">
            <div className="mb-6">
              <Link
                href="/"
                className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
              >
                ← Dashboard
              </Link>
            </div>

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
                className="inline-flex w-fit items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                + New waste receipt
              </Link>
            </div>
          </div>

          {/* Receipt list */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {/* Desktop table header */}
            <div className="hidden grid-cols-5 border-b border-slate-200 bg-slate-50 px-6 py-4 text-sm font-medium text-slate-600 md:grid">
              <div>Receipt ID</div>
              <div>Date</div>
              <div>Waste</div>
              <div>EWC</div>
              <div>Status</div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="px-6 py-16 text-center">
                <p className="text-sm text-slate-500">
                  Loading receipts...
                </p>
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="px-6 py-16 text-center">
                <p className="text-sm font-medium text-red-700">
                  {error}
                </p>
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && receipts.length === 0 && (
              <div className="px-6 py-16 text-center">
                <p className="text-sm font-medium text-slate-700">
                  No receipts yet
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Recorded waste receipts will appear here.
                </p>
              </div>
            )}

            {/* Receipts */}
            {!loading && !error && receipts.length > 0 && (
              <div>
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
                      className="block border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50"
                    >
                      {/* Desktop row */}
                      <div className="hidden grid-cols-5 items-center px-6 py-5 text-sm md:grid">
                        <div className="min-w-0 pr-4 font-medium text-slate-900">
                          <span className="block truncate">
                            {receiptId}
                          </span>
                        </div>

                        <div className="whitespace-nowrap text-slate-600">
                          {formatDate(receipt.date_time_received)}
                        </div>

                        <div className="min-w-0 pr-4 text-slate-700">
                          <span className="block truncate">
                            {wasteDescription}
                          </span>
                        </div>

                        <div className="whitespace-nowrap text-slate-600">
                          {ewc}
                        </div>

                        <div
                          className={`font-medium ${getStatusClasses(
                            receipt,
                          )}`}
                        >
                          {getStatusLabel(receipt)}
                        </div>
                      </div>

                      {/* Mobile card */}
                      <div className="space-y-4 px-5 py-5 md:hidden">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                              Receipt ID
                            </p>

                            <p className="mt-1 break-all text-sm font-medium text-slate-900">
                              {receiptId}
                            </p>
                          </div>

                          <div
                            className={`shrink-0 text-sm font-medium ${getStatusClasses(
                              receipt,
                            )}`}
                          >
                            {getStatusLabel(receipt)}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="min-w-0">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                              Date
                            </p>

                            <p className="mt-1 text-sm text-slate-700">
                              {formatDate(receipt.date_time_received)}
                            </p>
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                              EWC
                            </p>

                            <p className="mt-1 text-sm text-slate-700">
                              {ewc}
                            </p>
                          </div>
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Waste
                          </p>

                          <p className="mt-1 break-words text-sm text-slate-700">
                            {wasteDescription}
                          </p>
                        </div>
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

