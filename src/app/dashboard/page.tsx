"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Briefcase,
  BarChart3,
  Activity,
  Loader2,
} from "lucide-react";
import { useHoldings, useMarketData } from "@/lib/hooks";
import {
  calculatePortfolioTotals,
  enrichHoldingsWithPrices,
} from "@/lib/rule-engine";
import { useMemo } from "react";

function StatCard({
  title,
  value,
  change,
  changePercent,
  icon: Icon,
  prefix = "",
  isLoading = false,
}: {
  title: string;
  value: string;
  change?: number;
  changePercent?: number;
  icon: React.ElementType;
  prefix?: string;
  isLoading?: boolean;
}) {
  const isPositive = (change ?? 0) >= 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-[#8a8a8a]">
          {title}
        </CardTitle>
        <div className="p-2 rounded-lg bg-[#333333]">
          <Icon className="h-4 w-4 text-[#a8a8a8]" />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-[#5eead4]" />
            <span className="text-[#8a8a8a]">Loading...</span>
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold text-[#f5f5f5]">
              {prefix}
              {value}
            </div>
            {change !== undefined && (
              <p className="text-xs mt-1 flex items-center gap-1">
                {isPositive ? (
                  <TrendingUp className="h-3 w-3 text-[#4ade80]" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-[#f87171]" />
                )}
                <span
                  className={isPositive ? "text-[#4ade80]" : "text-[#f87171]"}
                >
                  {isPositive ? "+" : ""}
                  {change.toLocaleString()} ({changePercent?.toFixed(2)}%)
                </span>
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: holdings, isLoading: holdingsLoading } = useHoldings();
  const { data: marketData, isLoading: marketLoading } = useMarketData();

  // Build price map from market data
  const stockPrices = useMemo(() => {
    const map = new Map<string, number>();
    if (marketData?.allStocks) {
      for (const stock of marketData.allStocks) {
        map.set(stock.symbol, stock.price);
      }
    }
    return map;
  }, [marketData]);

  // Enrich holdings with current prices
  const enrichedHoldings = useMemo(() => {
    if (!holdings) return [];
    return enrichHoldingsWithPrices(holdings, stockPrices);
  }, [holdings, stockPrices]);

  // Calculate portfolio totals
  const totals = useMeta(
    () => calculatePortfolioTotals(enrichedHoldings),
    [enrichedHoldings],
  );

  // Find top gainer and loser from market data
  const { topGainer, topLoser } = useMemo(() => {
    if (!marketData?.allStocks || marketData.allStocks.length === 0) {
      return { topGainer: null, topLoser: null };
    }
    const sorted = [...marketData.allStocks].sort(
      (a, b) => b.percentChange - a.percentChange,
    );
    return {
      topGainer: sorted[0],
      topLoser: sorted[sorted.length - 1],
    };
  }, [marketData]);

  const isLoading = holdingsLoading || marketLoading;
  const marketOpen = marketData?.marketStatus?.isOpen ?? false;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#f5f5f5]">Dashboard</h1>
          <p className="text-[#8a8a8a] mt-1">
            Your portfolio overview and market summary
          </p>
        </div>
        <Badge variant="outline" className="gap-2">
          <span className="relative flex h-2 w-2">
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full ${marketOpen ? "bg-[#4ade80]" : "bg-[#f87171]"} opacity-75`}
            ></span>
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${marketOpen ? "bg-[#4ade80]" : "bg-[#f87171]"}`}
            ></span>
          </span>
          {marketOpen ? "Market Open" : "Market Closed"}
        </Badge>
      </div>

      {/* Portfolio Stats */}
      <div>
        <h2 className="text-lg font-semibold text-[#f5f5f5] mb-4">
          Portfolio Overview
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Portfolio Value"
            value={totals.totalValue.toLocaleString()}
            change={totals.profitLoss}
            changePercent={totals.profitLossPercent}
            icon={DollarSign}
            prefix="LKR "
            isLoading={isLoading}
          />
          <StatCard
            title="Total Invested"
            value={totals.totalInvested.toLocaleString()}
            icon={Briefcase}
            prefix="LKR "
            isLoading={isLoading}
          />
          <StatCard
            title="Total P/L"
            value={totals.profitLoss.toLocaleString()}
            change={totals.profitLoss}
            changePercent={totals.profitLossPercent}
            icon={BarChart3}
            prefix="LKR "
            isLoading={isLoading}
          />
          <StatCard
            title="Holdings"
            value={totals.holdingsCount.toString()}
            icon={Activity}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Market Overview */}
      <div>
        <h2 className="text-lg font-semibold text-[#f5f5f5] mb-4">
          Market Overview
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-[#5eead4]/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#8a8a8a]">
                All Share Price Index (ASPI)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {marketLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-[#5eead4]" />
                </div>
              ) : marketData?.aspi ? (
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold text-[#f5f5f5]">
                    {marketData.aspi.index.toLocaleString()}
                  </span>
                  <div className="flex items-center gap-1 mb-1">
                    {marketData.aspi.change >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-[#4ade80]" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-[#f87171]" />
                    )}
                    <span
                      className={`text-sm font-medium ${marketData.aspi.change >= 0 ? "text-[#4ade80]" : "text-[#f87171]"}`}
                    >
                      {marketData.aspi.change >= 0 ? "+" : ""}
                      {marketData.aspi.change.toFixed(2)} (
                      {marketData.aspi.percentChange.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-[#8a8a8a]">No data available</span>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#8a8a8a]">
                Today&apos;s Top Gainer
              </CardTitle>
            </CardHeader>
            <CardContent>
              {marketLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-[#5eead4]" />
              ) : topGainer ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-[#f5f5f5]">
                      {topGainer.symbol}
                    </p>
                    <p className="text-sm text-[#8a8a8a]">{topGainer.name}</p>
                  </div>
                  <Badge variant="success">
                    +{(topGainer.percentChange ?? 0).toFixed(2)}%
                  </Badge>
                </div>
              ) : (
                <span className="text-[#8a8a8a]">No data</span>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#8a8a8a]">
                Today&apos;s Top Loser
              </CardTitle>
            </CardHeader>
            <CardContent>
              {marketLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-[#5eead4]" />
              ) : topLoser ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-[#f5f5f5]">
                      {topLoser.symbol}
                    </p>
                    <p className="text-sm text-[#8a8a8a]">{topLoser.name}</p>
                  </div>
                  <Badge variant="destructive">
                    {(topLoser.percentChange ?? 0).toFixed(2)}%
                  </Badge>
                </div>
              ) : (
                <span className="text-[#8a8a8a]">No data</span>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-[#f5f5f5] mb-4">
          Quick Actions
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/transactions">
            <Card className="cursor-pointer hover:border-[#5eead4]/50 transition-colors h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#4ade80]/10">
                    <TrendingUp className="h-5 w-5 text-[#4ade80]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#f5f5f5]">
                      Add Transaction
                    </p>
                    <p className="text-sm text-[#8a8a8a]">Record a new trade</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/portfolio">
            <Card className="cursor-pointer hover:border-[#5eead4]/50 transition-colors h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#5eead4]/10">
                    <Briefcase className="h-5 w-5 text-[#5eead4]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#f5f5f5]">
                      Manage Portfolio
                    </p>
                    <p className="text-sm text-[#8a8a8a]">
                      View & edit holdings
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/analytics">
            <Card className="cursor-pointer hover:border-[#5eead4]/50 transition-colors h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#fbbf24]/10">
                    <BarChart3 className="h-5 w-5 text-[#fbbf24]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#f5f5f5]">View Analytics</p>
                    <p className="text-sm text-[#8a8a8a]">
                      Performance insights
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Helper to avoid recalculating on every render
function useMeta<T>(fn: () => T, deps: React.DependencyList): T {
  return useMemo(fn, deps);
}
