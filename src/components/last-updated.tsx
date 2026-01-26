"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Clock } from "lucide-react";

export function LastUpdated({
  timestamp,
  className = "",
}: {
  timestamp: number | Date | undefined;
  className?: string;
}) {
  const [timeAgo, setTimeAgo] = useState("");

  useEffect(() => {
    if (!timestamp) return;

    const updateTime = () => {
      setTimeAgo(formatDistanceToNow(new Date(timestamp), { addSuffix: true }));
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [timestamp]);

  if (!timestamp) return null;

  return (
    <div
      className={`flex items-center gap-1.5 text-xs text-[#8a8a8a] ${className}`}
    >
      <Clock className="h-3 w-3" />
      <span>Last synced {timeAgo}</span>
    </div>
  );
}
