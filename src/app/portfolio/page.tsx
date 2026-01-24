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
  TrendingUp,
  TrendingDown,
  Pencil,
  Trash2,
} from "lucide-react";

// Mock data - will be replaced with database queries
const mockHoldings = [
  {
    id: 1,
    symbol: "LOLC.N0000",
    name: "LOLC Holdings PLC",
    quantity: 500,
    avgBuyPrice: 450.0,
    currentPrice: 562.0,
    totalInvested: 225000,
    currentValue: 281000,
    profitLoss: 56000,
    profitLossPercent: 24.89,
  },
  {
    id: 2,
    symbol: "JKH.N0000",
    name: "John Keells Holdings PLC",
    quantity: 300,
    avgBuyPrice: 180.0,
    currentPrice: 172.25,
    totalInvested: 54000,
    currentValue: 51675,
    profitLoss: -2325,
    profitLossPercent: -4.31,
  },
  {
    id: 3,
    symbol: "COMB.N0000",
    name: "Commercial Bank of Ceylon PLC",
    quantity: 1000,
    avgBuyPrice: 95.0,
    currentPrice: 108.5,
    totalInvested: 95000,
    currentValue: 108500,
    profitLoss: 13500,
    profitLossPercent: 14.21,
  },
  {
    id: 4,
    symbol: "HNB.N0000",
    name: "Hatton National Bank PLC",
    quantity: 400,
    avgBuyPrice: 185.0,
    currentPrice: 198.25,
    totalInvested: 74000,
    currentValue: 79300,
    profitLoss: 5300,
    profitLossPercent: 7.16,
  },
];

export default function PortfolioPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredHoldings = mockHoldings.filter(
    (h) =>
      h.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalInvested = mockHoldings.reduce(
    (sum, h) => sum + h.totalInvested,
    0,
  );
  const totalValue = mockHoldings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalPL = totalValue - totalInvested;
  const totalPLPercent = (totalPL / totalInvested) * 100;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100">Portfolio</h1>
          <p className="text-zinc-400 mt-1">Manage your stock holdings</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Stock
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-zinc-100">
              LKR {totalValue.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Total Invested
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-zinc-100">
              LKR {totalInvested.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Total P/L
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <p
                className={`text-2xl font-bold ${
                  totalPL >= 0 ? "text-emerald-500" : "text-red-500"
                }`}
              >
                {totalPL >= 0 ? "+" : ""}LKR {totalPL.toLocaleString()}
              </p>
              {totalPL >= 0 ? (
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
            </div>
            <p
              className={`text-sm ${
                totalPL >= 0 ? "text-emerald-500" : "text-red-500"
              }`}
            >
              {totalPLPercent >= 0 ? "+" : ""}
              {totalPLPercent.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Holdings Count
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-zinc-100">
              {mockHoldings.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Holdings Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Holdings</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                placeholder="Search stocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Company</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Avg. Buy Price</TableHead>
                <TableHead className="text-right">Current Price</TableHead>
                <TableHead className="text-right">Current Value</TableHead>
                <TableHead className="text-right">P/L</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHoldings.map((holding) => (
                <TableRow key={holding.id}>
                  <TableCell className="font-medium">
                    {holding.symbol}
                  </TableCell>
                  <TableCell className="text-zinc-400">
                    {holding.name}
                  </TableCell>
                  <TableCell className="text-right">
                    {holding.quantity.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {holding.avgBuyPrice.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {holding.currentPrice.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    LKR {holding.currentValue.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span
                        className={
                          holding.profitLoss >= 0
                            ? "text-emerald-500"
                            : "text-red-500"
                        }
                      >
                        {holding.profitLoss >= 0 ? "+" : ""}
                        {holding.profitLoss.toLocaleString()}
                      </span>
                      <Badge
                        variant={
                          holding.profitLoss >= 0 ? "success" : "destructive"
                        }
                      >
                        {holding.profitLossPercent >= 0 ? "+" : ""}
                        {holding.profitLossPercent.toFixed(2)}%
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredHoldings.length === 0 && (
            <div className="text-center py-8 text-zinc-500">
              No holdings found. Add your first stock to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Stock Modal Placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add Stock to Portfolio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-zinc-400">Search Stock</label>
                <Input placeholder="e.g., LOLC.N0000" className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-zinc-400">Quantity</label>
                  <Input type="number" placeholder="0" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm text-zinc-400">
                    Avg. Buy Price
                  </label>
                  <Input type="number" placeholder="0.00" className="mt-1" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button>Add Stock</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
