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
  ShieldCheck,
  AlertTriangle,
  Percent,
  TrendingDown,
  Clock,
  BarChart3,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Target,
  PieChart,
  X,
} from "lucide-react";

type RuleType =
  | "POSITION_SIZE"
  | "STOP_LOSS"
  | "TAKE_PROFIT"
  | "SECTOR_LIMIT"
  | "TRADE_FREQUENCY";

interface TradingRule {
  id: number;
  name: string;
  description: string;
  ruleType: RuleType;
  threshold: number;
  isActive: boolean;
  violations: number;
}

// Mock data
const mockRules: TradingRule[] = [
  {
    id: 1,
    name: "Max Position Size",
    description: "No single stock should exceed 20% of portfolio value",
    ruleType: "POSITION_SIZE",
    threshold: 20,
    isActive: true,
    violations: 0,
  },
  {
    id: 2,
    name: "Stop Loss Alert",
    description: "Warn when any holding drops 15% from average buy price",
    ruleType: "STOP_LOSS",
    threshold: 15,
    isActive: true,
    violations: 1,
  },
  {
    id: 3,
    name: "Take Profit Reminder",
    description: "Consider taking profits at 30% gain",
    ruleType: "TAKE_PROFIT",
    threshold: 30,
    isActive: true,
    violations: 0,
  },
  {
    id: 4,
    name: "Banking Sector Limit",
    description: "Keep banking sector exposure under 35%",
    ruleType: "SECTOR_LIMIT",
    threshold: 35,
    isActive: false,
    violations: 0,
  },
  {
    id: 5,
    name: "Trade Frequency Limit",
    description: "Maximum 5 trades per week to avoid overtrading",
    ruleType: "TRADE_FREQUENCY",
    threshold: 5,
    isActive: true,
    violations: 2,
  },
];

const ruleTypeConfig: Record<
  RuleType,
  { icon: React.ElementType; label: string; color: string }
> = {
  POSITION_SIZE: {
    icon: Percent,
    label: "Position Size",
    color: "text-[#60a5fa]",
  },
  STOP_LOSS: {
    icon: TrendingDown,
    label: "Stop Loss",
    color: "text-[#f87171]",
  },
  TAKE_PROFIT: { icon: Target, label: "Take Profit", color: "text-[#4ade80]" },
  SECTOR_LIMIT: {
    icon: PieChart,
    label: "Sector Limit",
    color: "text-[#a78bfa]",
  },
  TRADE_FREQUENCY: { icon: Clock, label: "Frequency", color: "text-[#fbbf24]" },
};

export default function RulesPage() {
  const [showAddModal, setShowAddModal] = useState(false);

  const activeRules = mockRules.filter((r) => r.isActive);
  const totalViolations = mockRules.reduce((sum, r) => sum + r.violations, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#f5f5f5]">Trading Rules</h1>
          <p className="text-[#8a8a8a] mt-1">
            Personal discipline rules to minimize psychological trading traps
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Rule
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#8a8a8a]">Active Rules</p>
                <p className="text-2xl font-bold text-[#f5f5f5] mt-1">
                  {activeRules.length}
                  <span className="text-[#8a8a8a] text-lg font-normal">
                    /{mockRules.length}
                  </span>
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-[#4ade80]/10">
                <ShieldCheck className="h-5 w-5 text-[#4ade80]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={totalViolations > 0 ? "border-[#fbbf24]/30" : ""}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#8a8a8a]">Violations</p>
                <p
                  className={`text-2xl font-bold mt-1 ${
                    totalViolations > 0 ? "text-[#fbbf24]" : "text-[#f5f5f5]"
                  }`}
                >
                  {totalViolations}
                </p>
              </div>
              <div
                className={`p-2.5 rounded-lg ${
                  totalViolations > 0 ? "bg-[#fbbf24]/10" : "bg-[#333333]"
                }`}
              >
                <AlertTriangle
                  className={`h-5 w-5 ${
                    totalViolations > 0 ? "text-[#fbbf24]" : "text-[#8a8a8a]"
                  }`}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#8a8a8a]">Discipline Score</p>
                <p className="text-2xl font-bold text-[#4ade80] mt-1">87%</p>
              </div>
              <div className="p-2.5 rounded-lg bg-[#4ade80]/10">
                <BarChart3 className="h-5 w-5 text-[#4ade80]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#8a8a8a]">This Week</p>
                <p className="text-2xl font-bold text-[#f5f5f5] mt-1">
                  3 trades
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-[#60a5fa]/10">
                <Clock className="h-5 w-5 text-[#60a5fa]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Violations Alert */}
      {totalViolations > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-[#fbbf24]/5 border border-[#fbbf24]/20">
          <AlertTriangle className="h-5 w-5 text-[#fbbf24] shrink-0" />
          <div className="flex-1">
            <span className="font-medium text-[#fbbf24]">
              {totalViolations} rule violation{totalViolations > 1 ? "s" : ""}{" "}
              detected
            </span>
            <span className="text-[#a8a8a8] ml-1">
              — Review before making new trades
            </span>
          </div>
          <Button variant="outline" size="sm">
            View Details
          </Button>
        </div>
      )}

      {/* Rules Table */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>All Rules</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12">Status</TableHead>
                <TableHead>Rule</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Threshold</TableHead>
                <TableHead className="text-center">Violations</TableHead>
                <TableHead className="text-right w-28">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockRules.map((rule) => {
                const config = ruleTypeConfig[rule.ruleType];
                const Icon = config.icon;

                return (
                  <TableRow
                    key={rule.id}
                    className={!rule.isActive ? "opacity-50" : ""}
                  >
                    <TableCell>
                      <button className="text-[#8a8a8a] hover:text-[#f5f5f5] transition-colors">
                        {rule.isActive ? (
                          <ToggleRight className="h-5 w-5 text-[#4ade80]" />
                        ) : (
                          <ToggleLeft className="h-5 w-5" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-[#f5f5f5]">
                          {rule.name}
                        </p>
                        <p className="text-sm text-[#8a8a8a] mt-0.5">
                          {rule.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${config.color}`} />
                        <span className="text-[#a8a8a8]">{config.label}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono text-[#f5f5f5]">
                        {rule.threshold}
                        {rule.ruleType === "TRADE_FREQUENCY" ? "/wk" : "%"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {rule.violations > 0 ? (
                        <Badge variant="warning">{rule.violations}</Badge>
                      ) : (
                        <span className="text-[#666666]">—</span>
                      )}
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
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Create Trading Rule</CardTitle>
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
                <label className="text-sm font-medium text-[#a8a8a8]">
                  Rule Name
                </label>
                <Input
                  placeholder="e.g., Max Position Size"
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#a8a8a8]">
                  Rule Type
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  {Object.entries(ruleTypeConfig).map(([type, config]) => {
                    const Icon = config.icon;
                    return (
                      <Button
                        key={type}
                        variant="outline"
                        size="sm"
                        className="justify-start"
                      >
                        <Icon className={`h-4 w-4 mr-2 ${config.color}`} />
                        {config.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-[#a8a8a8]">
                  Threshold
                </label>
                <Input
                  type="number"
                  placeholder="e.g., 20"
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#a8a8a8]">
                  Description
                </label>
                <Input
                  placeholder="When should this rule trigger?"
                  className="mt-1.5"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button>Create Rule</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
