import { Metadata } from "next";
import { AlertsView } from "@/components/views/alerts-view";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Trading Alerts",
  description:
    "Configure and monitor alerts based on trading rules and market conditions.",
};

export default function AlertsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      }
    >
      <AlertsView />
    </Suspense>
  );
}
