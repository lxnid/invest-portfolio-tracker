"use client";

import Link from "next/link";
import { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  Pencil,
  Trash2,
  X,
  Loader2,
  Wallet,
  Calculator,
  Save,
  Sparkles,
} from "lucide-react";
import {
  useHoldings,
  useMarketData,
  useHoldingPrices,
  useCreateTransaction,
  useDeleteHolding,
  useSettings,
  useUpdateSettings,
} from "@/lib/hooks";
import {
  enrichHoldingsWithPrices,
  calculatePortfolioTotals,
} from "@/lib/rule-engine";

export function PortfolioView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<"active" | "inactive">("active");

  // Form State
  const [formData, setFormData] = useState({
    symbol: "",
    name: "",
    sector: "",
    quantity: "",
    buyPrice: "",
    date: new Date().toISOString().split("T")[0],
  });

  // Autocomplete State
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Capital Allocation State
  const [allocationPercent, setAllocationPercent] = useState<number>(0);
  const [capitalInput, setCapitalInput] = useState("");
  const [isEditingCapital, setIsEditingCapital] = useState(false);

  // Hooks
  const { data: holdings, isLoading: holdingsLoading } = useHoldings();
  const { data: holdingPrices } = useHoldingPrices(); // Lightweight, 30s polling for real-time P/L
  const { data: marketData } = useMarketData(); // Only used for autocomplete when adding holdings
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const createTransaction = useCreateTransaction();
  const deleteHolding = useDeleteHolding(); // Kept for cleanup if needed, but UI uses transactions now
  const updateSettings = useUpdateSettings();

  // Effects
  useEffect(() => {
    if (settings?.capital) {
      setCapitalInput(settings.capital);
    }
  }, [settings]);

  // Click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Build price map from lightweight holdingPrices (30s refresh for real-time P/L)
  // Falls back to marketData only if holdingPrices not available yet
  const stockPrices = useMemo(() => {
    const map = new Map<string, number>();

    // Primary: Use holdingPrices (lightweight, 30s polling)
    if (holdingPrices?.prices) {
      for (const [symbol, data] of Object.entries(holdingPrices.prices)) {
        map.set(symbol, data.price);
      }
    }

    // Fallback: If holdingPrices not loaded yet, use marketData
    if (map.size === 0 && marketData?.allStocks) {
      for (const stock of marketData.allStocks) {
        map.set(stock.symbol, stock.price);
      }
    }

    return map;
  }, [holdingPrices, marketData]);

  // Stocks for autocomplete
  const availableStocks = useMemo(() => {
    return marketData?.allStocks || [];
  }, [marketData]);

  const filteredStocks = useMemo(() => {
    if (!formData.symbol) return [];
    const query = formData.symbol.toLowerCase();

    return availableStocks
      .filter(
        (s) =>
          s.symbol.toLowerCase().includes(query) ||
          s.name.toLowerCase().includes(query),
      )
      .sort((a, b) => {
        const aSym = a.symbol.toLowerCase();
        const bSym = b.symbol.toLowerCase();
        if (aSym.startsWith(query) && !bSym.startsWith(query)) return -1;
        if (!aSym.startsWith(query) && bSym.startsWith(query)) return 1;
        return 0;
      })
      .slice(0, 5);
  }, [availableStocks, formData.symbol]);

  // Enrich holdings
  const enrichedHoldings = useMemo(() => {
    if (!holdings) return [];
    // Filter by status (default to active)
    return enrichHoldingsWithPrices(holdings, stockPrices).filter(
      (h) => (h.status || "active") === viewMode,
    );
  }, [holdings, stockPrices, viewMode]);

  const filteredHoldings = enrichedHoldings.filter(
    (h) =>
      h.stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.stock.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totals = useMemo(
    () => calculatePortfolioTotals(enrichedHoldings),
    [enrichedHoldings],
  );

  const totalCapital = parseFloat(settings?.capital || "0");
  const unallocatedCapital = totalCapital - totals.totalInvested;

  // Handlers
  const handleSaveCapital = async () => {
    try {
      await updateSettings.mutateAsync({ capital: parseFloat(capitalInput) });
      setIsEditingCapital(false);
    } catch (error) {
      console.error("Failed to update capital", error);
    }
  };

  const handleSelectStock = (stock: any) => {
    setFormData({
      ...formData,
      symbol: stock.symbol,
      name: stock.name,
      sector: stock.sector || "",
      buyPrice: stock.price.toString(),
    });
    setShowSuggestions(false);
  };

  const handleAllocationChange = (value: number[]) => {
    const percent = value[0];
    setAllocationPercent(percent);

    const price = parseFloat(formData.buyPrice);
    if (price > 0 && totalCapital > 0) {
      const amountToInvest = totalCapital * (percent / 100);
      const qty = Math.floor(amountToInvest / price);
      setFormData((prev) => ({ ...prev, quantity: qty.toString() }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Transaction-driven: Create a BUY transaction
      await createTransaction.mutateAsync({
        symbol: formData.symbol.toUpperCase(),
        name: formData.name,
        sector: formData.sector || undefined,
        type: "BUY",
        quantity: parseInt(formData.quantity),
        price: formData.buyPrice,
        executedAt: new Date(formData.date).toISOString(),
      });
      setShowAddModal(false);
      setFormData({
        symbol: "",
        name: "",
        sector: "",
        quantity: "",
        buyPrice: "",
        date: new Date().toISOString().split("T")[0],
      });
      setAllocationPercent(0);
    } catch (error) {
      console.error("Failed to create transaction:", error);
    }
  };

  const isLoading = holdingsLoading || settingsLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-50">Portfolio</h1>
          <p className="text-zinc-500 mt-1">Manage your stock holdings</p>
        </div>
        <div className="flex gap-3">
          {/* Simulator Button */}
          <Link href="/portfolio/simulator">
            <Button
              variant="outline"
              className="gap-2 border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-50"
            >
              <Sparkles className="h-4 w-4 text-purple-500" />
              Simulator
            </Button>
          </Link>

          {/* Capital Settings */}
          {isEditingCapital ? (
            <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg p-1 pr-3 shadow-lg animate-in fade-in slide-in-from-top-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">
                  LKR
                </span>
                <Input
                  value={capitalInput}
                  onChange={(e) => setCapitalInput(e.target.value)}
                  className="h-8 w-32 pl-10 bg-zinc-900 border-none focus-visible:ring-1"
                  autoFocus
                />
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-emerald-500"
                onClick={handleSaveCapital}
              >
                <Save className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-zinc-500"
                onClick={() => setIsEditingCapital(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="gap-2 border-zinc-800 bg-zinc-950 hover:bg-zinc-900"
              onClick={() => setIsEditingCapital(true)}
            >
              <Wallet className="h-4 w-4 text-blue-500" />
              <span className="text-zinc-400">Capital:</span>
              <span className="font-mono font-medium text-zinc-50">
                {parseInt(settings?.capital || "0").toLocaleString()}
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards (Active Only) */}
      {viewMode === "active" && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4 animate-in fade-in slide-in-from-bottom-2">
          <Card>
            <CardContent className="pt-5 pb-4">
              <p className="text-sm text-zinc-500">Total Value</p>
              <p className="text-2xl font-bold text-zinc-50 mt-1">
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  `LKR ${totals.totalValue.toLocaleString()}`
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 pb-4">
              <p className="text-sm text-zinc-500">Total Invested</p>
              <div className="flex justify-between items-end mt-1">
                <p className="text-2xl font-bold text-zinc-50">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    `LKR ${totals.totalInvested.toLocaleString()}`
                  )}
                </p>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                    Available
                  </p>
                  <p className="text-xs font-mono text-blue-500">
                    {unallocatedCapital.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* ProgressBar */}
              <div className="h-1 w-full bg-zinc-800 mt-3 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (totals.totalInvested / (totalCapital || 1)) * 100)}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 pb-4">
              <p className="text-sm text-zinc-500">Total P/L</p>
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin mt-1" />
              ) : (
                <>
                  <div className="flex items-center gap-2 mt-1">
                    <p
                      className={`text-2xl font-bold ${
                        totals.profitLoss >= 0
                          ? "text-emerald-500"
                          : "text-red-500"
                      }`}
                    >
                      {totals.profitLoss >= 0 ? "+" : ""}LKR{" "}
                      {totals.profitLoss.toLocaleString()}
                    </p>
                    {totals.profitLoss >= 0 ? (
                      <TrendingUp className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <p
                    className={`text-sm mt-0.5 ${
                      totals.profitLoss >= 0
                        ? "text-emerald-500"
                        : "text-red-500"
                    }`}
                  >
                    {totals.profitLossPercent >= 0 ? "+" : ""}
                    {totals.profitLossPercent.toFixed(2)}%
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 pb-4">
              <p className="text-sm text-zinc-500">Holdings</p>
              <p className="text-2xl font-bold text-zinc-50 mt-1">
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  `${totals.holdingsCount} stocks`
                )}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Holdings Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle>Holdings</CardTitle>
              <div className="flex gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                <Button
                  variant={viewMode === "active" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setViewMode("active")}
                >
                  Active
                </Button>
                <Button
                  variant={viewMode === "inactive" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setViewMode("inactive")}
                >
                  History
                </Button>
              </div>
            </div>

            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                placeholder="Search stocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-zinc-950 border-zinc-800"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-zinc-900/50">
                <TableRow className="hover:bg-transparent border-zinc-800">
                  <TableHead className="w-[120px]">Symbol</TableHead>
                  <TableHead className="w-[200px]">Company</TableHead>
                  <TableHead className="text-right w-[80px]">Qty</TableHead>
                  <TableHead className="text-right w-[100px]">
                    Avg. Price
                  </TableHead>
                  <TableHead className="text-right w-[100px]">
                    Init. Price
                  </TableHead>
                  <TableHead className="text-right w-[100px]">
                    Last Price
                  </TableHead>
                  <TableHead className="text-right w-[100px]">
                    Current
                  </TableHead>
                  <TableHead className="text-right w-[120px]">Value</TableHead>
                  <TableHead className="text-right">P/L</TableHead>
                  <TableHead className="text-right w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHoldings.map((holding) => (
                  <TableRow key={holding.id}>
                    <TableCell className="font-semibold">
                      <Link
                        href={`/portfolio/${holding.stock.symbol}`}
                        className="hover:text-blue-500 hover:underline transition-colors"
                      >
                        {holding.stock.symbol}
                      </Link>
                      {holding.status === "inactive" && (
                        <Badge
                          variant="outline"
                          className="ml-2 text-[10px] h-5"
                        >
                          Sold
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-zinc-500">
                      {holding.stock.name}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {holding.quantity.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {parseFloat(holding.avgBuyPrice).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-zinc-500">
                      {holding.initialBuyPrice
                        ? parseFloat(holding.initialBuyPrice).toFixed(2)
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-zinc-500">
                      {holding.lastBuyPrice
                        ? parseFloat(holding.lastBuyPrice).toFixed(2)
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {holding.currentPrice?.toFixed(2) ?? "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {holding.currentValue?.toLocaleString() ??
                        parseFloat(holding.totalInvested).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {viewMode === "active" && (
                        <div className="flex items-center justify-end gap-2">
                          <span
                            className={`font-mono ${
                              (holding.profitLoss ?? 0) >= 0
                                ? "text-emerald-500"
                                : "text-red-500"
                            }`}
                          >
                            {(holding.profitLoss ?? 0) >= 0 ? "+" : ""}
                            {(holding.profitLoss ?? 0).toLocaleString()}
                          </span>
                          <Badge
                            variant={
                              (holding.profitLossPercent ?? 0) >= 0
                                ? "success"
                                : "destructive"
                            }
                          >
                            {(holding.profitLossPercent ?? 0).toFixed(1)}%
                          </Badge>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {/* Removed direct delete/edit to enforce transaction flow, or keep as correction tool? */}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!isLoading && filteredHoldings.length === 0 && (
            <div className="text-center py-8 text-zinc-500">
              {viewMode === "active"
                ? "No active holdings found."
                : "No history found."}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Stock Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-lg mx-4 border-zinc-800 shadow-2xl bg-zinc-950">
            <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-800 pb-4">
              <CardTitle>Buy Stock</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-zinc-800"
                onClick={() => setShowAddModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6 pt-6">
                {/* Symbol + Autocomplete */}
                <div className="relative" ref={wrapperRef}>
                  <Label className="text-zinc-400">Stock Symbol</Label>
                  <div className="relative mt-1.5">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                      placeholder="Search to autofill..."
                      className="pl-9 font-mono uppercase focus:ring-blue-500/20 bg-zinc-900 border-zinc-800"
                      value={formData.symbol}
                      onChange={(e) => {
                        setFormData({ ...formData, symbol: e.target.value });
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      required
                    />
                  </div>

                  {/* Suggestions Dropdown */}
                  {showSuggestions && filteredStocks.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 overflow-hidden bg-zinc-900 border border-zinc-800 rounded-md shadow-lg animate-in fade-in zoom-in-95 duration-100">
                      {filteredStocks.map((stock) => (
                        <div
                          key={stock.symbol}
                          className="flex items-center justify-between px-4 py-3 hover:bg-zinc-800 cursor-pointer transition-colors"
                          onClick={() => handleSelectStock(stock)}
                        >
                          <div>
                            <p className="font-bold text-zinc-50">
                              {stock.symbol}
                            </p>
                            <p className="text-xs text-zinc-400">
                              {stock.name}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-blue-500">
                              LKR {stock.price.toFixed(2)}
                            </p>
                            <p
                              className={`text-xs ${stock.percentChange >= 0 ? "text-emerald-500" : "text-red-500"}`}
                            >
                              {stock.percentChange > 0 ? "+" : ""}
                              {stock.percentChange}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-zinc-400">Company Name</Label>
                    <Input
                      placeholder="e.g. LOLC Holdings"
                      className="mt-1.5 bg-zinc-900 border-zinc-800"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-zinc-400">Transaction Date</Label>
                    <Input
                      type="date"
                      className="mt-1.5 bg-zinc-900 border-zinc-800"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                {/* Capital Allocation Calculator */}
                <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium text-zinc-50">
                        Capital Allocation
                      </span>
                    </div>
                    <span className="text-xs text-zinc-400">
                      Available:{" "}
                      <span className="font-mono text-zinc-50">
                        LKR {unallocatedCapital.toLocaleString()}
                      </span>
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">
                        Allocate % of Total Capital
                      </span>
                      <span className="font-mono text-blue-500">
                        {allocationPercent}% (LKR{" "}
                        {(
                          totalCapital *
                          (allocationPercent / 100)
                        ).toLocaleString()}
                        )
                      </span>
                    </div>
                    <Slider
                      value={[allocationPercent]}
                      max={100}
                      step={1}
                      onValueChange={handleAllocationChange}
                      className="py-1"
                    />
                    <div className="flex gap-2">
                      {[5, 10, 20, 25, 50].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => handleAllocationChange([pct])}
                          className="text-[10px] px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors"
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-zinc-400">Quantity</Label>
                    <Input
                      type="number"
                      className="mt-1.5 font-mono text-lg bg-zinc-900 border-zinc-800"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, quantity: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-zinc-400">Buy Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      className="mt-1.5 font-mono text-lg bg-zinc-900 border-zinc-800"
                      value={formData.buyPrice}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          buyPrice: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowAddModal(false)}
                    className="hover:bg-zinc-800 text-zinc-400"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createTransaction.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                  >
                    {createTransaction.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    Confirm Buy
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
