"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types
export interface Stock {
  id: number;
  symbol: string;
  name: string;
  sector?: string;
  logoPath?: string | null;
}

export interface Holding {
  id: number;
  stockId: number;
  quantity: number;
  avgBuyPrice: string;
  initialBuyPrice?: string;
  lastBuyPrice?: string;
  totalInvested: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  stock: Stock;
  currentPrice?: number;
  currentValue?: number;
  profitLoss?: number;
  profitLossPercent?: number;
}

export interface Transaction {
  id: number;
  type: "BUY" | "SELL" | "DIVIDEND";
  quantity: number;
  price: string;
  fees: string;
  totalAmount: string;
  notes?: string;
  date: string;
  createdAt: string;
  stock: Stock;
}

export interface TradingRule {
  id: number;
  name: string;
  description?: string;
  ruleType:
    | "POSITION_SIZE"
    | "STOP_LOSS"
    | "TAKE_PROFIT"
    | "SECTOR_LIMIT"
    | "TRADE_FREQUENCY"
    | "CASH_BUFFER"
    | "BUY_CONDITION"
    | "SELL_CONDITION";
  threshold: string;
  isActive: boolean;

  createdAt: string;
}

export interface Settings {
  id: number;
  capital: string;
  updatedAt: string;
}

export interface SavingsEntry {
  id: number;
  name: string;
  bankName?: string;
  type: string;
  amount: string;
  interestRate: string;
  currency: string;
  startDate?: string;
  maturityDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketData {
  marketStatus: {
    isOpen: boolean;
    status: string;
    statusMessage?: string;
  } | null;
  aspi: {
    index: number;
    change: number;
    percentChange: number;
  } | null;
  sp20: {
    index: number;
    change: number;
    percentChange: number;
  } | null;
  // allStocks removed as part of optimization
}

// Fetch functions
async function fetchHoldings(): Promise<Holding[]> {
  const res = await fetch("/api/holdings");
  if (!res.ok) throw new Error("Failed to fetch holdings");
  const json = await res.json();
  return json.data || [];
}

async function fetchTransactions(type?: string): Promise<Transaction[]> {
  const url = type ? `/api/transactions?type=${type}` : "/api/transactions";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch transactions");
  const json = await res.json();
  return json.data || [];
}

async function fetchRules(): Promise<TradingRule[]> {
  const res = await fetch("/api/rules");
  if (!res.ok) throw new Error("Failed to fetch rules");
  const json = await res.json();
  return json.data || [];
}

async function fetchMarketData(): Promise<MarketData> {
  const res = await fetch("/api/cse/market");
  if (!res.ok) throw new Error("Failed to fetch market data");
  const json = await res.json();
  return json.data;
}

export async function fetchStockPrice(
  symbol: string,
): Promise<{ price: number; change: number; percentChange: number } | null> {
  const res = await fetch(`/api/cse/stock/${symbol}`);
  if (!res.ok) return null;
  const json = await res.json();
  return json.data?.price || null;
}

async function fetchSavings(): Promise<SavingsEntry[]> {
  const res = await fetch("/api/savings");
  if (!res.ok) throw new Error("Failed to fetch savings");
  const json = await res.json();
  return json || [];
}

// Query Hooks
export function useHoldings() {
  return useQuery({
    queryKey: ["holdings"],
    queryFn: fetchHoldings,
    staleTime: 30000, // 30 seconds
  });
}

export function useTransactions(type?: string) {
  return useQuery({
    queryKey: ["transactions", type],
    queryFn: () => fetchTransactions(type),
    staleTime: 30000,
  });
}

export function useRules() {
  return useQuery({
    queryKey: ["rules"],
    queryFn: fetchRules,
    staleTime: 60000, // 1 minute
  });
}

export function useMarketData() {
  return useQuery({
    queryKey: ["marketData"],
    queryFn: fetchMarketData,
    staleTime: 300000, // 5 minutes
    refetchInterval: 300000, // Auto-refresh every 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useStockPrice(symbol: string) {
  return useQuery({
    queryKey: ["stockPrice", symbol],
    queryFn: () => fetchStockPrice(symbol),
    enabled: !!symbol,
    staleTime: 30000,
  });
}

// Lightweight hook for portfolio prices - only fetches prices for user's holdings
// Uses 30-second polling for near real-time accuracy
export function useHoldingPrices() {
  return useQuery({
    queryKey: ["holdingPrices"],
    queryFn: async () => {
      const res = await fetch("/api/holdings/prices");
      if (!res.ok) throw new Error("Failed to fetch holding prices");
      const json = await res.json();
      return json.data as {
        prices: Record<
          string,
          { price: number; change: number; percentChange: number }
        >;
        fetchedAt: string;
        symbolCount: number;
      };
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // Auto-refresh every 30 seconds for real-time accuracy
    refetchOnWindowFocus: true, // Refresh when user returns to tab
  });
}

export function useStockDetails(symbol: string) {
  return useQuery({
    queryKey: ["stockDetails", symbol],
    queryFn: async () => {
      const res = await fetch(`/api/stocks/${symbol}`);
      if (!res.ok) throw new Error("Failed to fetch stock details");
      const json = await res.json();
      return json.data;
    },
    enabled: !!symbol,
    staleTime: 300000, // 5 minutes
    refetchInterval: 300000,
    refetchOnWindowFocus: false,
  });
}

export function useSettings() {
  return useQuery<Settings>({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
  });
}

export function usePortfolioHistory() {
  return useQuery<{ date: string; month: string; value: number }[]>({
    queryKey: ["portfolioHistory"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/history");
      if (!res.ok) throw new Error("Failed to fetch history");
      const json = await res.json();
      return json.data || [];
    },
    staleTime: 60000,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: { capital: number }) => {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update settings");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

export function useUpdateStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      symbol,
      sector,
    }: {
      symbol: string;
      sector: string;
    }) => {
      const res = await fetch(`/api/stocks/${symbol}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sector }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update stock");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["stockDetails", variables.symbol],
      });
      queryClient.invalidateQueries({ queryKey: ["marketData"] });
      queryClient.invalidateQueries({ queryKey: ["holdings"] });
    },
  });
}

// Mutation Hooks
export function useCreateHolding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      symbol: string;
      name: string;
      sector?: string;
      quantity: number;
      avgBuyPrice: string;
    }) => {
      const res = await fetch("/api/holdings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create holding");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holdings"] });
    },
  });
}

export function useDeleteHolding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/holdings/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete holding");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holdings"] });
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      symbol: string;
      name: string;
      sector?: string;
      type: "BUY" | "SELL" | "DIVIDEND";
      quantity: number;
      price: string;
      fees?: string;
      notes?: string;
      executedAt: string;
    }) => {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create transaction");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["holdings"] });
    },
  });
}

export function useCreateRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      ruleType: TradingRule["ruleType"];
      threshold: string;
      isActive?: boolean;
    }) => {
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create rule");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rules"] });
    },
  });
}

export function useDeleteRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/rules/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete rule");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rules"] });
    },
  });
}

export function useToggleRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await fetch(`/api/rules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update rule");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rules"] });
    },
  });
}

export function useUpdateRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      description,
      ruleType,
      threshold,
      isActive,
    }: {
      id: number;
      name?: string;
      description?: string;
      ruleType?: TradingRule["ruleType"];
      threshold?: string;
      isActive?: boolean;
    }) => {
      const res = await fetch(`/api/rules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          ruleType,
          threshold,
          isActive,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update rule");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rules"] });
    },
  });
}

export function useSavings() {
  return useQuery({
    queryKey: ["savings"],
    queryFn: fetchSavings,
    staleTime: 60000,
  });
}

export function useCreateSavingsEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<SavingsEntry>) => {
      const res = await fetch("/api/savings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create savings entry");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings"] });
    },
  });
}

export function useUpdateSavingsEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<SavingsEntry> & { id: number }) => {
      const res = await fetch(`/api/savings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update savings entry");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings"] });
    },
  });
}

export function useDeleteSavingsEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/savings/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete savings entry");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings"] });
    },
  });
}
