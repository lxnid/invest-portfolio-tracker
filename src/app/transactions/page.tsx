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
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
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

// Mock data - will be replaced with database queries
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
      return <Badge variant="warning">DIVIDEND</Badge>;
  }
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100">Transactions</h1>
          <p className="text-zinc-400 mt-1">Your complete trading history</p>
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
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Total Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-zinc-500" />
              <p className="text-2xl font-bold text-zinc-100">
                {mockTransactions.length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Total Buys
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <p className="text-2xl font-bold text-emerald-500">
                LKR {totalBuys.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Total Sells
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <p className="text-2xl font-bold text-red-500">
                LKR {totalSells.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Dividends Received
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-500">
              LKR {totalDividends.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle>Transaction History</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  placeholder="Search transactions..."
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
                    {type}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Fees</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="text-zinc-400">
                    {formatDate(transaction.executedAt)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{transaction.symbol}</p>
                      <p className="text-sm text-zinc-500">
                        {transaction.name}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(transaction.type)}</TableCell>
                  <TableCell className="text-right">
                    {transaction.quantity.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    LKR {transaction.price.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right text-zinc-400">
                    LKR {transaction.fees.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    LKR {transaction.totalAmount.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredTransactions.length === 0 && (
            <div className="text-center py-8 text-zinc-500">
              No transactions found.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Transaction Modal Placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add Transaction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-zinc-400">
                  Transaction Type
                </label>
                <div className="flex gap-2 mt-1">
                  <Button variant="outline" className="flex-1">
                    BUY
                  </Button>
                  <Button variant="outline" className="flex-1">
                    SELL
                  </Button>
                  <Button variant="outline" className="flex-1">
                    DIVIDEND
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm text-zinc-400">Stock Symbol</label>
                <Input placeholder="e.g., LOLC.N0000" className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-zinc-400">Quantity</label>
                  <Input type="number" placeholder="0" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm text-zinc-400">
                    Price per Share
                  </label>
                  <Input type="number" placeholder="0.00" className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-zinc-400">Fees</label>
                  <Input type="number" placeholder="0.00" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm text-zinc-400">Date</label>
                  <Input type="date" className="mt-1" />
                </div>
              </div>
              <div>
                <label className="text-sm text-zinc-400">
                  Notes (optional)
                </label>
                <Input placeholder="Add notes..." className="mt-1" />
              </div>
              <div className="flex justify-end gap-2 pt-4">
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
