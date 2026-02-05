"use client";

import Link from "next/link";
import { WifiOff, RefreshCw, Home } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-950 p-6">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="inline-flex p-6 rounded-full bg-zinc-900/50 border border-zinc-800 mb-8">
          <WifiOff className="w-12 h-12 text-zinc-500" />
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-zinc-50 mb-4">You're offline</h1>

        {/* Description */}
        <p className="text-lg text-zinc-400 mb-8">
          It looks like you've lost your internet connection. Some features may
          not be available until you're back online.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium rounded-xl border border-zinc-800 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </div>

        {/* Tip */}
        <p className="mt-12 text-sm text-zinc-600">
          Tip: Previously viewed pages may still be available in offline mode.
        </p>
      </div>
    </main>
  );
}
