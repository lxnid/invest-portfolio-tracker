"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Target,
  Loader2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
} from "recharts";
import { useHoldings, useMarketData, usePortfolioHistory } from "@/lib/hooks";
import {
  enrichHoldingsWithPrices,
  calculatePortfolioTotals,
} from "@/lib/rule-engine";

const SECTOR_COLORS = [
  "#5eead4",
  "#4ade80",
  "#a78bfa",
  "#fbbf24",
  "#f472b6",
  "#60a5fa",
];

export default function AnalyticsPage() {
  const { data: holdings, isLoading: holdingsLoading } = useHoldings();
  const { data: marketData, isLoading: marketLoading } = useMarketData();
  const { data: historyData, isLoading: historyLoading } =
    usePortfolioHistory();

  // Build price map and enrich holdings
  const enrichedHoldings = useMemo(() => {
    if (!holdings || !marketData?.allStocks) return [];
    const priceMap = new Map<string, number>();
    for (const stock of marketData.allStocks) {
      priceMap.set(stock.symbol, stock.price);
    }
    return enrichHoldingsWithPrices(holdings, priceMap);
  }, [holdings, marketData]);

  const totals = useMemo(
    () => calculatePortfolioTotals(enrichedHoldings),
    [enrichedHoldings],
  );

  // Calculate sector allocation from holdings
  const sectorData = useMemo(() => {
    if (enrichedHoldings.length === 0) return [];

    const sectorTotals = new Map<string, number>();
    for (const holding of enrichedHoldings) {
      const sector = holding.stock.sector || "Other";
      const value = holding.currentValue || parseFloat(holding.totalInvested);
      sectorTotals.set(sector, (sectorTotals.get(sector) || 0) + value);
    }

    const result = Array.from(sectorTotals.entries())
      .map(([name, value], i) => ({
        name,
        value: Math.round((value / totals.totalValue) * 100),
        color: SECTOR_COLORS[i % SECTOR_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);

    return result;
  }, [enrichedHoldings, totals.totalValue]);

  // Top and under performers
  const { topPerformers, underPerformers } = useMemo(() => {
    const sorted = [...enrichedHoldings].sort(
      (a, b) => (b.profitLossPercent || 0) - (a.profitLossPercent || 0),
    );
    return {
      topPerformers: sorted
        .filter((h) => (h.profitLossPercent || 0) > 0)
        .slice(0, 3),
      underPerformers: sorted.filter((h) => (h.profitLossPercent || 0) < 0),
    };
  }, [enrichedHoldings]);

  // ASPI comparison
  const aspiChange = marketData?.aspi?.percentChange || 0;
  // Simple subtraction: Portfolio P/L% - ASPI % change
  const outperformance = (totals.profitLossPercent || 0) - aspiChange;

  const isLoading = holdingsLoading || marketLoading || historyLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#f5f5f5]">Analytics</h1>
        <p className="text-[#8a8a8a] mt-1">
          Performance insights and portfolio analysis
        </p>
      </div>

      {/* Performance Summary */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-[#8a8a8a]">Total Return</p>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin mt-1" />
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <p
                  className={`text-2xl font-bold ${
                    totals.profitLossPercent >= 0
                      ? "text-[#4ade80]"
                      : "text-[#f87171]"
                  }`}
                >
                  {totals.profitLossPercent >= 0 ? "+" : ""}
                  {totals.profitLossPercent.toFixed(2)}%
                </p>
                {totals.profitLossPercent >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-[#4ade80]" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-[#f87171]" />
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-[#8a8a8a]">Total P/L</p>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin mt-1" />
            ) : (
              <p
                className={`text-2xl font-bold mt-1 ${
                  totals.profitLoss >= 0 ? "text-[#4ade80]" : "text-[#f87171]"
                }`}
              >
                {totals.profitLoss >= 0 ? "+" : ""}LKR{" "}
                {totals.profitLoss.toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-[#8a8a8a]">Portfolio Value</p>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin mt-1" />
            ) : (
              <p className="text-2xl font-bold text-[#f5f5f5] mt-1">
                LKR {totals.totalValue.toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-[#8a8a8a]">vs ASPI</p>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin mt-1" />
            ) : (
              <>
                <div className="flex items-center gap-2 mt-1">
                  <p
                    className={`text-2xl font-bold ${
                      outperformance >= 0 ? "text-[#4ade80]" : "text-[#f87171]"
                    }`}
                  >
                    {outperformance >= 0 ? "+" : ""}
                    {outperformance.toFixed(2)}%
                  </p>
                  <Target className="h-5 w-5 text-[#5eead4]" />
                </div>
                <p className="text-xs text-[#8a8a8a] mt-1">
                  {outperformance >= 0 ? "Outperforming" : "Underperforming"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Invested Capital Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#60a5fa]" />
              Invested Capital History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-[#5eead4]" />
                </div>
              ) : !historyData || historyData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-[#8a8a8a]">
                  No transaction history available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyData}>
                    <XAxis
                      dataKey="month"
                      stroke="#666666"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#666666"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) =>
                        `${(value / 1000000).toFixed(1)}M`
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#262626",
                        border: "1px solid #3a3a3a",
                        borderRadius: "8px",
                        color: "#f5f5f5",
                      }}
                      formatter={(value) => [
                        `LKR ${(value ?? 0).toLocaleString()}`,
                        "Value",
                      ]}
                    />
                    <defs>
                      <linearGradient
                        id="colorValue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#5eead4"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#5eead4"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#5eead4"
                      strokeWidth={2}
                      dot={false}
                      fill="url(#colorValue)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sector Allocation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-[#a78bfa]" />
              Sector Allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-[#5eead4]" />
              </div>
            ) : sectorData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-[#8a8a8a]">
                No holdings to analyze
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="h-48 w-48 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={sectorData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {sectorData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#262626",
                          border: "1px solid #3a3a3a",
                          borderRadius: "8px",
                          color: "#f5f5f5",
                        }}
                        formatter={(value) => [`${value ?? 0}%`, "Allocation"]}
                      />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-3">
                  {sectorData.map((sector) => (
                    <div key={sector.name} className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: sector.color }}
                      />
                      <span className="text-[#a8a8a8] flex-1">
                        {sector.name}
                      </span>
                      <span className="font-mono text-[#f5f5f5] font-medium">
                        {sector.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top & Under Performers */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#4ade80]" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-[#5eead4]" />
              </div>
            ) : topPerformers.length === 0 ? (
              <p className="text-[#8a8a8a] text-center py-4">
                No profitable positions yet
              </p>
            ) : (
              topPerformers.map((stock, index) => (
                <div
                  key={stock.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#2a2a2a] border border-[#333333]"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[#666666] font-mono text-sm">
                      0{index + 1}
                    </span>
                    <span className="font-semibold text-[#f5f5f5]">
                      {stock.stock.symbol}
                    </span>
                  </div>
                  <Badge variant="success">
                    +{(stock.profitLossPercent || 0).toFixed(2)}%
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-[#f87171]" />
              Under Performers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-[#5eead4]" />
              </div>
            ) : underPerformers.length === 0 ? (
              <p className="text-[#8a8a8a] text-center py-4">
                No underperformers — great job!
              </p>
            ) : (
              underPerformers.map((stock, index) => (
                <div
                  key={stock.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#2a2a2a] border border-[#333333]"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[#666666] font-mono text-sm">
                      0{index + 1}
                    </span>
                    <span className="font-semibold text-[#f5f5f5]">
                      {stock.stock.symbol}
                    </span>
                  </div>
                  <Badge variant="destructive">
                    {(stock.profitLossPercent || 0).toFixed(2)}%
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Benchmark Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Benchmark Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#5eead4]" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[#a8a8a8]">Your Portfolio</span>
                <span
                  className={`font-bold ${
                    totals.profitLossPercent >= 0
                      ? "text-[#4ade80]"
                      : "text-[#f87171]"
                  }`}
                >
                  {totals.profitLossPercent >= 0 ? "+" : ""}
                  {totals.profitLossPercent.toFixed(2)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#333333] overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-[#5eead4] to-[#4ade80] rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, Math.max(0, (totals.profitLossPercent / 50) * 100 + 50))}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#a8a8a8]">ASPI Index (YTD est.)</span>
                <span className="font-bold text-[#f5f5f5]">
                  +{(aspiChange * 10).toFixed(2)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#333333] overflow-hidden">
                <div
                  className="h-full bg-[#666666] rounded-full"
                  style={{
                    width: `${Math.min(100, Math.max(0, ((aspiChange * 10) / 50) * 100 + 50))}%`,
                  }}
                />
              </div>
              <p className="text-sm text-[#8a8a8a] pt-2">
                {outperformance >= 0 ? (
                  <>
                    Your portfolio is outperforming the ASPI benchmark by{" "}
                    <span className="text-[#4ade80] font-medium">
                      {outperformance.toFixed(2)}%
                    </span>
                    .
                  </>
                ) : (
                  <>
                    Your portfolio is underperforming the ASPI benchmark by{" "}
                    <span className="text-[#f87171] font-medium">
                      {Math.abs(outperformance).toFixed(2)}%
                    </span>
                    .
                  </>
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
