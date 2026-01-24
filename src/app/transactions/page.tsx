"use client";

import { useState } from "react";
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
} from "lucide-react";

type TransactionType = "BUY" | "SELL" | "DIVIDEND";

interface Transaction {
  id: number;
  symbol: string;
  name: string;
  type: TransactionType;
  quantity: number;
  price: number;
  fees: number;
  totalAmount: number;
  executedAt: string;
}

// Mock data
const mockTransactions: Transaction[] = [
  {
    id: 1,
    symbol: "LOLC.N0000",
    name: "LOLC Holdings PLC",
    type: "BUY",
    quantity: 200,
    price: 445.0,
    fees: 890.0,
    totalAmount: 89890.0,
    executedAt: "2024-01-15T10:30:00",
  },
  {
    id: 2,
    symbol: "JKH.N0000",
    name: "John Keells Holdings PLC",
    type: "BUY",
    quantity: 300,
    price: 180.0,
    fees: 540.0,
    totalAmount: 54540.0,
    executedAt: "2024-01-12T14:15:00",
  },
  {
    id: 3,
    symbol: "COMB.N0000",
    name: "Commercial Bank PLC",
    type: "DIVIDEND",
    quantity: 1000,
    price: 5.5,
    fees: 0,
    totalAmount: 5500.0,
    executedAt: "2024-01-10T09:00:00",
  },
  {
    id: 4,
    symbol: "LOLC.N0000",
    name: "LOLC Holdings PLC",
    type: "BUY",
    quantity: 300,
    price: 455.0,
    fees: 1365.0,
    totalAmount: 137865.0,
    executedAt: "2024-01-08T11:45:00",
  },
  {
    id: 5,
    symbol: "HNB.N0000",
    name: "Hatton National Bank PLC",
    type: "SELL",
    quantity: 100,
    price: 192.0,
    fees: 192.0,
    totalAmount: 19008.0,
    executedAt: "2024-01-05T15:30:00",
  },
];

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

  const filteredTransactions = mockTransactions.filter((t) => {
    const matchesSearch =
      t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "ALL" || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalBuys = mockTransactions
    .filter((t) => t.type === "BUY")
    .reduce((sum, t) => sum + t.totalAmount, 0);

  const totalSells = mockTransactions
    .filter((t) => t.type === "SELL")
    .reduce((sum, t) => sum + t.totalAmount, 0);

  const totalDividends = mockTransactions
    .filter((t) => t.type === "DIVIDEND")
    .reduce((sum, t) => sum + t.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Transactions
          </h1>
          <p className="text-neutral-500 mt-1">Your complete trading history</p>
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
                <p className="text-xs text-neutral-500 uppercase tracking-wider">
                  Transactions
                </p>
                <p className="text-2xl font-bold text-white mt-1">
                  {mockTransactions.length}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.03]">
                <ArrowRightLeft className="h-5 w-5 text-neutral-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wider">
                  Total Buys
                </p>
                <p className="text-2xl font-bold text-[#00ff88] mt-1">
                  {totalBuys.toLocaleString()}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-[#00ff88]/10">
                <TrendingUp className="h-5 w-5 text-[#00ff88]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wider">
                  Total Sells
                </p>
                <p className="text-2xl font-bold text-[#ff4757] mt-1">
                  {totalSells.toLocaleString()}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-[#ff4757]/10">
                <TrendingDown className="h-5 w-5 text-[#ff4757]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-neutral-500 uppercase tracking-wider">
              Dividends
            </p>
            <p className="text-2xl font-bold text-[#ffc107] mt-1">
              {totalDividends.toLocaleString()}
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
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600" />
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
                  <TableCell className="text-neutral-400">
                    {formatDate(transaction.executedAt)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-semibold text-white">
                        {transaction.symbol}
                      </p>
                      <p className="text-sm text-neutral-500">
                        {transaction.name}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(transaction.type)}</TableCell>
                  <TableCell className="text-right font-mono">
                    {transaction.quantity.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {transaction.price.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-neutral-500">
                    {transaction.fees.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">
                    {transaction.totalAmount.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredTransactions.length === 0 && (
            <div className="text-center py-8 text-neutral-500">
              No transactions found.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
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
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Transaction Type
                </label>
                <div className="flex gap-2 mt-1.5">
                  <Button variant="outline" className="flex-1">
                    BUY
                  </Button>
                  <Button variant="outline" className="flex-1">
                    SELL
                  </Button>
                  <Button variant="outline" className="flex-1">
                    DIV
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Stock Symbol
                </label>
                <Input placeholder="e.g., LOLC.N0000" className="mt-1.5" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                    Quantity
                  </label>
                  <Input type="number" placeholder="0" className="mt-1.5" />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                    Price
                  </label>
                  <Input type="number" placeholder="0.00" className="mt-1.5" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                    Fees
                  </label>
                  <Input type="number" placeholder="0.00" className="mt-1.5" />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                    Date
                  </label>
                  <Input type="date" className="mt-1.5" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button>Add Transaction</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
