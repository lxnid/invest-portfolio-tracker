"use client";

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
  Download,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  X,
  Loader2,
  Calculator,
} from "lucide-react";
import {
  useTransactions,
  useCreateTransaction,
  useMarketData,
  useSettings,
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#f5f5f5]">Transactions</h1>
          <p className="text-[#8a8a8a] mt-1">Your complete trading history</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
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
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle>Transaction History</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666666]" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-1">
                {(["ALL", "BUY", "SELL", "DIVIDEND"] as const).map((type) => (
                  <Button
                    key={type}
                    variant={typeFilter === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTypeFilter(type)}
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
  const [selectedType, setSelectedType] = useState<TransactionType>("BUY");
  const [formData, setFormData] = useState({
    symbol: "",
    name: "",
    quantity: "",
    price: "",
    fees: "",
    date: new Date().toISOString().split("T")[0],
  });

  // Autocomplete
  const [showSuggestions, setShowSuggestions] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wrapperRef = useRef<any>(null);

  // Capital Allocation
  const [allocationPercent, setAllocationPercent] = useState<number>(0);
  const totalCapital = parseFloat(settings?.capital || "0"); // This might need to be "available capital" ideally, but request said "from capital shown"

  // Auto-calculate fees
  useEffect(() => {
    const qty = parseFloat(formData.quantity);
    const price = parseFloat(formData.price);
    if (!isNaN(qty) && !isNaN(price) && qty > 0 && price > 0) {
      const fees = (qty * price * 0.0112).toFixed(2);
      setFormData((prev) => ({ ...prev, fees }));
    }
  }, [formData.quantity, formData.price]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      symbol: formData.symbol.toUpperCase(),
      name: formData.name,
      type: selectedType,
      quantity: parseInt(formData.quantity),
      price: formData.price,
      fees: formData.fees,
      executedAt: new Date(formData.date).toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-lg mx-4 bg-[#1e1e1e] border-[#333333] shadow-2xl">
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
              <Label className="text-[#a8a8a8]">Transaction Type</Label>
              <div className="flex gap-2 mt-1.5">
                {(["BUY", "SELL", "DIVIDEND"] as const).map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={selectedType === type ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setSelectedType(type)}
                  >
                    {type === "DIVIDEND" ? "DIV" : type}
                  </Button>
                ))}
              </div>
            </div>

            {/* Symbol Autocomplete */}
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

            <div>
              <Label className="text-[#a8a8a8]">Company Name</Label>
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
                    Total Capital:{" "}
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
                />
              </div>
              <div>
                <Label className="text-[#a8a8a8]">Price</Label>
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
                <Label className="text-[#a8a8a8]">Fees (1.12%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  className="mt-1.5 font-mono text-[#a8a8a8]"
                  value={formData.fees}
                  onChange={(e) =>
                    setFormData({ ...formData, fees: e.target.value })
                  }
                />
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
              >
                Add Transaction
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
