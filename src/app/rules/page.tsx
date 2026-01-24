"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Power,
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

const ruleTypeIcons: Record<RuleType, React.ElementType> = {
  POSITION_SIZE: Percent,
  STOP_LOSS: TrendingDown,
  TAKE_PROFIT: BarChart3,
  SECTOR_LIMIT: BarChart3,
  TRADE_FREQUENCY: Clock,
};

const ruleTypeColors: Record<RuleType, string> = {
  POSITION_SIZE: "text-blue-400 bg-blue-500/20",
  STOP_LOSS: "text-red-400 bg-red-500/20",
  TAKE_PROFIT: "text-emerald-400 bg-emerald-500/20",
  SECTOR_LIMIT: "text-purple-400 bg-purple-500/20",
  TRADE_FREQUENCY: "text-amber-400 bg-amber-500/20",
};

export default function RulesPage() {
  const [showAddModal, setShowAddModal] = useState(false);

  const activeRules = mockRules.filter((r) => r.isActive);
  const totalViolations = mockRules.reduce((sum, r) => sum + r.violations, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100">Trading Rules</h1>
          <p className="text-zinc-400 mt-1">
            Personal discipline rules to avoid psychological trading traps
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Rule
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Active Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <p className="text-2xl font-bold text-zinc-100">
                {activeRules.length}
              </p>
              <span className="text-zinc-500">/ {mockRules.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card className={totalViolations > 0 ? "border-amber-500/50" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Current Violations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle
                className={`h-5 w-5 ${
                  totalViolations > 0 ? "text-amber-500" : "text-zinc-500"
                }`}
              />
              <p
                className={`text-2xl font-bold ${
                  totalViolations > 0 ? "text-amber-500" : "text-zinc-100"
                }`}
              >
                {totalViolations}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Discipline Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-emerald-400">87%</p>
              <span className="text-sm text-zinc-500">This month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Violations Alert */}
      {totalViolations > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-400">
                  Rule Violations Detected
                </h3>
                <p className="text-zinc-400 mt-1">
                  You have {totalViolations} active rule violation(s). Review
                  your portfolio to address these issues before making new
                  trades.
                </p>
                <Button variant="outline" size="sm" className="mt-3">
                  Review Violations
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rules Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {mockRules.map((rule) => {
          const Icon = ruleTypeIcons[rule.ruleType];
          const colorClass = ruleTypeColors[rule.ruleType];

          return (
            <Card
              key={rule.id}
              className={`${!rule.isActive ? "opacity-60" : ""} ${
                rule.violations > 0 ? "border-amber-500/50" : ""
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-zinc-100">
                          {rule.name}
                        </h3>
                        {rule.violations > 0 && (
                          <Badge variant="warning">
                            {rule.violations} violation
                            {rule.violations > 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-zinc-400 mt-1">
                        {rule.description}
                      </p>
                      <div className="flex items-center gap-4 mt-3">
                        <Badge variant="outline">
                          Threshold: {rule.threshold}
                          {rule.ruleType === "POSITION_SIZE" ||
                          rule.ruleType === "STOP_LOSS" ||
                          rule.ruleType === "TAKE_PROFIT" ||
                          rule.ruleType === "SECTOR_LIMIT"
                            ? "%"
                            : " trades/week"}
                        </Badge>
                        <Badge variant={rule.isActive ? "success" : "outline"}>
                          {rule.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Power className="h-4 w-4" />
                    </Button>
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
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Rule Modal Placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create Trading Rule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-zinc-400">Rule Name</label>
                <Input placeholder="e.g., Max Position Size" className="mt-1" />
              </div>
              <div>
                <label className="text-sm text-zinc-400">Rule Type</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <Button variant="outline" size="sm">
                    Position Size
                  </Button>
                  <Button variant="outline" size="sm">
                    Stop Loss
                  </Button>
                  <Button variant="outline" size="sm">
                    Take Profit
                  </Button>
                  <Button variant="outline" size="sm">
                    Sector Limit
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm text-zinc-400">Threshold (%)</label>
                <Input type="number" placeholder="e.g., 20" className="mt-1" />
              </div>
              <div>
                <label className="text-sm text-zinc-400">Description</label>
                <Input
                  placeholder="Describe when this rule should trigger"
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
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
