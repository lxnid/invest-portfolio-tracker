"use client";

import { useState, useEffect, use, memo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Target,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Building2,
  Briefcase,
  History,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { TradingViewWidget } from "@/components/tradingview-widget";
import { TradingViewSymbolInfo } from "@/components/tradingview-symbol-info";
import { ResizableDiv } from "@/components/ui/resizable-div";
import { useHoldings, useMarketData } from "@/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStockDetails, useUpdateStock } from "@/lib/hooks";
import {
  formatCurrency,
  formatPercentage,
  formatCompactCurrency,
} from "@/lib/cse-api";
import { LastUpdated } from "@/components/last-updated";

// Helper components
const StatRow = ({
  label,
  value,
  className = "",
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) => (
  <div className={`flex justify-between items-center py-2 ${className}`}>
    <span className="text-sm text-[#8a8a8a]">{label}</span>
    <div className="text-sm font-medium text-[#f5f5f5] text-right">{value}</div>
  </div>
);

const PriceChange = ({
  change,
  percent,
}: {
  change: number;
  percent: number;
}) => {
  const isPositive = change >= 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  const colorClass = isPositive ? "text-[#4ade80]" : "text-[#f87171]";

  return (
    <div className={`flex items-center gap-1 ${colorClass}`}>
      <Icon className="h-4 w-4" />
      <span className="font-mono font-bold">
        {isPositive ? "+" : ""}
        {change.toFixed(2)} ({percent.toFixed(2)}%)
      </span>
    </div>
  );
};

export default function StockDetailPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = use(params);
  const router = useRouter();

  const {
    data: stock,
    isLoading,
    error,
    dataUpdatedAt,
  } = useStockDetails(symbol);
  const updateStock = useUpdateStock();

  const [isEditingSector, setIsEditingSector] = useState(false);
  const [sectorInput, setSectorInput] = useState("");

  useEffect(() => {
    if (stock?.sector) {
      setSectorInput(stock.sector);
    }
  }, [stock]);

  const handleSaveSector = async () => {
    try {
      await updateStock.mutateAsync({ symbol, sector: sectorInput });
      setIsEditingSector(false);
    } catch (err) {
      console.error("Failed to update sector", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#5eead4]" />
        <p className="text-[#8a8a8a]">Loading stock data...</p>
      </div>
    );
  }

  if (error || !stock) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <AlertCircle className="h-10 w-10 text-[#f87171]" />
        <h2 className="text-xl font-bold text-[#f5f5f5]">Stock Not Found</h2>
        <p className="text-[#8a8a8a]">We couldn't find data for {symbol}</p>
        <button
          onClick={() => router.back()}
          className="text-[#5eead4] hover:underline mt-2"
        >
          Go Back
        </button>
      </div>
    );
  }

  const { marketData, position, performance, transactions } = stock;
  const hasPosition = !!position;

  // Construct TradingView symbol carefully
  // The correct exchange prefix for TradingView is "CSELK" for Colombo Stock Exchange
  // Example: CSELK:HNB.N0000
  const tvSymbol = symbol.includes("CSELK:")
    ? symbol
    : `CSELK:${symbol.includes(".N") || symbol.includes(".X") ? symbol : `${symbol}.N0000`}`;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Navigation */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-[#a8a8a8] hover:text-[#5eead4] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Portfolio</span>
      </button>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#333333] pb-6">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-xl bg-[#262626] border border-[#333333] flex items-center justify-center overflow-hidden shrink-0">
            {stock.logoPath ? (
              <img
                src={stock.logoPath}
                alt={stock.symbol}
                className="h-12 w-12 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <Building2 className="h-8 w-8 text-[#5eead4]" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-black text-[#f5f5f5] tracking-tight">
                {stock.symbol}
              </h1>
              {isEditingSector ? (
                <div className="flex items-center gap-1 animate-in fade-in slide-in-from-left-2">
                  <Input
                    value={sectorInput}
                    onChange={(e) => setSectorInput(e.target.value)}
                    className="h-7 w-32 py-0 text-xs bg-[#262626] border-[#333333]"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveSector}
                    disabled={updateStock.isPending}
                    className="p-1 text-[#4ade80] hover:bg-[#333333] rounded"
                  >
                    {updateStock.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Check className="h-3 w-3" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingSector(false);
                      setSectorInput(stock.sector || "");
                    }}
                    className="p-1 text-[#f87171] hover:bg-[#333333] rounded"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="group flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-[#333333] hidden md:inline-flex"
                  >
                    {stock.sector || "Unknown Sector"}
                  </Badge>
                  <button
                    onClick={() => setIsEditingSector(true)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#666666] hover:text-[#5eead4] transition-all"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
            <p className="text-[#a8a8a8] mt-1 text-lg">{stock.name}</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-4xl font-mono font-bold text-[#f5f5f5]">
            LKR {marketData.price.toFixed(2)}
          </p>
          <div className="flex justify-end mt-1">
            <PriceChange
              change={marketData.change}
              percent={marketData.percentChange}
            />
          </div>
          <p
            className={`text-xs mt-2 ${marketData.isOpen ? "text-[#4ade80]" : "text-[#f87171]"}`}
          >
            Market is {marketData.isOpen ? "Open" : "Closed"}
          </p>
          <div className="flex justify-end mt-1">
            <LastUpdated timestamp={dataUpdatedAt} />
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-[#262626]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analysis">Analysis & Charts</TabsTrigger>
        </TabsList>

        <TabsContent
          value="overview"
          className="animate-in fade-in slide-in-from-bottom-2 duration-500"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Stats & Position */}
            <div className="lg:col-span-1 space-y-6">
              {/* My Position Card */}
              {hasPosition ? (
                <Card className="border-[#5eead4]/30 bg-[#1e1e1e]/50 backdrop-blur-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-[#5eead4]">
                      <Briefcase className="h-4 w-4" />
                      Your Position
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="my-4 text-center">
                      <p className="text-sm text-[#8a8a8a]">Current Value</p>
                      <p className="text-3xl font-bold text-[#f5f5f5] mt-1">
                        {formatCurrency(position.currentValue)}
                      </p>
                      <Badge
                        variant={
                          position.unrealizedPL >= 0 ? "success" : "destructive"
                        }
                        className="mt-2"
                      >
                        {position.unrealizedPL >= 0 ? "+" : ""}
                        {formatCurrency(position.unrealizedPL)} (
                        {position.unrealizedPLPercent.toFixed(2)}%)
                      </Badge>
                    </div>
                    <Separator className="bg-[#333333]" />
                    <StatRow
                      label="Shares Owned"
                      value={
                        <span className="font-mono">{position.quantity}</span>
                      }
                    />
                    <StatRow
                      label="Avg. Buy Price"
                      value={
                        <span className="font-mono">
                          {parseFloat(position.avgBuyPrice).toFixed(2)}
                        </span>
                      }
                    />
                    <StatRow
                      label="Initial Buy"
                      value={
                        <span className="font-mono opacity-70">
                          {position.initialBuyPrice}
                        </span>
                      }
                    />
                    <StatRow
                      label="Last Buy"
                      value={
                        <span className="font-mono opacity-70">
                          {position.lastBuyPrice}
                        </span>
                      }
                    />
                    <StatRow
                      label="Total Invested"
                      value={
                        <span className="font-mono">
                          {formatCurrency(parseFloat(position.totalInvested))}
                        </span>
                      }
                    />
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-dashed border-[#333333]">
                  <CardContent className="py-8 text-center">
                    <p className="text-[#8a8a8a] mb-4">
                      You don't own this stock yet.
                    </p>
                    <Link
                      href="/portfolio?action=buy"
                      className="text-sm text-[#5eead4] hover:underline"
                    >
                      Add to Portfolio
                    </Link>
                  </CardContent>
                </Card>
              )}

              {/* Performance Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-[#a8a8a8]">
                    Performance Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <StatRow
                    label="Total Dividends Received"
                    value={
                      <span className="text-[#4ade80] font-mono">
                        +{formatCurrency(performance.totalDividends)}
                      </span>
                    }
                  />
                  <StatRow
                    label="Buy Transactions"
                    value={performance.buyCount}
                  />
                  <StatRow
                    label="Sell Transactions"
                    value={performance.sellCount}
                  />
                </CardContent>
              </Card>

              {/* Market Summary Wrapper */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-[#a8a8a8]">
                    Market Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <StatRow
                    label="Share Volume (Today)"
                    value={marketData.volume?.toLocaleString()}
                  />
                  <StatRow
                    label="Trades (Today)"
                    value={marketData.trades?.toLocaleString()}
                  />
                  <Separator className="bg-[#333333] my-2" />
                  <StatRow
                    label="Change"
                    value={
                      <span
                        className={
                          marketData.change >= 0
                            ? "text-[#4ade80]"
                            : "text-[#f87171]"
                        }
                      >
                        {marketData.change >= 0 ? "+" : ""}
                        {marketData.change}
                      </span>
                    }
                  />
                  <StatRow
                    label="Change %"
                    value={
                      <span
                        className={
                          marketData.percentChange >= 0
                            ? "text-[#4ade80]"
                            : "text-[#f87171]"
                        }
                      >
                        {formatPercentage(marketData.percentChange)}
                      </span>
                    }
                  />
                  <StatRow
                    label="Market Cap %"
                    value={
                      stock.company?.reqSymbolInfo?.marketCapPercentage
                        ? `${stock.company.reqSymbolInfo.marketCapPercentage.toFixed(2)}%`
                        : "-"
                    }
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Transaction History */}
            <div className="lg:col-span-2">
              <Card className="h-full border-[#333333]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5 text-[#5eead4]" />
                    Transaction History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {transactions.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-[#333333]">
                          <TableHead className="w-[100px]">Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((tx: any) => (
                          <TableRow
                            key={tx.id}
                            className="border-[#333333] hover:bg-[#262626]"
                          >
                            <TableCell className="font-mono text-xs text-[#a8a8a8]">
                              {new Date(tx.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`
                                  ${tx.type === "BUY" ? "bg-[#4ade80]/10 text-[#4ade80] border-[#4ade80]/20" : ""}
                                  ${tx.type === "SELL" ? "bg-[#f87171]/10 text-[#f87171] border-[#f87171]/20" : ""}
                                  ${tx.type === "DIVIDEND" ? "bg-[#fbbf24]/10 text-[#fbbf24] border-[#fbbf24]/20" : ""}
                                `}
                              >
                                {tx.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {tx.quantity}
                            </TableCell>
                            <TableCell className="text-right font-mono text-[#a8a8a8]">
                              {parseFloat(tx.price).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(parseFloat(tx.totalAmount))}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-12 text-[#666666]">
                      No transaction history available.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="analysis"
          className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500"
        >
          <TradingViewSymbolInfo symbol={tvSymbol} />

          <ResizableDiv
            defaultHeight={800}
            className="rounded-lg border border-[#333333] bg-card text-card-foreground shadow-sm"
          >
            <div className="h-full w-full p-2 pb-5">
              <TradingViewWidget symbol={tvSymbol} autosize />
            </div>
          </ResizableDiv>
        </TabsContent>
      </Tabs>
    </div>
  );
}
