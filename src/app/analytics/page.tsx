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
  { name: "Financial", value: 45, color: "#00d4ff" },
  { name: "Diversified", value: 25, color: "#00ff88" },
  { name: "Manufacturing", value: 18, color: "#a855f7" },
  { name: "Hotels", value: 12, color: "#ffc107" },
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
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Analytics
        </h1>
        <p className="text-neutral-500 mt-1">
          Performance insights and portfolio analysis
        </p>
      </div>

      {/* Performance Summary */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-neutral-500 uppercase tracking-wider">
              This Month
            </p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-2xl font-bold text-[#00ff88]">+12.38%</p>
              <TrendingUp className="h-5 w-5 text-[#00ff88]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-neutral-500 uppercase tracking-wider">
              Last Month
            </p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-2xl font-bold text-[#ff4757]">-3.43%</p>
              <TrendingDown className="h-5 w-5 text-[#ff4757]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-neutral-500 uppercase tracking-wider">
              Year to Date
            </p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-2xl font-bold text-[#00ff88]">+16.67%</p>
              <TrendingUp className="h-5 w-5 text-[#00ff88]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-neutral-500 uppercase tracking-wider">
              vs ASI
            </p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-2xl font-bold text-[#00ff88]">+8.42%</p>
              <Target className="h-5 w-5 text-[#00d4ff]" />
            </div>
            <p className="text-xs text-neutral-500 mt-1">Outperforming</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Portfolio Value Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#00d4ff]" />
              Portfolio Value Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <XAxis
                    dataKey="month"
                    stroke="#525252"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#525252"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) =>
                      `${(value / 1000000).toFixed(1)}M`
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0a0a0a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "#ffffff",
                    }}
                    formatter={(value: number) => [
                      `LKR ${value.toLocaleString()}`,
                      "Value",
                    ]}
                  />
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#00d4ff"
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
              <PieChart className="h-5 w-5 text-[#a855f7]" />
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
                        backgroundColor: "#0a0a0a",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                        color: "#ffffff",
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
                    <span className="text-neutral-400 flex-1">
                      {sector.name}
                    </span>
                    <span className="font-mono text-white font-medium">
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
              <TrendingUp className="h-5 w-5 text-[#00ff88]" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topPerformers.map((stock, index) => (
              <div
                key={stock.symbol}
                className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-neutral-600 font-mono text-sm">
                    0{index + 1}
                  </span>
                  <span className="font-semibold text-white">
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
              <TrendingDown className="h-5 w-5 text-[#ff4757]" />
              Under Performers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {underPerformers.length > 0 ? (
              underPerformers.map((stock, index) => (
                <div
                  key={stock.symbol}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-600 font-mono text-sm">
                      0{index + 1}
                    </span>
                    <span className="font-semibold text-white">
                      {stock.symbol}
                    </span>
                  </div>
                  <Badge variant="destructive">
                    {stock.return.toFixed(2)}%
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-neutral-500 text-center py-4">
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
              <span className="text-neutral-400 uppercase text-xs tracking-wider">
                Your Portfolio
              </span>
              <span className="font-bold text-[#00ff88]">+16.67%</span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#00d4ff] to-[#00ff88] rounded-full"
                style={{ width: "67%" }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400 uppercase text-xs tracking-wider">
                ASPI Index
              </span>
              <span className="font-bold text-white">+8.25%</span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
              <div
                className="h-full bg-neutral-600 rounded-full"
                style={{ width: "33%" }}
              />
            </div>
            <p className="text-sm text-neutral-500 pt-2">
              Your portfolio is outperforming the ASI benchmark by{" "}
              <span className="text-[#00ff88] font-medium">8.42%</span> this
              year.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
