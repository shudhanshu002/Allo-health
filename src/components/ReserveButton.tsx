"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ReserveButtonProps {
  productId: string;
  warehouseId: string;
}

export default function ReserveButton({
  productId,
  warehouseId,
}: ReserveButtonProps) {


  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          quantity: 1,
        }),
      });

      const data = await response.json();

      
      if (!response.ok) {
        if (response.status === 409) {
          setError("Out of stock!");
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

  return (
    <div className="flex flex-col items-end gap-1">

      {/* Reserve Button */}
      <button
        onClick={handleReserve}
        disabled={isLoading}
        className={`px-4 py-2 rounded-md font-medium text-white transition-colors ${
          isLoading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
        }`}
      >
        {isLoading ? "Reserving..." : "Reserve"}
      </button>

      {/* Error Message */}
      {error && (
        <span className="text-xs text-red-500 font-medium animate-pulse">
          {error}
        </span>
      )}

    </div>
  );
}