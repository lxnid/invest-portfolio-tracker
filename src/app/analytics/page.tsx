"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Target,
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

// Mock performance data
const performanceData = [
  { month: "Aug", value: 1850000 },
  { month: "Sep", value: 1920000 },
  { month: "Oct", value: 2050000 },
  { month: "Nov", value: 1980000 },
  { month: "Dec", value: 2180000 },
  { month: "Jan", value: 2450000 },
];

const sectorData = [
  { name: "Financial", value: 45, color: "#60a5fa" },
  { name: "Diversified", value: 25, color: "#5eead4" },
  { name: "Manufacturing", value: 18, color: "#a78bfa" },
  { name: "Hotels", value: 12, color: "#fbbf24" },
];

const topPerformers = [
  { symbol: "LOLC.N0000", return: 24.89 },
  { symbol: "COMB.N0000", return: 14.21 },
  { symbol: "HNB.N0000", return: 7.16 },
];

const underPerformers = [{ symbol: "JKH.N0000", return: -4.31 }];

export default function AnalyticsPage() {
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
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-[#8a8a8a]">This Month</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-2xl font-bold text-[#4ade80]">+12.38%</p>
              <TrendingUp className="h-5 w-5 text-[#4ade80]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-[#8a8a8a]">Last Month</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-2xl font-bold text-[#f87171]">-3.43%</p>
              <TrendingDown className="h-5 w-5 text-[#f87171]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-[#8a8a8a]">Year to Date</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-2xl font-bold text-[#4ade80]">+16.67%</p>
              <TrendingUp className="h-5 w-5 text-[#4ade80]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-[#8a8a8a]">vs ASI</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-2xl font-bold text-[#4ade80]">+8.42%</p>
              <Target className="h-5 w-5 text-[#5eead4]" />
            </div>
            <p className="text-xs text-[#8a8a8a] mt-1">Outperforming</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Portfolio Value Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#5eead4]" />
              Portfolio Value Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
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
                    formatter={(value: number) => [
                      `LKR ${value.toLocaleString()}`,
                      "Value",
                    ]}
                  />
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5eead4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#5eead4" stopOpacity={0} />
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
            <div className="flex items-center gap-8">
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
                      formatter={(value: number) => [`${value}%`, "Allocation"]}
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
                    <span className="text-[#a8a8a8] flex-1">{sector.name}</span>
                    <span className="font-mono text-[#f5f5f5] font-medium">
                      {sector.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
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
            {topPerformers.map((stock, index) => (
              <div
                key={stock.symbol}
                className="flex items-center justify-between p-3 rounded-lg bg-[#333333]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[#8a8a8a] font-mono text-sm">
                    #{index + 1}
                  </span>
                  <span className="font-semibold text-[#f5f5f5]">
                    {stock.symbol}
                  </span>
                </div>
                <Badge variant="success">+{stock.return.toFixed(2)}%</Badge>
              </div>
            ))}
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
            {underPerformers.length > 0 ? (
              underPerformers.map((stock, index) => (
                <div
                  key={stock.symbol}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#333333]"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[#8a8a8a] font-mono text-sm">
                      #{index + 1}
                    </span>
                    <span className="font-semibold text-[#f5f5f5]">
                      {stock.symbol}
                    </span>
                  </div>
                  <Badge variant="destructive">
                    {stock.return.toFixed(2)}%
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-[#8a8a8a] text-center py-4">
                No underperformers — great job!
              </p>
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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[#a8a8a8]">Your Portfolio</span>
              <span className="font-bold text-[#4ade80]">+16.67%</span>
            </div>
            <div className="h-3 rounded-full bg-[#333333] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#5eead4] to-[#2dd4bf] rounded-full"
                style={{ width: "67%" }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#a8a8a8]">
                ASPI (All Share Price Index)
              </span>
              <span className="font-bold text-[#f5f5f5]">+8.25%</span>
            </div>
            <div className="h-3 rounded-full bg-[#333333] overflow-hidden">
              <div
                className="h-full bg-[#60a5fa] rounded-full"
                style={{ width: "33%" }}
              />
            </div>
            <p className="text-sm text-[#8a8a8a] pt-2">
              Your portfolio is outperforming the ASI benchmark by{" "}
              <span className="text-[#4ade80] font-medium">8.42%</span> this
              year.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
