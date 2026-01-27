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
  PiggyBank,
} from "lucide-react";
import { useHoldings, useMarketData } from "@/lib/hooks";
import { LastUpdated } from "@/components/last-updated";
import { TradingViewWidget } from "@/components/tradingview-widget";
import {
  calculatePortfolioTotals,
  enrichHoldingsWithPrices,
} from "@/lib/rule-engine";
import { useMemo } from "react";
import { SavingsCard } from "@/components/savings/savings-card";

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
        <CardTitle className="text-sm font-medium text-zinc-500">
          {title}
        </CardTitle>
        <div className="p-2 rounded-lg bg-zinc-800">
          <Icon className="h-4 w-4 text-zinc-400" />
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
              {prefix}
              {value}
            </div>
            {change !== undefined && (
              <p className="text-xs mt-1 flex items-center gap-1">
                {isPositive ? (
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span
                  className={isPositive ? "text-emerald-500" : "text-red-500"}
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
  const {
    data: marketData,
    isLoading: marketLoading,
    dataUpdatedAt,
  } = useMarketData();

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
  const totals = useMemo(
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
          <h1 className="text-3xl font-bold text-zinc-50">Dashboard</h1>
          <p className="text-zinc-500 mt-1">
            Your portfolio overview and market summary
          </p>
          <LastUpdated timestamp={dataUpdatedAt} className="mt-1" />
        </div>
        <Badge variant="outline" className="gap-2">
          <span className="relative flex h-2 w-2">
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full ${marketOpen ? "bg-emerald-500" : "bg-red-500"} opacity-75`}
            ></span>
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${marketOpen ? "bg-emerald-500" : "bg-red-500"}`}
            ></span>
          </span>
          {marketOpen ? "Market Open" : "Market Closed"}
        </Badge>
      </div>

      {/* Portfolio Stats */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-50 mb-4">
          Portfolio Overview
        </h2>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
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
          <SavingsCard />
        </div>
      </div>

      {/* Market Overview */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-50 mb-4">
          Market Overview
        </h2>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {/* ASPI Index Card */}
          <StatCard
            title="ASPI Index"
            value={marketData?.aspi?.index.toFixed(2) ?? "0.00"}
            change={marketData?.aspi?.change}
            changePercent={marketData?.aspi?.percentChange}
            icon={Activity}
            isLoading={marketLoading}
          />

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500">
                Today&apos;s Top Gainer
              </CardTitle>
            </CardHeader>
            <CardContent>
              {marketLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              ) : topGainer ? (
                <div className="flex items-center justify-between">
                  <div>
                    <Link
                      href={`/portfolio/${topGainer.symbol}`}
                      className="block hover:text-blue-500 hover:underline transition-colors"
                    >
                      <p className="text-lg font-semibold text-zinc-50">
                        {topGainer.symbol}
                      </p>
                    </Link>
                    <p className="text-sm text-zinc-500">{topGainer.name}</p>
                  </div>
                  <Badge variant="success">
                    +{(topGainer.percentChange ?? 0).toFixed(2)}%
                  </Badge>
                </div>
              ) : (
                <span className="text-zinc-500">No data</span>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500">
                Today&apos;s Top Loser
              </CardTitle>
            </CardHeader>
            <CardContent>
              {marketLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              ) : topLoser ? (
                <div className="flex items-center justify-between">
                  <div>
                    <Link
                      href={`/portfolio/${topLoser.symbol}`}
                      className="block hover:text-red-500 hover:underline transition-colors"
                    >
                      <p className="text-lg font-semibold text-zinc-50">
                        {topLoser.symbol}
                      </p>
                    </Link>
                    <p className="text-sm text-zinc-500">{topLoser.name}</p>
                  </div>
                  <Badge variant="destructive">
                    {(topLoser.percentChange ?? 0).toFixed(2)}%
                  </Badge>
                </div>
              ) : (
                <span className="text-zinc-500">No data</span>
              )}
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 col-span-1 md:col-span-2 lg:col-span-3 h-[500px]">
            <CardHeader className="pb-0">
              <CardTitle className="text-sm font-medium text-zinc-500">
                All Share Price Index (ASPI)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[430px] p-2">
              <TradingViewWidget symbol="CSELK:ASI" />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-50 mb-4">
          Quick Actions
        </h2>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/transactions">
            <Card className="cursor-pointer hover:border-blue-500/50 transition-colors h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-50">Add Transaction</p>
                    <p className="text-sm text-zinc-500">Record a new trade</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/portfolio">
            <Card className="cursor-pointer hover:border-blue-500/50 transition-colors h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Briefcase className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-50">Manage Portfolio</p>
                    <p className="text-sm text-zinc-500">
                      View & edit holdings
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/analytics">
            <Card className="cursor-pointer hover:border-blue-500/50 transition-colors h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <BarChart3 className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-50">View Analytics</p>
                    <p className="text-sm text-zinc-500">
                      Performance insights
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/savings">
            <Card className="cursor-pointer hover:border-blue-500/50 transition-colors h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <PiggyBank className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-50">Manage Savings</p>
                    <p className="text-sm text-zinc-500">
                      Track cash & deposits
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
