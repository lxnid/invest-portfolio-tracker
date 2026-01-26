"use client";

import Link from "next/link";
import { Heart } from "lucide-react";

export function FloatingBranding() {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Link
        href="https://dinilr.com"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 text-xs text-zinc-500 hover:text-zinc-50 hover:border-blue-500/30 transition-all duration-300 shadow-lg hover:shadow-blue-500/10 group"
      >
        <span>Built by</span>
        <span className="font-semibold text-zinc-400 group-hover:text-blue-500 transition-colors">
          lxnid
        </span>
      </Link>
    </div>
  );
}
