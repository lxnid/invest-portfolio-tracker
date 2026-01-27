import { Metadata } from "next";
import { TransactionsView } from "@/components/views/transactions-view";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Transactions",
  description: "View and manage your investment transaction history.",
};

export default function TransactionsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      }
    >
      <TransactionsView />
    </Suspense>
  );
}
