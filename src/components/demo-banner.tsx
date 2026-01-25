"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { DEMO_LIMITS } from "@/lib/demo-constants";

export function DemoBanner() {
  const [isGuest, setIsGuest] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if current session is a guest session by calling a lightweight endpoint
    // or checking a cookie (we'll use a simple approach)
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        setIsGuest(data.role === "guest");
      } catch {
        setIsGuest(false);
      }
    };
    checkSession();
  }, []);

  if (!isGuest || dismissed) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500/90 text-black px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">
            Demo Mode: Max {DEMO_LIMITS.MAX_TRANSACTIONS} transactions,{" "}
            {DEMO_LIMITS.MAX_HOLDINGS} holdings. Data is deleted on logout or
            after 24 hours.
          </span>
        </div>
        <button onClick={() => setDismissed(true)} className="hover:opacity-80">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
