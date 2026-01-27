import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, PiggyBank } from "lucide-react";
import { useSavings } from "@/lib/hooks";

export function SavingsCard() {
  const { data: savings, isLoading } = useSavings();

  const totalSavings =
    savings?.reduce((acc, entry) => acc + parseFloat(entry.amount), 0) || 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-zinc-500">
          Total Savings
        </CardTitle>
        <div className="p-2 rounded-lg bg-zinc-800">
          <PiggyBank className="h-4 w-4 text-zinc-400" />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            <span className="text-zinc-500">Loading...</span>
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold text-zinc-50">
              LKR{" "}
              {totalSavings.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs mt-1 text-zinc-500">
              Across {savings?.length || 0} accounts
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
