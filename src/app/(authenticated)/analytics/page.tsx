import { Metadata } from "next";
import { AnalyticsView } from "@/components/views/analytics-view";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Analytics",
  description:
    "Detailed analysis of your portfolio performance, sector allocation, and benchmark comparison.",
};

export default function AnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      }
    >
      <AnalyticsView />
    </Suspense>
  );
}
