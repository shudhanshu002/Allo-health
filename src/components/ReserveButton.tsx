"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ReserveButtonProps {
  productId: string;
  warehouseId: string;
  availableStock: number; // NEW: Pass down the max limit
}

export default function ReserveButton({
  productId,
  warehouseId,
  availableStock,
}: ReserveButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1); // NEW: Track selected quantity

  const router = useRouter();

  const handleReserve = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          warehouseId,
          quantity, // UPDATED: Send the custom quantity to the API
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setError("Not enough stock available!");
        } else {
          setError(data.error || "Something went wrong");
        }
        return;
      }

      router.push(`/checkout/${data.id}`);
    } catch (err) {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  // Ensure the user doesn't manually type a number higher than stock
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val)) val = 1;
    // Clamp the value between 1 and availableStock
    setQuantity(Math.max(1, Math.min(val, availableStock)));
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        {/* NEW: Quantity Input */}
        <input
          type="number"
          min="1"
          max={availableStock}
          value={quantity}
          onChange={handleQuantityChange}
          disabled={isLoading}
          className="w-16 px-2 py-2 border border-gray-300 rounded-md text-sm text-center focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
          title="Quantity"
        />

        {/* Reserve Button */}
        <button
          onClick={handleReserve}
          disabled={isLoading || quantity < 1 || quantity > availableStock}
          className={`px-4 py-2 rounded-md font-medium text-white transition-colors ${
            isLoading || quantity < 1 || quantity > availableStock
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
          }`}
        >
          {isLoading ? "Reserving..." : "Reserve"}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <span className="text-xs text-red-500 font-medium animate-pulse">
          {error}
        </span>
      )}
    </div>
  );
}