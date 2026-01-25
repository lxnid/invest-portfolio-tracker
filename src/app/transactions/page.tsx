"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RuleComplianceCard } from "@/components/rule-compliance";
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
  Download,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  X,
  Loader2,
  Calculator,
  ShieldCheck,
} from "lucide-react";
import {
  useTransactions,
  useCreateTransaction,
  useMarketData,
  useSettings,
  useHoldings,
  type Holding,
} from "@/lib/hooks";

type TransactionType = "BUY" | "SELL" | "DIVIDEND";

function getTypeBadge(type: TransactionType) {
  switch (type) {
    case "BUY":
      return <Badge variant="success">BUY</Badge>;
    case "SELL":
      return <Badge variant="destructive">SELL</Badge>;
    case "DIVIDEND":
      return <Badge variant="warning">DIV</Badge>;
  }
}

function formatDate(dateString: string | Date | null) {
  if (!dateString) return "-";
  try {
    return new Intl.DateTimeFormat("en-LK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(dateString));
  } catch (e) {
    return "-";
  }
}

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TransactionType | "ALL">("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedType, setSelectedType] = useState<TransactionType>("BUY");
  const [formData, setFormData] = useState({
    symbol: "",
    name: "",
    quantity: "",
    price: "",
    fees: "",
    date: new Date().toISOString().split("T")[0],
  });

  // Auto-calculate fees (1.12%)
  useEffect(() => {
    const qty = parseFloat(formData.quantity);
    const price = parseFloat(formData.price);
    if (!isNaN(qty) && !isNaN(price) && qty > 0 && price > 0) {
      const fees = (qty * price * 0.0112).toFixed(2);
      setFormData((prev) => ({ ...prev, fees }));
    }
  }, [formData.quantity, formData.price]);

  const { data: transactions, isLoading } = useTransactions(
    typeFilter === "ALL" ? undefined : typeFilter,
  );
  const createTransaction = useCreateTransaction();

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter(
      (t) =>
        t.stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.stock.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [transactions, searchQuery]);

  const totals = useMemo(() => {
    if (!transactions) return { buys: 0, sells: 0, dividends: 0 };
    return {
      buys: transactions
        .filter((t) => t.type === "BUY")
        .reduce((sum, t) => sum + parseFloat(t.totalAmount || "0"), 0),
      sells: transactions
        .filter((t) => t.type === "SELL")
        .reduce((sum, t) => sum + parseFloat(t.totalAmount || "0"), 0),
      dividends: transactions
        .filter((t) => t.type === "DIVIDEND")
        .reduce((sum, t) => sum + parseFloat(t.totalAmount || "0"), 0),
    };
  }, [transactions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTransaction.mutateAsync({
        symbol: formData.symbol.toUpperCase(),
        name: formData.name,
        type: selectedType,
        quantity: parseInt(formData.quantity),
        price: formData.price,
        fees: formData.fees, // Pass fees
        executedAt: new Date(formData.date).toISOString(), // Map back to what API expects or just date? API expects executedAt for now in route.ts mapping
      });
      setShowAddModal(false);
      setFormData({
        symbol: "",
        name: "",
        quantity: "",
        price: "",
        fees: "",
        date: new Date().toISOString().split("T")[0],
      });
    } catch (error) {
      console.error("Failed to create transaction:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#f5f5f5]">Transactions</h1>
          <p className="text-[#8a8a8a] mt-1">Your complete trading history</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            className="flex-1 md:flex-none"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#8a8a8a]">Transactions</p>
                <p className="text-2xl font-bold text-[#f5f5f5] mt-1">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    (transactions?.length ?? 0)
                  )}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-[#333333]">
                <ArrowRightLeft className="h-5 w-5 text-[#a8a8a8]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#8a8a8a]">Total Buys</p>
                <p className="text-2xl font-bold text-[#4ade80] mt-1">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    totals.buys.toLocaleString()
                  )}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-[#4ade80]/10">
                <TrendingUp className="h-5 w-5 text-[#4ade80]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#8a8a8a]">Total Sells</p>
                <p className="text-2xl font-bold text-[#f87171] mt-1">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    totals.sells.toLocaleString()
                  )}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-[#f87171]/10">
                <TrendingDown className="h-5 w-5 text-[#f87171]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-[#8a8a8a]">Dividends</p>
            <p className="text-2xl font-bold text-[#fbbf24] mt-1">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                totals.dividends.toLocaleString()
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row justify-between gap-4 w-full">
            <CardTitle className="my-auto">Transaction History</CardTitle>
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666666]" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full"
                />
              </div>
              <div className="flex gap-1 overflow-x-auto pb-1 md:pb-0">
                {(["ALL", "BUY", "SELL", "DIVIDEND"] as const).map((type) => (
                  <Button
                    key={type}
                    variant={typeFilter === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTypeFilter(type)}
                    className="whitespace-nowrap"
                  >
                    {type === "DIVIDEND" ? "DIV" : type}
                  </Button>
                ))}
              </div>
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
                  <TableHead>Date</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Fees</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="text-[#a8a8a8]">
                      {formatDate(transaction.date)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-[#f5f5f5]">
                          {transaction.stock.symbol}
                        </p>
                        <p className="text-sm text-[#8a8a8a]">
                          {transaction.stock.name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(transaction.type)}</TableCell>
                    <TableCell className="text-right font-mono">
                      {transaction.quantity.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {parseFloat(transaction.price).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[#8a8a8a]">
                      {parseFloat(transaction.fees || "0").toFixed(2)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono font-semibold ${
                        transaction.type === "BUY"
                          ? "text-red-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {transaction.type === "BUY" ? "-" : "+"}
                      {parseFloat(
                        transaction.totalAmount || "0",
                      ).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!isLoading && filteredTransactions.length === 0 && (
            <div className="text-center py-8 text-[#8a8a8a]">
              No transactions found.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <TransactionModal
          onClose={() => setShowAddModal(false)}
          onSubmit={async (data) => {
            await createTransaction.mutateAsync(data);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}

function TransactionModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}) {
  const { data: marketData } = useMarketData();
  const { data: settings } = useSettings();
  const { data: holdings } = useHoldings();
  const [selectedType, setSelectedType] = useState<TransactionType>("BUY");
  const [formData, setFormData] = useState({
    symbol: "",
    name: "",
    stockId: 0,
    quantity: "",
    price: "",
    fees: "",
    date: new Date().toISOString().split("T")[0],
  });

  // Error State
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simulation State
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  // Autocomplete
  const [showSuggestions, setShowSuggestions] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wrapperRef = useRef<any>(null);

  // Capital Allocation
  const [allocationPercent, setAllocationPercent] = useState<number>(0);
  const totalCapital = parseFloat(settings?.capital || "0");

  // Sell Percentage State
  const [sellPercent, setSellPercent] = useState<number>(100);
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);

  // Auto-calculate fees
  useEffect(() => {
    const qty = parseFloat(formData.quantity);
    const price = parseFloat(formData.price);
    if (!isNaN(qty) && !isNaN(price) && qty > 0 && price > 0) {
      const fees = (qty * price * 0.0112).toFixed(2);
      setFormData((prev) => ({ ...prev, fees }));
    }
  }, [formData.quantity, formData.price]);

  // Clear simulation when inputs change
  useEffect(() => {
    setSimulationResult(null);
  }, [formData.symbol, formData.quantity, formData.price, selectedType]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredStocks = useMemo(() => {
    if (!marketData?.allStocks || !formData.symbol) return [];
    const query = formData.symbol.toLowerCase();
    return marketData.allStocks
      .filter(
        (s) =>
          s.symbol.toLowerCase().includes(query) ||
          s.name.toLowerCase().includes(query),
      )
      .slice(0, 5);
  }, [marketData, formData.symbol]);

  const handleSelectStock = (stock: any) => {
    setFormData((prev) => ({
      ...prev,
      symbol: stock.symbol,
      name: stock.name,
      stockId: stock.id, // We assume marketData provides this or we match by symbol
      price: stock.price.toString(),
    }));
    setShowSuggestions(false);
  };

  const handleAllocationChange = (value: number[]) => {
    const percent = value[0];
    setAllocationPercent(percent);

    const price = parseFloat(formData.price);
    if (price > 0 && totalCapital > 0) {
      const amountToInvest = totalCapital * (percent / 100);
      const qty = Math.floor(amountToInvest / price);
      setFormData((prev) => ({ ...prev, quantity: qty.toString() }));
    }
  };

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      // If we don't have stockId (e.g. manual entry not from autocomplete), we might need to find it or send 0
      // The backend simulator needs stockId to match existing holdings.
      // If user manually types symbol, we might miss stockId.
      // Let's rely on backend to lookup symbol if stockId is 0.
      // Actually, our backend simulator uses passed stockId.
      // Let's try to find stockId from holdings if possible.
      let sid = formData.stockId;
      if (!sid) {
        const h = holdings?.find(
          (h) => h.stock.symbol === formData.symbol.toUpperCase(),
        );
        if (h) sid = h.stockId;
        // If still 0, maybe marketData has it?
        // Our marketData.allStocks doesn't restrictively have IDs in the interface but might in runtime?
        // The `useMarketData` interface says `allStocks: Array<{ symbol, name, price... }>` - no ID.
        // We might need to fetch stock ID or assume it exists in DB.
        // Simulation requires stockId to match holdings.
        // If it's a new stock, ID doesn't matter much unless we have a rule about specific stocks?
        // But generic rules (Cash, Sizing) just need symbol/value.
        // Let's send 0 if unknown.
      }

      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stockId: sid,
          symbol: formData.symbol.toUpperCase(),
          type: selectedType,
          quantity: formData.quantity,
          price: formData.price,
          fees: formData.fees,
        }),
      });
      const result = await res.json();
      setSimulationResult(result);
    } catch (e) {
      console.error(e);
    } finally {
      setSimulating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit({
        symbol: formData.symbol.toUpperCase(),
        name: formData.name,
        type: selectedType,
        quantity: parseInt(formData.quantity),
        price: formData.price,
        fees: formData.fees,
        executedAt: new Date(formData.date).toISOString(),
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create transaction";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Need to import RuleComplianceCard
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-0 md:p-8">
      <Card className="w-full h-full md:h-auto md:max-w-lg bg-[#1e1e1e] border-[#333333] shadow-2xl rounded-none md:rounded-xl overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between border-b border-[#2f2f2f] pb-4">
          <CardTitle>Add Transaction</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-[#333333]"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5 pt-6">
            {/* Type Selection */}
            <div>
              <div className="flex gap-2">
                {(["BUY", "SELL", "DIVIDEND"] as const).map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={selectedType === type ? "default" : "outline"}
                    className={`flex-1 ${
                      selectedType === type && type === "BUY"
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : selectedType === type && type === "SELL"
                          ? "bg-red-600 hover:bg-red-700"
                          : ""
                    }`}
                    onClick={() => {
                      setSelectedType(type);
                      // Reset form data when switching types
                      setFormData({
                        symbol: "",
                        name: "",
                        stockId: 0,
                        quantity: "",
                        price: "",
                        fees: "",
                        date: new Date().toISOString().split("T")[0],
                      });
                      setSelectedHolding(null);
                      setSellPercent(100);
                      setAllocationPercent(0);
                      setSimulationResult(null);
                    }}
                  >
                    {type === "DIVIDEND" ? "DIV" : type}
                  </Button>
                ))}
              </div>
            </div>

            {/* Symbol Selection - Conditional on Type */}
            {selectedType === "DIVIDEND" || selectedType === "SELL" ? (
              <div>
                <Label className="text-[#a8a8a8]">
                  Select Stock (Active Holdings)
                </Label>
                <select
                  className="flex h-10 w-full rounded-md border border-[#333333] bg-[#1e1e1e] px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1.5"
                  onChange={(e) => {
                    const holding = holdings?.find(
                      (h) => h.stock.symbol === e.target.value,
                    );
                    if (holding) {
                      setSelectedHolding(holding);
                      if (selectedType === "DIVIDEND") {
                        setFormData((prev) => ({
                          ...prev,
                          symbol: holding.stock.symbol,
                          name: holding.stock.name,
                          stockId: holding.stockId,
                          quantity: holding.quantity.toString(),
                          price: "", // Reset dividend per share
                          fees: "0", // No fees for dividends
                        }));
                      } else {
                        // SELL - set full quantity by default, user can adjust with slider
                        setSellPercent(100);
                        setFormData((prev) => ({
                          ...prev,
                          symbol: holding.stock.symbol,
                          name: holding.stock.name,
                          stockId: holding.stockId,
                          quantity: holding.quantity.toString(),
                          price: holding.avgBuyPrice?.toString() || "",
                        }));
                      }
                    }
                  }}
                  value={formData.symbol}
                >
                  <option value="">Select a stock...</option>
                  {holdings?.map((h) => (
                    <option key={h.id} value={h.stock.symbol}>
                      {h.stock.symbol} - {h.quantity} Shares @ LKR{" "}
                      {parseFloat(h.avgBuyPrice || "0").toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              // Standard Autocomplete for BUY only
              <div className="relative" ref={wrapperRef}>
                <Label className="text-[#a8a8a8]">Stock Symbol</Label>
                <div className="relative mt-1.5">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666666]" />
                  <Input
                    placeholder="Search symbol..."
                    className="pl-9 font-mono uppercase"
                    value={formData.symbol}
                    onChange={(e) => {
                      setFormData({ ...formData, symbol: e.target.value });
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    required
                  />
                </div>
                {showSuggestions && filteredStocks.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 overflow-hidden bg-[#262626] border border-[#333333] rounded-md shadow-lg">
                    {filteredStocks.map((stock) => (
                      <div
                        key={stock.symbol}
                        className="flex items-center justify-between px-4 py-3 hover:bg-[#333333] cursor-pointer"
                        onClick={() => handleSelectStock(stock)}
                      >
                        <div>
                          <p className="font-bold text-[#f5f5f5]">
                            {stock.symbol}
                          </p>
                          <p className="text-xs text-[#a8a8a8]">{stock.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-[#5eead4]">
                            LKR {stock.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Auto-filled Name (Only for BUY when using search) */}
            {formData.name && selectedType === "BUY" && (
              <div className="text-sm text-[#a8a8a8] px-1">{formData.name}</div>
            )}

            {/* Capital Allocation (Only for BUY) */}
            {selectedType === "BUY" && (
              <div className="p-4 rounded-lg bg-[#262626] border border-[#333333] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-[#5eead4]" />
                    <span className="text-sm font-medium text-[#f5f5f5]">
                      Capital Allocation
                    </span>
                  </div>
                  <span className="text-xs text-[#a8a8a8]">
                    Capital:{" "}
                    <span className="font-mono text-[#f5f5f5]">
                      LKR {totalCapital.toLocaleString()}
                    </span>
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#a8a8a8]">
                      Allocate % of Total Capital
                    </span>
                    <span className="font-mono text-[#5eead4]">
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
                        className="text-[10px] px-2 py-1 rounded bg-[#333333] hover:bg-[#404040] text-[#a8a8a8] transition-colors"
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Sell Quantity Selector (Only for SELL) */}
            {selectedType === "SELL" && selectedHolding && (
              <div className="p-4 rounded-lg bg-[#262626] border border-[#333333] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-[#f87171]" />
                    <span className="text-sm font-medium text-[#f5f5f5]">
                      Sell Quantity
                    </span>
                  </div>
                  <span className="text-xs text-[#a8a8a8]">
                    Available:{" "}
                    <span className="font-mono text-[#f5f5f5]">
                      {selectedHolding.quantity} Shares
                    </span>
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#a8a8a8]">Sell % of Holding</span>
                    <span className="font-mono text-[#f87171]">
                      {sellPercent}% (
                      {Math.floor(
                        selectedHolding.quantity * (sellPercent / 100),
                      )}{" "}
                      Shares)
                    </span>
                  </div>
                  <Slider
                    value={[sellPercent]}
                    max={100}
                    min={1}
                    step={1}
                    onValueChange={(value) => {
                      const pct = value[0];
                      setSellPercent(pct);
                      const qty = Math.floor(
                        selectedHolding.quantity * (pct / 100),
                      );
                      setFormData((prev) => ({
                        ...prev,
                        quantity: qty.toString(),
                      }));
                    }}
                    className="py-1"
                  />
                  <div className="flex gap-2">
                    {[25, 50, 75, 100].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          setSellPercent(pct);
                          const qty = Math.floor(
                            selectedHolding.quantity * (pct / 100),
                          );
                          setFormData((prev) => ({
                            ...prev,
                            quantity: qty.toString(),
                          }));
                        }}
                        className={`text-[10px] px-2 py-1 rounded transition-colors ${
                          sellPercent === pct
                            ? "bg-[#f87171] text-white"
                            : "bg-[#333333] hover:bg-[#404040] text-[#a8a8a8]"
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-[#333333] flex justify-between text-sm">
                    <span className="text-[#a8a8a8]">Estimated Value:</span>
                    <span className="font-mono text-[#f5f5f5]">
                      LKR{" "}
                      {(
                        Math.floor(
                          selectedHolding.quantity * (sellPercent / 100),
                        ) * parseFloat(formData.price || "0")
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#a8a8a8]">Quantity</Label>
                <Input
                  type="number"
                  className="mt-1.5 font-mono"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  required
                  disabled={
                    selectedType === "DIVIDEND" || selectedType === "SELL"
                  }
                />
              </div>
              <div>
                <Label className="text-[#a8a8a8]">
                  {selectedType === "DIVIDEND" ? "Dividend Per Share" : "Price"}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  className="mt-1.5 font-mono"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#a8a8a8]">
                  {selectedType === "DIVIDEND"
                    ? "Total Income"
                    : "Fees (1.12%)"}
                </Label>
                {selectedType === "DIVIDEND" ? (
                  <div className="flex h-10 w-full items-center rounded-md border border-[#333333] bg-[#1e1e1e] px-3 py-2 text-sm text-[#f5f5f5] font-mono mt-1.5">
                    LKR{" "}
                    {(
                      (parseFloat(formData.quantity) || 0) *
                      (parseFloat(formData.price) || 0)
                    ).toFixed(2)}
                  </div>
                ) : (
                  <Input
                    type="number"
                    step="0.01"
                    className="mt-1.5 font-mono text-[#a8a8a8]"
                    value={formData.fees}
                    onChange={(e) =>
                      setFormData({ ...formData, fees: e.target.value })
                    }
                  />
                )}
              </div>
              <div>
                <Label className="text-[#a8a8a8]">Date</Label>
                <Input
                  type="date"
                  className="mt-1.5"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {/* Simulation Results */}
            {selectedType !== "DIVIDEND" && (
              <div className="pt-2 pb-2">
                {simulationResult ? (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <RuleComplianceCard
                      isValid={simulationResult.isValid}
                      violations={simulationResult.violations}
                      newTotals={simulationResult.newTotals}
                    />
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed border-[#5eead4]/50 text-[#5eead4] hover:bg-[#5eead4]/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleSimulate}
                    disabled={
                      simulating ||
                      !formData.symbol ||
                      !formData.quantity ||
                      !formData.price
                    }
                  >
                    {simulating ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ShieldCheck className="h-4 w-4 mr-2" />
                    )}
                    Test against Investment Rules
                  </Button>
                )}
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="hover:bg-[#333333]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-linear-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 border-0"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Adding...
                  </>
                ) : (
                  "Add Transaction"
                )}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
