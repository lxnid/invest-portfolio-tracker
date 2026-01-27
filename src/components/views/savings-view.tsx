"use client";

import { SavingsList } from "@/components/savings/savings-list";
import { LastUpdated } from "@/components/last-updated";
import { RateComparisonPanel } from "@/components/savings/rate-comparison-panel";
import { useSavings } from "@/lib/hooks";

export function SavingsView() {
  const { dataUpdatedAt } = useSavings();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-50">Savings</h1>
          <p className="text-zinc-500 mt-1">
            Manage your cash savings and fixed deposits
          </p>
          <LastUpdated timestamp={dataUpdatedAt} className="mt-1" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        <SavingsList />
      </div>

      <div className="mt-8">
        <RateComparisonPanel />
      </div>
    </div>
  );
}
