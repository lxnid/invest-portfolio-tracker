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
  Download,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  X,
  Loader2,
} from "lucide-react";
import { useTransactions, useCreateTransaction } from "@/lib/hooks";

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

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateString));
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
    executedAt: new Date().toISOString().split("T")[0],
  });

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
        .reduce((sum, t) => sum + parseFloat(t.totalAmount), 0),
      sells: transactions
        .filter((t) => t.type === "SELL")
        .reduce((sum, t) => sum + parseFloat(t.totalAmount), 0),
      dividends: transactions
        .filter((t) => t.type === "DIVIDEND")
        .reduce((sum, t) => sum + parseFloat(t.totalAmount), 0),
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
        fees: formData.fees || "0",
        executedAt: formData.executedAt,
      });
      setShowAddModal(false);
      setFormData({
        symbol: "",
        name: "",
        quantity: "",
        price: "",
        fees: "",
        executedAt: new Date().toISOString().split("T")[0],
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
                      {formatDate(transaction.executedAt)}
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
                      {parseFloat(transaction.fees).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {parseFloat(transaction.totalAmount).toLocaleString()}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Add Transaction</CardTitle>
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
                    Transaction Type
                  </label>
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
                      Price
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="mt-1.5"
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
                    <label className="text-sm font-medium text-[#a8a8a8]">
                      Fees
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="mt-1.5"
                      value={formData.fees}
                      onChange={(e) =>
                        setFormData({ ...formData, fees: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#a8a8a8]">
                      Date
                    </label>
                    <Input
                      type="date"
                      className="mt-1.5"
                      value={formData.executedAt}
                      onChange={(e) =>
                        setFormData({ ...formData, executedAt: e.target.value })
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
                  <Button type="submit" disabled={createTransaction.isPending}>
                    {createTransaction.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Add Transaction
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
