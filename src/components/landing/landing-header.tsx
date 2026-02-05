"use client";

import Link from "next/link";
import Image from "next/image";

export function LandingHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="CSE Tracker"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <span className="text-lg font-semibold text-zinc-50 group-hover:text-blue-400 transition-colors">
            CSE Tracker
          </span>
        </Link>
      </div>
    </header>
  );
}
