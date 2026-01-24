"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Calendar,
} from "lucide-react";

// Mock analytics data - will be replaced with real calculations
const mockAnalytics = {
  performanceData: [
    { month: "Aug", value: 1850000 },
    { month: "Sep", value: 1920000 },
    { month: "Oct", value: 2100000 },
    { month: "Nov", value: 2050000 },
    { month: "Dec", value: 2280000 },
    { month: "Jan", value: 2450000 },
  ],
  sectorAllocation: [
    { sector: "Banking", value: 45, color: "#10b981" },
    { sector: "Diversified", value: 28, color: "#14b8a6" },
    { sector: "Manufacturing", value: 15, color: "#f59e0b" },
    { sector: "Hotels", value: 12, color: "#8b5cf6" },
  ],
  topPerformers: [
    { symbol: "LOLC.N0000", name: "LOLC Holdings", gain: 24.89 },
    { symbol: "COMB.N0000", name: "Commercial Bank", gain: 14.21 },
    { symbol: "HNB.N0000", name: "Hatton National Bank", gain: 7.16 },
  ],
  worstPerformers: [
    { symbol: "JKH.N0000", name: "John Keells Holdings", loss: -4.31 },
  ],
  monthlyReturns: {
    current: 7.46,
    previous: 10.98,
    ytd: 16.67,
  },
};

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100">Analytics</h1>
          <p className="text-zinc-400 mt-1">
            Performance insights and portfolio analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-2">
            <Calendar className="h-3 w-3" />
            Last 6 months
          </Badge>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <p className="text-3xl font-bold text-emerald-400">
                +{mockAnalytics.monthlyReturns.current}%
              </p>
            </div>
            <p className="text-sm text-zinc-500 mt-1">
              LKR {(2450000 * 0.0746).toLocaleString()} gained
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Last Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <p className="text-3xl font-bold text-zinc-100">
                +{mockAnalytics.monthlyReturns.previous}%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Year to Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <p className="text-3xl font-bold text-zinc-100">
                +{mockAnalytics.monthlyReturns.ytd}%
              </p>
            </div>
            <p className="text-sm text-zinc-500 mt-1">vs ASI: +12.4%</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Portfolio Performance Chart Placeholder */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Portfolio Value Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2 px-4">
              {mockAnalytics.performanceData.map((data, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-2 flex-1"
                >
                  <div
                    className="w-full bg-gradient-to-t from-emerald-500 to-teal-500 rounded-t-sm transition-all hover:opacity-80"
                    style={{
                      height: `${((data.value - 1800000) / 700000) * 100}%`,
                      minHeight: "20px",
                    }}
                  />
                  <span className="text-xs text-zinc-500">{data.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sector Allocation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Sector Allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              {/* Pie Chart Placeholder */}
              <div className="relative h-48 w-48 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="rotate-[-90deg]">
                  {
                    mockAnalytics.sectorAllocation.reduce<{
                      elements: React.ReactNode[];
                      offset: number;
                    }>(
                      (acc, sector, i) => {
                        const circumference = 2 * Math.PI * 40;
                        const strokeDasharray = `${(sector.value / 100) * circumference} ${circumference}`;
                        const strokeDashoffset =
                          -acc.offset * (circumference / 100);

                        acc.elements.push(
                          <circle
                            key={i}
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke={sector.color}
                            strokeWidth="20"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all"
                          />,
                        );
                        acc.offset += sector.value;
                        return acc;
                      },
                      { elements: [], offset: 0 },
                    ).elements
                  }
                </svg>
              </div>

              {/* Legend */}
              <div className="space-y-3 flex-1">
                {mockAnalytics.sectorAllocation.map((sector, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: sector.color }}
                      />
                      <span className="text-sm text-zinc-300">
                        {sector.sector}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-zinc-100">
                      {sector.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top/Worst Performers */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-400">
              <TrendingUp className="h-5 w-5" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockAnalytics.topPerformers.map((stock, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20"
                >
                  <div>
                    <p className="font-medium text-zinc-100">{stock.symbol}</p>
                    <p className="text-sm text-zinc-400">{stock.name}</p>
                  </div>
                  <Badge variant="success">+{stock.gain.toFixed(2)}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <TrendingDown className="h-5 w-5" />
              Underperformers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockAnalytics.worstPerformers.map((stock, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/20"
                >
                  <div>
                    <p className="font-medium text-zinc-100">{stock.symbol}</p>
                    <p className="text-sm text-zinc-400">{stock.name}</p>
                  </div>
                  <Badge variant="destructive">{stock.loss.toFixed(2)}%</Badge>
                </div>
              ))}
              {mockAnalytics.worstPerformers.length === 1 && (
                <p className="text-center text-zinc-500 py-4">
                  Only 1 underperforming stock - great job!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ASI Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Benchmark Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-4 rounded-lg bg-zinc-800/50">
              <p className="text-sm text-zinc-400 mb-2">Your Portfolio</p>
              <p className="text-3xl font-bold text-emerald-400">+16.67%</p>
              <p className="text-xs text-zinc-500 mt-1">YTD Return</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-zinc-800/50">
              <p className="text-sm text-zinc-400 mb-2">ASPI Index</p>
              <p className="text-3xl font-bold text-zinc-100">+12.40%</p>
              <p className="text-xs text-zinc-500 mt-1">YTD Return</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <p className="text-sm text-zinc-400 mb-2">Alpha Generated</p>
              <p className="text-3xl font-bold text-emerald-400">+4.27%</p>
              <p className="text-xs text-emerald-400 mt-1">
                Beating the market!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
