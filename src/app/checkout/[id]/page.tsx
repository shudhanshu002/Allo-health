"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Countdown from "@/components/Countdown";

export default function CheckoutPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [reservation, setReservation] = useState<any>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [isExpiredClient, setIsExpiredClient] = useState(false);

  useEffect(() => {
    const fetchReservation = async () => {
      try {
        const res = await fetch(`/api/reservations/${id}`);
        if (res.ok) {
          const data = await res.json();
          setReservation(data);
        } else {
          setActionError("Failed to fetch reservation data.");
        }
      } catch (err) {
        setActionError("Network error while fetching reservation.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchReservation();
  }, [id]);

  const handleAction = async (action: "confirm" | "release") => {
    setProcessing(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/reservations/${id}/${action}`, { method: "POST" });
      if (!res.ok) {
        if (res.status === 410) {
          setActionError("Too late! Your reservation expired and stock was released.");
          setIsExpiredClient(true);
        } else {
          const data = await res.json();
          setActionError(data.error || "Action failed");
        }
        setProcessing(false);
        return;
      }
      router.replace("/");
      router.refresh(); 
    } catch (err) {
      setActionError("Network error.");
      setProcessing(false);
    }
  };

  const handleTimeOut = () => {
    // Prevent double-firing
    if (processing) return; 

    setIsExpiredClient(true);
    setProcessing(true); 
    setActionError("Time expired! Releasing stock and redirecting...");
    fetch(`/api/reservations/${id}/release`, { method: "POST" })
      .catch(err => console.error("Background release failed", err));
      
    setTimeout(() => {
      router.replace("/");
      router.refresh();
    }, 1500);
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading checkout...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gray-900 p-6 text-white text-center">
          <h1 className="text-2xl font-bold">Checkout</h1>
          <p className="text-gray-400 text-sm mt-1">Order #{id?.toString().slice(0,8)}</p>
        </div>

        <div className="p-6">
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg mb-6 flex justify-between items-center">
            <span className="text-orange-800 font-medium text-sm">Time to complete order:</span>
            {reservation?.expiresAt && !isExpiredClient ? (
              <Countdown expiresAt={reservation.expiresAt} onExpire={handleTimeOut} />
            ) : (
              <span className="text-red-600 font-bold text-sm">EXPIRED</span>
            )}
          </div>

          {actionError && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center font-medium animate-pulse">
              {actionError}
            </div>
          )}

          <div className="space-y-3 mt-8">
            <button
              onClick={() => handleAction("confirm")}
              disabled={processing || isExpiredClient}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {processing && !isExpiredClient ? "Processing..." : "Confirm Purchase"}
            </button>

            <button
              onClick={() => handleAction("release")}
              disabled={processing || isExpiredClient}
              className="w-full bg-white border-2 border-gray-200 text-gray-600 py-3 rounded-lg font-bold hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel & Release Stock
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}