import { Metadata } from "next";
import { SavingsView } from "@/components/views/savings-view";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Savings",
  description: "Track your cash savings and fixed bank deposits.",
};

export default function SavingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      }
    >
      <SavingsView />
    </Suspense>
  );
}
