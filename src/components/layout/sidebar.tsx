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
} from "lucide-react";

const navItems = [
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowRightLeft },
  { href: "/rules", label: "Trading Rules", icon: ShieldCheck },
  { href: "/analytics", label: "Analytics", icon: TrendingUp },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-[#2f2f2f] bg-[#1e1e1e]">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-[#2f2f2f] px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-teal-400 to-cyan-400">
            <TrendingUp className="h-5 w-5 text-[#1e1e1e]" />
          </div>
          <span className="text-lg font-bold text-[#f5f5f5]">CSE Tracker</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-4">
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
                  ? "bg-[#5eead4]/10 text-[#5eead4] border border-[#5eead4]/30"
                  : "text-[#a8a8a8] hover:bg-[#2a2a2a] hover:text-[#f5f5f5]",
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-[#2f2f2f] p-4">
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#a8a8a8] hover:bg-[#2a2a2a] hover:text-[#f5f5f5] transition-all duration-200 mb-3"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>

        {/* Market Status */}
        <div className="flex items-center gap-2 text-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f87171] opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#f87171]"></span>
          </span>
          <span className="text-[#8a8a8a]">Market Closed</span>
        </div>
      </div>
    </aside>
  );
}
