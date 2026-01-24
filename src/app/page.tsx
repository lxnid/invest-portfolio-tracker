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
        <CardTitle className="text-sm font-medium text-[#8a8a8a]">
          {title}
        </CardTitle>
        <div className="p-2 rounded-lg bg-[#333333]">
          <Icon className="h-4 w-4 text-[#a8a8a8]" />
        </div>
      </CardHeader>
      <CardContent>
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
            <span className={isPositive ? "text-[#4ade80]" : "text-[#f87171]"}>
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
          <h1 className="text-3xl font-bold text-[#f5f5f5]">Dashboard</h1>
          <p className="text-[#8a8a8a] mt-1">
            Your portfolio overview and market summary
          </p>
        </div>
        <Badge variant="outline" className="gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f87171] opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#f87171]"></span>
          </span>
          Market Closed
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
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-[#f5f5f5]">
                  {mockData.asi.value.toLocaleString()}
                </span>
                <div className="flex items-center gap-1 mb-1">
                  <TrendingUp className="h-4 w-4 text-[#4ade80]" />
                  <span className="text-[#4ade80] text-sm font-medium">
                    +{mockData.asi.change} ({mockData.asi.changePercent}%)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#8a8a8a]">
                Today&apos;s Top Gainer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-[#f5f5f5]">
                    LOLC.N0000
                  </p>
                  <p className="text-sm text-[#8a8a8a]">LOLC Holdings PLC</p>
                </div>
                <Badge variant="success">+5.25%</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#8a8a8a]">
                Today&apos;s Top Loser
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-[#f5f5f5]">
                    JKH.N0000
                  </p>
                  <p className="text-sm text-[#8a8a8a]">John Keells Holdings</p>
                </div>
                <Badge variant="destructive">-2.15%</Badge>
              </div>
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
          <Card className="cursor-pointer hover:border-[#5eead4]/50 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#4ade80]/10">
                  <TrendingUp className="h-5 w-5 text-[#4ade80]" />
                </div>
                <div>
                  <p className="font-medium text-[#f5f5f5]">Add Transaction</p>
                  <p className="text-sm text-[#8a8a8a]">Record a new trade</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-[#5eead4]/50 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#5eead4]/10">
                  <Briefcase className="h-5 w-5 text-[#5eead4]" />
                </div>
                <div>
                  <p className="font-medium text-[#f5f5f5]">Manage Portfolio</p>
                  <p className="text-sm text-[#8a8a8a]">View & edit holdings</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-[#5eead4]/50 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#fbbf24]/10">
                  <BarChart3 className="h-5 w-5 text-[#fbbf24]" />
                </div>
                <div>
                  <p className="font-medium text-[#f5f5f5]">View Analytics</p>
                  <p className="text-sm text-[#8a8a8a]">Performance insights</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
