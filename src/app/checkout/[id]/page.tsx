"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Countdown from "@/components/Countdown";

type Reservation = any; 

export default function CheckoutPage() {
  const { id } = useParams();
  const router = useRouter();

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [processing, setProcessing] = useState(false);
  const [expired, setExpired] = useState(false);

  
  useEffect(() => {
    if (!id) return;

    const loadReservation = async () => {
      try {
        const res = await fetch(`/api/reservations/${id}`);

        if (!res.ok) {
          setError("Unable to load reservation details.");
          return;
        }

        const data = await res.json();
        setReservation(data);
      } catch (err) {
        setError("Network error while loading reservation.");
      } finally {
        setLoading(false);
      }
    };

    loadReservation();
  }, [id]);

  
  const handleAction = async (action: "confirm" | "release") => {
    setProcessing(true);
    setError(null);

    try {
      const res = await fetch(`/api/reservations/${id}/${action}`, {
        method: "POST",
      });

      if (!res.ok) {
        if (res.status === 410) {
          setExpired(true);
          setError("Reservation expired. Stock has been released.");
        } else {
          const data = await res.json().catch(() => ({}));
          setError(data?.error || "Request failed.");
        }

        return;
      }

      router.replace("/");
      router.refresh();
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleExpire = () => {
    if (processing) return;

    setExpired(true);
    setError("Time expired. Releasing reservation...");

    fetch(`/api/reservations/${id}/release`, {
      method: "POST",
    }).catch((err) => console.error("Auto-release failed:", err));

    setTimeout(() => {
      router.replace("/");
      router.refresh();
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="bg-white px-8 py-6 rounded-2xl shadow-lg border">
          <div className="animate-spin h-10 w-10 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto" />
          <p className="mt-4 text-center text-slate-500">
            Loading checkout...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border overflow-hidden">

        {/* Header */}
        <div className="p-8 border-b text-center">
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            Secure Checkout
          </span>

          <h1 className="text-3xl font-bold mt-4">Complete Your Purchase</h1>

          <p className="text-sm text-slate-500 mt-2">Reservation ID</p>

          <div className="mt-2 font-mono text-sm bg-slate-100 px-3 py-1 rounded-lg inline-block">
            #{String(id).slice(0, 8)}
          </div>
        </div>

        {/* Body */}
        <div className="p-8">

          {/* Timer */}
          <div className="mb-6 p-5 rounded-2xl bg-orange-50 border border-orange-200 flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold text-orange-700">
                Time Remaining
              </p>
              <p className="text-xs text-orange-600 mt-1">
                Complete checkout before expiry
              </p>
            </div>

            <div>
              {reservation?.expiresAt && !expired ? (
                <Countdown
                  expiresAt={reservation.expiresAt}
                  onExpire={handleExpire}
                />
              ) : (
                <span className="text-red-600 font-bold text-sm">
                  EXPIRED
                </span>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 border border-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Summary */}
          <div className="mb-6 p-5 rounded-2xl bg-slate-50 border">
            <h2 className="font-semibold mb-3">Summary</h2>

            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Status</span>
              <span className="text-green-600 font-semibold">Reserved</span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => handleAction("confirm")}
              disabled={processing || expired}
              className="w-full py-3 rounded-xl text-white font-semibold bg-green-600 disabled:opacity-50"
            >
              {processing ? "Processing..." : "Confirm Purchase"}
            </button>

            <button
              onClick={() => handleAction("release")}
              disabled={processing || expired}
              className="w-full py-3 rounded-xl border font-semibold hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel & Release
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}