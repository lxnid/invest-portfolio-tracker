"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Briefcase,
  ArrowRightLeft,
  ShieldCheck,
  TrendingUp,
  LogOut,
  X,
  Menu,
  PiggyBank,
} from "lucide-react";
import { BrandingFooter } from "@/components/branding-footer";
import { useState, useEffect } from "react";
import { useMarketData } from "@/lib/hooks";

const navItems = [
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },

  { href: "/transactions", label: "Transactions", icon: ArrowRightLeft },
  { href: "/savings", label: "Savings", icon: PiggyBank },
  { href: "/alerts", label: "Trading Alerts", icon: ShieldCheck },
  { href: "/analytics", label: "Analytics", icon: TrendingUp },
];

export function MobileSidebar() {
  // ... (hooks and state)
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { data: marketData } = useMarketData();
  const marketStatus = marketData?.marketStatus;

  // Close sidebar on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent scrolling when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        cache: "no-store",
      });
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      {/* Mobile Top Bar Trigger */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b border-zinc-800 bg-zinc-950 p-4 md:px-16">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <TrendingUp className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold text-zinc-50">CSE Tracker</span>
        </Link>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 text-zinc-400 hover:text-zinc-50"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[85vw] max-w-xs transform border-r border-zinc-800 bg-zinc-950 transition-transform duration-300 ease-in-out lg:hidden flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-zinc-800 px-6 shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-zinc-50">CSE Tracker</span>
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4 text-zinc-50" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto flex flex-col gap-1 p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 rounded-lg px-4 py-3.5 text-base font-medium transition-all duration-200",
                  isActive
                    ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50",
                )}
              >
                <Icon className="h-6 w-6" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-zinc-800 p-4 shrink-0">
          <BrandingFooter className="border-0 pt-0 mt-0 mb-4" mobile />

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50 transition-all duration-200 mb-3"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>

          <div className="flex items-center gap-2 text-sm px-3">
            <span className="relative flex h-2 w-2">
              <span
                className={cn(
                  "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                  marketStatus?.isOpen ? "bg-emerald-500" : "bg-red-500",
                )}
              ></span>
              <span
                className={cn(
                  "relative inline-flex h-2 w-2 rounded-full",
                  marketStatus?.isOpen ? "bg-emerald-500" : "bg-red-500",
                )}
              ></span>
            </span>
            <span className="text-zinc-500">
              {marketStatus?.isOpen ? "Market Open" : "Market Closed"}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
