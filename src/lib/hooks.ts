"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types
export interface Stock {
  id: number;
  symbol: string;
  name: string;
  sector?: string;
  logoPath?: string;
}

export interface Holding {
  id: number;
  quantity: number;
  avgBuyPrice: string;
  totalInvested: string;
  status: string;
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
    | "TRADE_FREQUENCY";
  threshold: string;
  isActive: boolean;

  createdAt: string;
}

export interface Settings {
  id: number;
  capital: string;
  updatedAt: string;
}

export interface MarketData {
  marketStatus: {
    isOpen: boolean;
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
  allStocks: Array<{
    symbol: string;
    name: string;
    price: number;
    change: number;
    percentChange: number;
    volume: number;
  }>;
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

async function fetchStockPrice(
  symbol: string,
): Promise<{ price: number; change: number; percentChange: number } | null> {
  const res = await fetch(`/api/cse/stock/${symbol}`);
  if (!res.ok) return null;
  const json = await res.json();
  return json.data?.price || null;
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
    staleTime: 60000, // 1 minute - CSE data doesn't update that frequently
    refetchInterval: 60000, // Auto-refresh every minute
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

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: { capital: number }) => {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Failed to update settings");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
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
      if (!res.ok) throw new Error("Failed to create holding");
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
      if (!res.ok) throw new Error("Failed to delete holding");
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
      if (!res.ok) throw new Error("Failed to create transaction");
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
      if (!res.ok) throw new Error("Failed to create rule");
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
      if (!res.ok) throw new Error("Failed to delete rule");
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
      if (!res.ok) throw new Error("Failed to update rule");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rules"] });
    },
  });
}
