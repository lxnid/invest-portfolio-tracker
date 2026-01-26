"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Briefcase,
  ArrowRightLeft,
  ShieldCheck,
  TrendingUp,
  LogOut,
  Globe,
} from "lucide-react";

import { BrandingFooter } from "@/components/branding-footer";
import { useMarketData } from "@/lib/hooks";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/market", label: "Market", icon: Globe },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/transactions", label: "Transactions", icon: ArrowRightLeft },
  { href: "/alerts", label: "Trading Alerts", icon: ShieldCheck },
  { href: "/analytics", label: "Analytics", icon: TrendingUp },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: marketData } = useMarketData();
  const marketStatus = marketData?.marketStatus;

  const handleLogout = async () => {
    // ... (same implementation)
    console.log("Logging out...");
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        cache: "no-store",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      // Force hard redirect to clear client state
      window.location.href = "/login";
    }
  };

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 z-40 h-screen w-64 flex-col border-r border-zinc-800 bg-zinc-950">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-zinc-800 px-6 shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <TrendingUp className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold text-zinc-50">CSE Tracker</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50",
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-zinc-800 p-4 bg-zinc-950 shrink-0">
        <BrandingFooter className="border-0 pt-0 mt-0 mb-2" />

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50 transition-all duration-200 mb-3"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>

        {/* Market Status */}
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
    </aside>
  );
}
