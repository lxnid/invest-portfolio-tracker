import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Briefcase,
  BarChart3,
  Activity,
} from "lucide-react";

// This will be replaced with real data from CSE API and database
const mockData = {
  portfolioValue: 2450000,
  dayChange: 12500,
  dayChangePercent: 0.51,
  totalInvested: 2100000,
  totalProfitLoss: 350000,
  totalProfitLossPercent: 16.67,
  holdingsCount: 8,
  asi: {
    value: 19826.57,
    change: 21.77,
    changePercent: 0.11,
  },
};

function StatCard({
  title,
  value,
  change,
  changePercent,
  icon: Icon,
  prefix = "",
}: {
  title: string;
  value: string;
  change?: number;
  changePercent?: number;
  icon: React.ElementType;
  prefix?: string;
}) {
  const isPositive = (change ?? 0) >= 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400">
          {title}
        </CardTitle>
        <Icon className="h-5 w-5 text-zinc-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-zinc-100">
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
            <span className={isPositive ? "text-emerald-500" : "text-red-500"}>
              {isPositive ? "+" : ""}
              {change.toLocaleString()} ({changePercent?.toFixed(2)}%)
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100">Dashboard</h1>
          <p className="text-zinc-400 mt-1">
            Your portfolio overview and market summary
          </p>
        </div>
        <Badge variant="outline" className="gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
          </span>
          Market Closed
        </Badge>
      </div>

      {/* Portfolio Stats */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">
          Portfolio Overview
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Portfolio Value"
            value={mockData.portfolioValue.toLocaleString()}
            change={mockData.dayChange}
            changePercent={mockData.dayChangePercent}
            icon={DollarSign}
            prefix="LKR "
          />
          <StatCard
            title="Total Invested"
            value={mockData.totalInvested.toLocaleString()}
            icon={Briefcase}
            prefix="LKR "
          />
          <StatCard
            title="Total P/L"
            value={mockData.totalProfitLoss.toLocaleString()}
            change={mockData.totalProfitLoss}
            changePercent={mockData.totalProfitLossPercent}
            icon={BarChart3}
            prefix="LKR "
          />
          <StatCard
            title="Holdings"
            value={mockData.holdingsCount.toString()}
            icon={Activity}
          />
        </div>
      </div>

      {/* Market Overview */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">
          Market Overview
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border-emerald-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">
                All Share Price Index (ASPI)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-zinc-100">
                  {mockData.asi.value.toLocaleString()}
                </span>
                <div className="flex items-center gap-1 mb-1">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <span className="text-emerald-500 text-sm font-medium">
                    +{mockData.asi.change} ({mockData.asi.changePercent}%)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">
                Today&apos;s Top Gainer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-zinc-100">
                    LOLC.N0000
                  </p>
                  <p className="text-sm text-zinc-400">LOLC Holdings PLC</p>
                </div>
                <Badge variant="success">+5.25%</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">
                Today&apos;s Top Loser
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-zinc-100">
                    JKH.N0000
                  </p>
                  <p className="text-sm text-zinc-400">John Keells Holdings</p>
                </div>
                <Badge variant="destructive">-2.15%</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">
          Quick Actions
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="cursor-pointer hover:border-emerald-500/50 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="font-medium text-zinc-100">Add Transaction</p>
                  <p className="text-sm text-zinc-400">Record a new trade</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-emerald-500/50 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-500/20">
                  <Briefcase className="h-5 w-5 text-teal-500" />
                </div>
                <div>
                  <p className="font-medium text-zinc-100">Manage Portfolio</p>
                  <p className="text-sm text-zinc-400">View & edit holdings</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-emerald-500/50 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <BarChart3 className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="font-medium text-zinc-100">View Analytics</p>
                  <p className="text-sm text-zinc-400">Performance insights</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
