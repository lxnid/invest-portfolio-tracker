"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  Loader2,
} from "lucide-react";
import { useMarketData } from "@/lib/hooks";
import { Button } from "@/components/ui/button";

export default function MarketPage() {
  const { data: marketData, isLoading } = useMarketData();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>({ key: "percentChange", direction: "desc" }); // Default sort by Top Gainers
  const [visibleCount, setVisibleCount] = useState(50);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Sortable Data
  const sortedStocks = useMemo(() => {
    if (!marketData?.allStocks) return [];

    let filtered = marketData.allStocks.filter(
      (stock) =>
        stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    if (sortConfig) {
      filtered.sort((a, b) => {
        // @ts-ignore
        const aValue = a[sortConfig.key];
        // @ts-ignore
        const bValue = b[sortConfig.key];

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [marketData, searchQuery, sortConfig]);

  const visibleStocks = useMemo(() => {
    return sortedStocks.slice(0, visibleCount);
  }, [sortedStocks, visibleCount]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 50, sortedStocks.length));
        }
      },
      { threshold: 0.1 },
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [sortedStocks.length]);

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "desc" };
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#f5f5f5]">Market Explorer</h1>
        <p className="text-[#8a8a8a] mt-1">
          Explore Colombo Stock Exchange indices and listed companies
        </p>
      </div>

      {/* Indices Section */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-linear-to-br from-[#1e1e1e] to-[#252525] border-[#333333]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#a8a8a8]">
              All Share Price Index (ASPI)
            </CardTitle>
            <Activity className="h-4 w-4 text-[#5eead4]" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-[#5eead4]" />
            ) : (
              <>
                <div className="text-2xl font-bold text-[#f5f5f5]">
                  {marketData?.aspi?.index.toFixed(2) ?? "0.00"}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-sm font-medium ${
                      (marketData?.aspi?.change || 0) >= 0
                        ? "text-[#4ade80]"
                        : "text-[#f87171]"
                    }`}
                  >
                    {(marketData?.aspi?.change || 0) > 0 ? "+" : ""}
                    {marketData?.aspi?.change?.toFixed(2)}
                  </span>
                  <Badge
                    variant={
                      (marketData?.aspi?.percentChange || 0) >= 0
                        ? "success"
                        : "destructive"
                    }
                  >
                    {marketData?.aspi?.percentChange?.toFixed(2)}%
                  </Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-[#1e1e1e] to-[#252525] border-[#333333]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#a8a8a8]">
              S&P SL20 Index
            </CardTitle>
            <Layers className="h-4 w-4 text-[#fbbf24]" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-[#fbbf24]" />
            ) : (
              <>
                <div className="text-2xl font-bold text-[#f5f5f5]">
                  {marketData?.sp20?.index.toFixed(2) ?? "0.00"}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-sm font-medium ${
                      (marketData?.sp20?.change || 0) >= 0
                        ? "text-[#4ade80]"
                        : "text-[#f87171]"
                    }`}
                  >
                    {(marketData?.sp20?.change || 0) > 0 ? "+" : ""}
                    {marketData?.sp20?.change?.toFixed(2)}
                  </span>
                  <Badge
                    variant={
                      (marketData?.sp20?.percentChange || 0) >= 0
                        ? "success"
                        : "destructive"
                    }
                  >
                    {marketData?.sp20?.percentChange?.toFixed(2)}%
                  </Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stock Library */}
      <Card className="border-[#333333] bg-[#1e1e1e]">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle>Stock Library</CardTitle>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666666]" />
              <Input
                placeholder="Search symbol or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-[#262626] border-[#333333]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md border border-[#333333] overflow-hidden">
            <Table>
              <TableHeader className="bg-[#262626]">
                <TableRow className="hover:bg-transparent border-b-[#333333]">
                  <TableHead className="w-[100px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("symbol")}
                      className="p-0 hover:bg-transparent text-[#a8a8a8] font-semibold"
                    >
                      Symbol <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("name")}
                      className="p-0 hover:bg-transparent text-[#a8a8a8] font-semibold"
                    >
                      Company Name <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("price")}
                      className="p-0 hover:bg-transparent text-[#a8a8a8] font-semibold"
                    >
                      Price (LKR) <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("change")}
                      className="p-0 hover:bg-transparent text-[#a8a8a8] font-semibold"
                    >
                      Change <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("percentChange")}
                      className="p-0 hover:bg-transparent text-[#a8a8a8] font-semibold"
                    >
                      Change % <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("qty")}
                      className="p-0 hover:bg-transparent text-[#a8a8a8] font-semibold"
                    >
                      Volume <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#5eead4]" />
                    </TableCell>
                  </TableRow>
                ) : visibleStocks.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-[#666666]"
                    >
                      No stocks found.
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {visibleStocks.map((stock) => (
                      <TableRow
                        key={stock.symbol}
                        className="hover:bg-[#262626] border-b-[#333333]"
                      >
                        <TableCell className="font-mono font-medium text-zinc-300">
                          <Link
                            href={`/portfolio/${stock.symbol}`}
                            className="hover:underline"
                          >
                            {stock.symbol}
                          </Link>
                        </TableCell>
                        <TableCell className="text-zinc-500">
                          {stock.name}
                        </TableCell>
                        <TableCell className="text-right font-mono text-[#f5f5f5]">
                          {(stock.price || 0).toFixed(2)}
                        </TableCell>
                        <TableCell
                          className={`text-right font-mono ${(stock.change || 0) >= 0 ? "text-[#4ade80]" : "text-[#f87171]"}`}
                        >
                          {(stock.change || 0) > 0 ? "+" : ""}
                          {(stock.change || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={
                              (stock.percentChange || 0) >= 0
                                ? "success"
                                : "destructive"
                            }
                            className="ml-auto w-fit"
                          >
                            {(stock.percentChange || 0) > 0 ? "+" : ""}
                            {(stock.percentChange || 0).toFixed(2)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-[#a8a8a8]">
                          {(stock.volume || 0).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}

                    {/* Loader / Sentinel */}
                    {visibleStocks.length < sortedStocks.length && (
                      <TableRow>
                        <TableCell colSpan={6} className="p-0 mb-0">
                          <div
                            ref={loadMoreRef}
                            className="h-10 flex items-center justify-center"
                          >
                            <Loader2 className="h-5 w-5 animate-spin text-[#5eead4]" />
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="p-4 text-xs text-center text-[#666666]">
            Showing {visibleStocks.length} of {sortedStocks.length} listed
            securities
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
