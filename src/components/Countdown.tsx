"use client";

import { useEffect, useState } from "react";

export default function Countdown({
  expiresAt,
  onExpire,
}: {
  expiresAt: string;
  onExpire: () => void;
}) {

  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
        
      const distance =
        new Date(expiresAt).getTime() -
        new Date().getTime();
        
      if (distance <= 0) {

        clearInterval(interval);

        setTimeLeft("EXPIRED");

        if (!isExpired) {
          setIsExpired(true);
          onExpire();
        }

      } else {
        const m = Math.floor(
          (distance % (1000 * 60 * 60)) /
          (1000 * 60)
        );

        const s = Math.floor(
          (distance % (1000 * 60)) / 1000
        );

        setTimeLeft(`${m}m ${s}s`);
      }

    }, 1000);
    return () => clearInterval(interval);

  }, [expiresAt, isExpired, onExpire]);

  return (
    <span
      className={`font-mono font-bold ${
        isExpired
          ? "text-red-600"
          : "text-orange-600"
      }`}
    >
      {timeLeft}
    </span>
  );
}