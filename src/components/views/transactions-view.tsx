"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
} from "lucide-react";
import {
  useTransactions,
  useCreateTransaction,
  useSettings,
  useHoldings,
  type Holding,
  fetchStockPrice,
} from "@/lib/hooks";
import { ALL_STOCKS } from "@/lib/stocks";

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

export function TransactionsView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TransactionType | "ALL">("ALL");
  const [showAddModal, setShowAddModal] = useState(false);

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

  const handleExport = () => {
    if (!filteredTransactions || filteredTransactions.length === 0) return;

    const headers = [
      "Date",
      "Symbol",
      "Company",
      "Type",
      "Quantity",
      "Price",
      "Fees",
      "Total Amount",
    ];

    const csvContent = [
      headers.join(","),
      ...filteredTransactions.map((t) =>
        [
          formatDate(t.date),
          t.stock.symbol,
          t.stock.name,
          t.type,
          t.quantity,
          t.price,
          t.fees || "0",
          t.totalAmount || "0",
        ]
          .map((cell) => `"${cell}"`)
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `transactions_export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-50">Transactions</h1>
          <p className="text-zinc-500 mt-1">Your complete trading history</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            className="flex-1 md:flex-none border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50"
            onClick={handleExport}
            disabled={!filteredTransactions?.length}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
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
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Transactions</p>
                <p className="text-2xl font-bold text-zinc-50 mt-1">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    (transactions?.length ?? 0)
                  )}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-800">
                <ArrowRightLeft className="h-5 w-5 text-zinc-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Total Buys</p>
                <p className="text-2xl font-bold text-emerald-500 mt-1">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    totals.buys.toLocaleString()
                  )}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-500/10">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Total Sells</p>
                <p className="text-2xl font-bold text-red-500 mt-1">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    totals.sells.toLocaleString()
                  )}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-red-500/10">
                <TrendingDown className="h-5 w-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-zinc-500">Dividends</p>
            <p className="text-2xl font-bold text-amber-500 mt-1">
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
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
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
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
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
                    <TableCell className="text-zinc-500">
                      {formatDate(transaction.date)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-zinc-50">
                          {transaction.stock.symbol}
                        </p>
                        <p className="text-sm text-zinc-500">
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
                    <TableCell className="text-right font-mono text-zinc-500">
                      {parseFloat(transaction.fees || "0").toFixed(2)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono font-semibold ${
                        transaction.type === "BUY"
                          ? "text-red-500"
                          : "text-emerald-500"
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
            <div className="text-center py-8 text-zinc-500">
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

  // Autocomplete
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

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

  // Click outside listener
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

  const filteredStocks = useMemo(() => {
    if (!formData.symbol) return [];
    const query = formData.symbol.toLowerCase();
    return ALL_STOCKS.filter(
      (s) =>
        s.symbol.toLowerCase().includes(query) ||
        s.name.toLowerCase().includes(query),
    ).slice(0, 5);
  }, [formData.symbol]);

  const handleSelectStock = async (stock: any) => {
    // Initial set with potentially stale price
    setFormData((prev) => ({
      ...prev,
      symbol: stock.symbol,
      name: stock.name,
      stockId: 0, // Id is not in static list, but backend might not need it for creation if symbol is provided?
      // Checking createTransaction.mutateAsync in PortfolioView: it sends symbol, name, sector... no stockId.
      // But TransactionModal sends stockId?
      // In TransactionsView: onSubmit({ stockId: stock.id ... })
      // If stockId is required by backend for creating transaction, we have a problem.
      // Let's check useCreateTransaction payload.
      // In hooks.ts: useCreateTransaction payload does NOT have stockId. It has symbol.
      // So stockId is likely unused or derived on backend.
      // Wait, TransactionModal sets stockId = stock.id.
      // Let's check the handleSubmit in TransactionsView.
      price: "", // Price empty until fetched
    }));
    setShowSuggestions(false);

    // Fetch real-time accurate price
    try {
      const freshData = await fetchStockPrice(stock.symbol);
      if (freshData?.price) {
        setFormData((prev) => ({
          ...prev,
          price: freshData.price.toString(),
        }));
      }
    } catch (error) {
      console.error("Failed to fetch fresh price", error);
    }
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

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-0 md:p-8">
      <Card className="w-full h-full md:h-auto md:max-h-[85vh] md:max-w-5xl bg-zinc-950 border-zinc-800 shadow-2xl rounded-none md:rounded-xl flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-800 pb-4 shrink-0">
          <CardTitle>Add Transaction</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-zinc-800"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit}>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Left Column: Input Fields */}
                <div className="space-y-6">
                  {/* Type Selection */}
                  <div>
                    <div className="flex gap-2">
                      {(["BUY", "SELL", "DIVIDEND"] as const).map((type) => (
                        <Button
                          key={type}
                          type="button"
                          variant={
                            selectedType === type ? "default" : "outline"
                          }
                          className={`flex-1 ${
                            selectedType === type && type === "BUY"
                              ? "bg-emerald-600 hover:bg-emerald-700"
                              : selectedType === type && type === "SELL"
                                ? "bg-red-600 hover:bg-red-700"
                                : ""
                          }`}
                          onClick={() => {
                            setSelectedType(type);
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
                          }}
                        >
                          {type === "DIVIDEND" ? "DIV" : type}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Symbol Selection */}
                  {selectedType === "DIVIDEND" || selectedType === "SELL" ? (
                    <div>
                      <Label className="text-zinc-500">
                        Select Stock (Active Holdings)
                      </Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1.5"
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
                                price: "",
                                fees: "0",
                              }));
                            } else {
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
                    <div className="relative" ref={wrapperRef}>
                      <Label className="text-zinc-500">Stock Symbol</Label>
                      <div className="relative mt-1.5">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <Input
                          placeholder="Search symbol..."
                          className="pl-9 font-mono uppercase"
                          value={formData.symbol}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              symbol: e.target.value,
                            });
                            setShowSuggestions(true);
                          }}
                          onFocus={() => setShowSuggestions(true)}
                          required
                        />
                      </div>
                      {showSuggestions && filteredStocks.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 overflow-hidden bg-zinc-900 border border-zinc-800 rounded-md shadow-lg">
                          {filteredStocks.map((stock) => (
                            <div
                              key={stock.symbol}
                              className="flex items-center justify-between px-4 py-3 hover:bg-zinc-800 cursor-pointer"
                              onClick={() => handleSelectStock(stock)}
                            >
                              <div>
                                <p className="font-bold text-zinc-50">
                                  {stock.symbol}
                                </p>
                                <p className="text-xs text-zinc-500">
                                  {stock.name}
                                </p>
                              </div>
                              <div className="text-right">
                                {/* Price removed */}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {formData.name && selectedType === "BUY" && (
                    <div className="text-sm text-zinc-500 px-1">
                      {formData.name}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-zinc-500">Quantity</Label>
                      <Input
                        type="number"
                        className="mt-1.5 font-mono"
                        value={formData.quantity}
                        onChange={(e) =>
                          setFormData({ ...formData, quantity: e.target.value })
                        }
                        required
                        disabled={
                          selectedType === "DIVIDEND" ||
                          selectedType === "SELL" ||
                          selectedType === "BUY"
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-500">
                        {selectedType === "DIVIDEND"
                          ? "Dividend Per Share"
                          : "Price"}
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
                      <Label className="text-zinc-500">
                        {selectedType === "DIVIDEND"
                          ? "Total Income"
                          : "Fees (1.12%)"}
                      </Label>
                      <Input
                        type="number"
                        className="mt-1.5 font-mono"
                        value={
                          selectedType === "DIVIDEND"
                            ? (
                                parseFloat(formData.quantity || "0") *
                                parseFloat(formData.price || "0")
                              ).toFixed(2)
                            : formData.fees
                        }
                        readOnly={selectedType === "DIVIDEND"}
                        onChange={
                          selectedType === "DIVIDEND"
                            ? undefined
                            : (e) =>
                                setFormData({
                                  ...formData,
                                  fees: e.target.value,
                                })
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-500">Request Date</Label>
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
                </div>

                {/* Right Column: Actions & Info */}
                <div className="flex flex-col h-full">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 flex-1 flex flex-col justify-center items-center text-center space-y-4">
                    <div className="p-4 bg-zinc-950 rounded-full border border-zinc-800">
                      {selectedType === "BUY" ? (
                        <TrendingUp className="h-8 w-8 text-emerald-500" />
                      ) : selectedType === "SELL" ? (
                        <TrendingDown className="h-8 w-8 text-red-500" />
                      ) : (
                        <ArrowRightLeft className="h-8 w-8 text-amber-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-zinc-50">
                        Confirm Transaction
                      </h3>
                      <p className="text-zinc-500 text-sm mt-1 max-w-[200px] mx-auto">
                        This will permanently add the record to your portfolio
                        history.
                      </p>
                    </div>

                    {error && (
                      <div className="w-full bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded text-sm mb-4">
                        {error}
                      </div>
                    )}

                    <div className="pt-4 w-full">
                      <Button
                        type="submit"
                        className={`w-full h-12 text-lg font-bold ${
                          selectedType === "BUY"
                            ? "bg-emerald-600 hover:bg-emerald-700"
                            : selectedType === "SELL"
                              ? "bg-red-600 hover:bg-red-700"
                              : "bg-amber-600 hover:bg-amber-700"
                        }`}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        ) : null}
                        {selectedType === "BUY" && "Execute Buy Order"}
                        {selectedType === "SELL" && "Execute Sell Order"}
                        {selectedType === "DIVIDEND" && "Record Dividend"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </form>
        </div>
      </Card>
    </div>
  );
}
