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
  Loader2,
} from "lucide-react";
import {
  useRules,
  useHoldings,
  useTransactions,
  useMarketData,
  useCreateRule,
  useDeleteRule,
  useToggleRule,
  type TradingRule,
} from "@/lib/hooks";
import {
  evaluateRules,
  getTotalViolationCount,
  calculateDisciplineScore,
  enrichHoldingsWithPrices,
} from "@/lib/rule-engine";

type RuleType = TradingRule["ruleType"];

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
  const [selectedType, setSelectedType] = useState<RuleType>("POSITION_SIZE");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    threshold: "",
  });

  const { data: rules, isLoading: rulesLoading } = useRules();
  const { data: holdings } = useHoldings();
  const { data: transactions } = useTransactions();
  const { data: marketData } = useMarketData();
  const createRule = useCreateRule();
  const deleteRule = useDeleteRule();
  const toggleRule = useToggleRule();

  // Build price map and enrich holdings
  const enrichedHoldings = useMemo(() => {
    if (!holdings || !marketData?.allStocks) return [];
    const priceMap = new Map<string, number>();
    for (const stock of marketData.allStocks) {
      priceMap.set(stock.symbol, stock.price);
    }
    return enrichHoldingsWithPrices(holdings, priceMap);
  }, [holdings, marketData]);

  // Evaluate rule violations
  const violations = useMemo(() => {
    if (!rules) return new Map();
    return evaluateRules(rules, enrichedHoldings, transactions || []);
  }, [rules, enrichedHoldings, transactions]);

  const totalViolations = getTotalViolationCount(violations);
  const activeRules = rules?.filter((r) => r.isActive) || [];
  const disciplineScore = calculateDisciplineScore(rules || [], violations);

  // Count trades this week
  const tradesThisWeek = useMemo(() => {
    if (!transactions) return 0;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return transactions.filter(
      (t) => new Date(t.date) >= oneWeekAgo && t.type !== "DIVIDEND",
    ).length;
  }, [transactions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createRule.mutateAsync({
        name: formData.name,
        description: formData.description || undefined,
        ruleType: selectedType,
        threshold: formData.threshold,
        isActive: true,
      });
      setShowAddModal(false);
      setFormData({ name: "", description: "", threshold: "" });
    } catch (error) {
      console.error("Failed to create rule:", error);
    }
  };

  const handleToggle = async (rule: TradingRule) => {
    try {
      await toggleRule.mutateAsync({ id: rule.id, isActive: !rule.isActive });
    } catch (error) {
      console.error("Failed to toggle rule:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this rule?")) {
      try {
        await deleteRule.mutateAsync(id);
      } catch (error) {
        console.error("Failed to delete rule:", error);
      }
    }
  };

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
                  {rulesLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <>
                      {activeRules.length}
                      <span className="text-[#8a8a8a] text-lg font-normal">
                        /{rules?.length || 0}
                      </span>
                    </>
                  )}
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
                <p className="text-2xl font-bold text-[#4ade80] mt-1">
                  {disciplineScore}%
                </p>
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
                  {tradesThisWeek} trades
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
        </div>
      )}

      {/* Rules Table */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>All Rules</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {rulesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#5eead4]" />
            </div>
          ) : (
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
                {rules?.map((rule) => {
                  const config = ruleTypeConfig[rule.ruleType];
                  const Icon = config.icon;
                  const ruleViolations = violations.get(rule.id)?.length || 0;

                  return (
                    <TableRow
                      key={rule.id}
                      className={!rule.isActive ? "opacity-50" : ""}
                    >
                      <TableCell>
                        <button
                          className="text-[#8a8a8a] hover:text-[#f5f5f5] transition-colors"
                          onClick={() => handleToggle(rule)}
                          disabled={toggleRule.isPending}
                        >
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
                        {ruleViolations > 0 ? (
                          <Badge variant="warning">{ruleViolations}</Badge>
                        ) : (
                          <span className="text-[#666666]">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[#f87171] hover:text-[#fca5a5]"
                            onClick={() => handleDelete(rule.id)}
                            disabled={deleteRule.isPending}
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
          )}

          {!rulesLoading && (!rules || rules.length === 0) && (
            <div className="text-center py-8 text-[#8a8a8a]">
              No rules configured. Add your first trading rule to get started.
            </div>
          )}
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
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[#a8a8a8]">
                    Rule Name
                  </label>
                  <Input
                    placeholder="e.g., Max Position Size"
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
                    Rule Type
                  </label>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    {(
                      Object.entries(ruleTypeConfig) as [
                        RuleType,
                        (typeof ruleTypeConfig)[RuleType],
                      ][]
                    ).map(([type, config]) => {
                      const Icon = config.icon;
                      return (
                        <Button
                          key={type}
                          type="button"
                          variant={
                            selectedType === type ? "default" : "outline"
                          }
                          size="sm"
                          className="justify-start"
                          onClick={() => setSelectedType(type)}
                        >
                          <Icon
                            className={`h-4 w-4 mr-2 ${selectedType === type ? "" : config.color}`}
                          />
                          {config.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#a8a8a8]">
                    Threshold{" "}
                    {selectedType === "TRADE_FREQUENCY"
                      ? "(trades per week)"
                      : "(%)"}
                  </label>
                  <Input
                    type="number"
                    placeholder={
                      selectedType === "TRADE_FREQUENCY"
                        ? "e.g., 5"
                        : "e.g., 20"
                    }
                    className="mt-1.5"
                    value={formData.threshold}
                    onChange={(e) =>
                      setFormData({ ...formData, threshold: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#a8a8a8]">
                    Description (optional)
                  </label>
                  <Input
                    placeholder="When should this rule trigger?"
                    className="mt-1.5"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createRule.isPending}>
                    {createRule.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Create Rule
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
