import { Metadata } from "next";
import { DashboardView } from "@/components/views/dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Overview of your investment portfolio performance and market status.",
};

export default function DashboardPage() {
  return <DashboardView />;
}
