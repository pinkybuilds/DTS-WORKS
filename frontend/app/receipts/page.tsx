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
      <section className="flex-1">

        {/* Header */}
        <header className="border-b border-slate-200 bg-white px-6 py-5 md:px-10">
          <div className="flex items-center justify-between">

            <h1 className="text-lg font-semibold">
              Receipts
            </h1>

            <Link
              href="/receipts/new-receipt"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              + New waste receipt
            </Link>

          </div>
        </header>

        {/* Page content */}
        <div className="px-6 py-10 md:px-10">

          <div className="mb-8">
            <h2 className="text-3xl font-semibold tracking-tight">
              Waste receipts
            </h2>

            <p className="mt-2 text-slate-600">
              View and manage waste movements recorded through DTS Works.
            </p>
          </div>

          {/* Receipt list */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">

            {/* Table header */}
            <div className="grid grid-cols-5 border-b border-slate-200 bg-slate-50 px-6 py-4 text-sm font-medium text-slate-600">
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

                  return (
                    <Link
                      key={receipt.id}
                      href={`/receipts/${receipt.id}`}
                      className="grid grid-cols-5 items-center border-b border-slate-100 px-6 py-5 text-sm transition hover:bg-slate-50 last:border-b-0"
                    >
                      <div className="font-medium text-slate-900">
                        {receipt.waste_tracking_id || receipt.id}
                      </div>

                      <div className="text-slate-600">
                        {formatDate(receipt.date_time_received)}
                      </div>

                      <div className="truncate pr-4 text-slate-700">
                        {wasteDescription}
                      </div>

                      <div className="text-slate-600">
                        {ewc}
                      </div>

                      <div
                        className={`font-medium ${getStatusClasses(
                          receipt,
                        )}`}
                      >
                        {getStatusLabel(receipt)}
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