"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ReserveButtonProps {
  productId: string;
  warehouseId: string;
  availableStock: number;
}

export default function ReserveButton({
  productId,
  warehouseId,
  availableStock,
}: ReserveButtonProps) {
  const router = useRouter();

  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  
  const reserveStock = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          warehouseId,
          quantity,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 409) {
          setError("Not enough stock available");
        } else {
          setError(data?.error || "Something went wrong");
        }
        return;
      }

      router.push(`/checkout/${data.id}`);
    } catch (err) {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };
  
  const updateQuantityFromInput = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const rawValue = parseInt(e.target.value, 10);

    const safeValue = Number.isNaN(rawValue) ? 1 : rawValue;

    setQuantity(Math.max(1, Math.min(safeValue, availableStock)));
  };

  const increaseQuantity = () => {
    setQuantity((prev) => Math.min(availableStock, prev + 1));
  };

  const decreaseQuantity = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const isReserveDisabled =
    loading || quantity < 1 || quantity > availableStock;

  return (
    <div className="flex flex-col items-end gap-2">

      {/* Quantity + Button Row */}
      <div className="flex items-center gap-3">

        {/* Quantity Selector */}
        <div className="flex items-center rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">

          <button
            type="button"
            disabled={loading || quantity <= 1}
            onClick={decreaseQuantity}
            className="h-11 w-11 text-slate-600 hover:bg-slate-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            −
          </button>

          <input
            type="number"
            min="1"
            max={availableStock}
            value={quantity}
            onChange={updateQuantityFromInput}
            disabled={loading}
            className="w-14 h-11 text-center font-semibold text-slate-800 outline-none border-x border-slate-200 disabled:bg-slate-50"
            title="Quantity"
          />

          <button
            type="button"
            disabled={loading || quantity >= availableStock}
            onClick={increaseQuantity}
            className="h-11 w-11 text-slate-600 hover:bg-slate-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>

        {/* Reserve Button */}
        <button
          onClick={reserveStock}
          disabled={isReserveDisabled}
          className={`relative overflow-hidden px-6 py-3 rounded-xl font-semibold text-sm tracking-wide transition-all duration-200 shadow-md ${
            isReserveDisabled
              ? "bg-slate-300 text-white cursor-not-allowed"
              : "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white hover:shadow-xl hover:scale-[1.03] active:scale-[0.98]"
          }`}
        >
          <span className="relative z-10">
            {loading ? "Reserving..." : "Reserve"}
          </span>
        </button>
      </div>

      {/* Stock Info */}
      <div className="flex items-center gap-2 text-xs">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />

        <span className="text-slate-500 font-medium">
          {availableStock} units available
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs font-medium animate-in fade-in slide-in-from-top-1 duration-200">
          {error}
        </div>
      )}
    </div>
  );
}