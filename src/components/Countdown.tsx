"use client";

import { useEffect, useState } from "react";

interface CountdownProps {
  expiresAt: string;
  onExpire: () => void;
}

export default function Countdown({
  expiresAt,
  onExpire,
}: CountdownProps) {
  const [displayTime, setDisplayTime] = useState("");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const updateTimer = () => {
      const remainingTime =
        new Date(expiresAt).getTime() - Date.now();

      // If time is up
      if (remainingTime <= 0) {
        setDisplayTime("EXPIRED");

        if (!expired) {
          setExpired(true);
          onExpire();
        }

        clearInterval(intervalId);
        return;
      }

      
      const minutes = Math.floor(
        (remainingTime % (1000 * 60 * 60)) / (1000 * 60)
      );

      const seconds = Math.floor(
        (remainingTime % (1000 * 60)) / 1000
      );

      setDisplayTime(`${minutes}m ${seconds}s`);
    };

    
    updateTimer();

    intervalId = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalId);
  }, [expiresAt, expired, onExpire]);

  return (
    <span
      className={`font-mono font-semibold ${
        expired ? "text-red-600" : "text-orange-600"
      }`}
    >
      {displayTime}
    </span>
  );
}