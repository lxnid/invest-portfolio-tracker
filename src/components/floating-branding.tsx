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
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1e1e1e]/80 backdrop-blur-sm border border-[#2f2f2f] text-xs text-[#666666] hover:text-[#f5f5f5] hover:border-[#5eead4]/30 transition-all duration-300 shadow-lg hover:shadow-[#5eead4]/10 group"
      >
        <span>Built by</span>
        <span className="font-semibold text-[#a8a8a8] group-hover:text-[#5eead4] transition-colors">
          lxnid
        </span>
      </Link>
    </div>
  );
}
