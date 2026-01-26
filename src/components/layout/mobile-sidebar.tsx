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
  Globe,
} from "lucide-react";
import { BrandingFooter } from "@/components/branding-footer";
import { useState, useEffect } from "react";
import { useMarketData } from "@/lib/hooks";

const navItems = [
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/market", label: "Market", icon: Globe },
  { href: "/transactions", label: "Transactions", icon: ArrowRightLeft },
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
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b border-[#2f2f2f] bg-[#1e1e1e] p-4 md:px-16">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-teal-400 to-cyan-400">
            <TrendingUp className="h-5 w-5 text-[#1e1e1e]" />
          </div>
          <span className="text-lg font-bold text-[#f5f5f5]">CSE Tracker</span>
        </Link>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 text-[#a8a8a8] hover:text-[#f5f5f5]"
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
          "fixed inset-y-0 left-0 z-50 w-[85vw] max-w-xs transform border-r border-[#2f2f2f] bg-[#1e1e1e] transition-transform duration-300 ease-in-out lg:hidden flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-[#2f2f2f] px-6 shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-teal-400 to-cyan-400">
              <TrendingUp className="h-5 w-5 text-[#1e1e1e]" />
            </div>
            <span className="text-lg font-bold text-[#f5f5f5]">
              CSE Tracker
            </span>
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4 text-[#f5f5f5]" />
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
                    ? "bg-[#5eead4]/10 text-[#5eead4] border border-[#5eead4]/30"
                    : "text-[#a8a8a8] hover:bg-[#2a2a2a] hover:text-[#f5f5f5]",
                )}
              >
                <Icon className="h-6 w-6" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[#2f2f2f] p-4 shrink-0">
          <BrandingFooter className="border-0 pt-0 mt-0 mb-4" mobile />

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#a8a8a8] hover:bg-[#2a2a2a] hover:text-[#f5f5f5] transition-all duration-200 mb-3"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>

          <div className="flex items-center gap-2 text-sm px-3">
            <span className="relative flex h-2 w-2">
              <span
                className={cn(
                  "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                  marketStatus?.isOpen ? "bg-[#4ade80]" : "bg-[#f87171]",
                )}
              ></span>
              <span
                className={cn(
                  "relative inline-flex h-2 w-2 rounded-full",
                  marketStatus?.isOpen ? "bg-[#4ade80]" : "bg-[#f87171]",
                )}
              ></span>
            </span>
            <span className="text-[#8a8a8a]">
              {marketStatus?.isOpen ? "Market Open" : "Market Closed"}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
