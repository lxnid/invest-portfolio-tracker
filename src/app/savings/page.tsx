"use client";

import { SavingsList } from "@/components/savings/savings-list";
import { LastUpdated } from "@/components/last-updated";
import { useSavings } from "@/lib/hooks";

export default function SavingsPage() {
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

      <SavingsList />
    </div>
  );
}
