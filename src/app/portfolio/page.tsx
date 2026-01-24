"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  Pencil,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import {
  useHoldings,
  useMarketData,
  useCreateHolding,
  useDeleteHolding,
} from "@/lib/hooks";
import {
  enrichHoldingsWithPrices,
  calculatePortfolioTotals,
} from "@/lib/rule-engine";

export default function PortfolioPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    symbol: "",
    name: "",
    sector: "",
    quantity: "",
    avgBuyPrice: "",
  });

  const { data: holdings, isLoading } = useHoldings();
  const { data: marketData } = useMarketData();
  const createHolding = useCreateHolding();
  const deleteHolding = useDeleteHolding();

  // Build price map
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

  const filteredHoldings = enrichedHoldings.filter(
    (h) =>
      h.stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.stock.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totals = useMemo(
    () => calculatePortfolioTotals(enrichedHoldings),
    [enrichedHoldings],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createHolding.mutateAsync({
        symbol: formData.symbol.toUpperCase(),
        name: formData.name,
        sector: formData.sector || undefined,
        quantity: parseInt(formData.quantity),
        avgBuyPrice: formData.avgBuyPrice,
      });
      setShowAddModal(false);
      setFormData({
        symbol: "",
        name: "",
        sector: "",
        quantity: "",
        avgBuyPrice: "",
      });
    } catch (error) {
      console.error("Failed to create holding:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this holding?")) {
      try {
        await deleteHolding.mutateAsync(id);
      } catch (error) {
        console.error("Failed to delete holding:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#f5f5f5]">Portfolio</h1>
          <p className="text-[#8a8a8a] mt-1">Manage your stock holdings</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Stock
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-[#8a8a8a]">Total Value</p>
            <p className="text-2xl font-bold text-[#f5f5f5] mt-1">
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
            <p className="text-sm text-[#8a8a8a]">Total Invested</p>
            <p className="text-2xl font-bold text-[#f5f5f5] mt-1">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                `LKR ${totals.totalInvested.toLocaleString()}`
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-[#8a8a8a]">Total P/L</p>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin mt-1" />
            ) : (
              <>
                <div className="flex items-center gap-2 mt-1">
                  <p
                    className={`text-2xl font-bold ${
                      totals.profitLoss >= 0
                        ? "text-[#4ade80]"
                        : "text-[#f87171]"
                    }`}
                  >
                    {totals.profitLoss >= 0 ? "+" : ""}LKR{" "}
                    {totals.profitLoss.toLocaleString()}
                  </p>
                  {totals.profitLoss >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-[#4ade80]" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-[#f87171]" />
                  )}
                </div>
                <p
                  className={`text-sm mt-0.5 ${
                    totals.profitLoss >= 0 ? "text-[#4ade80]" : "text-[#f87171]"
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
            <p className="text-sm text-[#8a8a8a]">Holdings</p>
            <p className="text-2xl font-bold text-[#f5f5f5] mt-1">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                `${totals.holdingsCount} stocks`
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Holdings Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>Holdings</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666666]" />
              <Input
                placeholder="Search stocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#5eead4]" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Symbol</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Avg. Price</TableHead>
                  <TableHead className="text-right">Current</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">P/L</TableHead>
                  <TableHead className="text-right w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHoldings.map((holding) => (
                  <TableRow key={holding.id}>
                    <TableCell className="font-semibold">
                      {holding.stock.symbol}
                    </TableCell>
                    <TableCell className="text-[#a8a8a8]">
                      {holding.stock.name}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {holding.quantity.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {parseFloat(holding.avgBuyPrice).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {holding.currentPrice?.toFixed(2) ?? "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {holding.currentValue?.toLocaleString() ??
                        parseFloat(holding.totalInvested).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span
                          className={`font-mono ${
                            (holding.profitLoss ?? 0) >= 0
                              ? "text-[#4ade80]"
                              : "text-[#f87171]"
                          }`}
                        >
                          {(holding.profitLoss ?? 0) >= 0 ? "+" : ""}
                          {(holding.profitLoss ?? 0).toLocaleString()}
                        </span>
                        <Badge
                          variant={
                            (holding.profitLoss ?? 0) >= 0
                              ? "success"
                              : "destructive"
                          }
                        >
                          {(holding.profitLossPercent ?? 0) >= 0 ? "+" : ""}
                          {(holding.profitLossPercent ?? 0).toFixed(1)}%
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[#f87171] hover:text-[#fca5a5]"
                          onClick={() => handleDelete(holding.id)}
                          disabled={deleteHolding.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!isLoading && filteredHoldings.length === 0 && (
            <div className="text-center py-8 text-[#8a8a8a]">
              No holdings found. Add your first stock to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Stock Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Add Stock to Portfolio</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowAddModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[#a8a8a8]">
                    Stock Symbol
                  </label>
                  <Input
                    placeholder="e.g., LOLC.N0000"
                    className="mt-1.5"
                    value={formData.symbol}
                    onChange={(e) =>
                      setFormData({ ...formData, symbol: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#a8a8a8]">
                    Company Name
                  </label>
                  <Input
                    placeholder="e.g., LOLC Holdings PLC"
                    className="mt-1.5"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#a8a8a8]">
                    Sector (optional)
                  </label>
                  <Input
                    placeholder="e.g., Financial"
                    className="mt-1.5"
                    value={formData.sector}
                    onChange={(e) =>
                      setFormData({ ...formData, sector: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-[#a8a8a8]">
                      Quantity
                    </label>
                    <Input
                      type="number"
                      placeholder="0"
                      className="mt-1.5"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, quantity: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#a8a8a8]">
                      Avg. Buy Price
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="mt-1.5"
                      value={formData.avgBuyPrice}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          avgBuyPrice: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createHolding.isPending}>
                    {createHolding.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Add Stock
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
