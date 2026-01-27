"use client";

import { useState, useMemo, Fragment } from "react";
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
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  AlertTriangle,
  Percent,
  TrendingDown,
  TrendingUp,
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
  useUpdateRule,
  useSettings,
  type TradingRule,
} from "@/lib/hooks";
import {
  evaluateRules,
  getTotalViolationCount,
  calculateDisciplineScore,
  enrichHoldingsWithPrices,
  type RuleViolation,
} from "@/lib/rule-engine";

type RuleType = TradingRule["ruleType"];

const ruleTypeConfig: Record<
  RuleType,
  { icon: React.ElementType; label: string; color: string }
> = {
  POSITION_SIZE: {
    icon: Percent,
    label: "Position Size",
    color: "text-blue-400",
  },
  STOP_LOSS: {
    icon: TrendingDown,
    label: "Stop Loss",
    color: "text-red-400",
  },
  TAKE_PROFIT: {
    icon: Target,
    label: "Take Profit",
    color: "text-emerald-400",
  },
  SECTOR_LIMIT: {
    icon: PieChart,
    label: "Sector Limit",
    color: "text-purple-400",
  },
  TRADE_FREQUENCY: { icon: Clock, label: "Frequency", color: "text-amber-400" },
  CASH_BUFFER: {
    icon: ShieldCheck,
    label: "Cash Buffer",
    color: "text-emerald-500",
  },
  BUY_CONDITION: {
    icon: TrendingDown,
    label: "Buy Signal",
    color: "text-blue-500",
  },
  SELL_CONDITION: {
    icon: TrendingUp,
    label: "Sell Signal",
    color: "text-rose-500",
  },
};

export function AlertsView() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedRules, setExpandedRules] = useState<number[]>([]);
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
  const { data: settings } = useSettings();
  const createRule = useCreateRule();
  const updateRule = useUpdateRule();
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
    return evaluateRules(rules, enrichedHoldings, transactions || [], settings);
  }, [rules, enrichedHoldings, transactions, settings]);

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
      if (editingId) {
        await updateRule.mutateAsync({
          id: editingId,
          name: formData.name,
          description: formData.description || undefined,
          ruleType: selectedType,
          threshold: formData.threshold,
          isActive: true,
        });
      } else {
        await createRule.mutateAsync({
          name: formData.name,
          description: formData.description || undefined,
          ruleType: selectedType,
          threshold: formData.threshold,
          isActive: true,
        });
      }
      setShowAddModal(false);
      setEditingId(null);
      setFormData({ name: "", description: "", threshold: "" });
    } catch (error) {
      console.error("Failed to save alert:", error);
    }
  };

  const handleEdit = (rule: TradingRule) => {
    setEditingId(rule.id);
    setFormData({
      name: rule.name,
      description: rule.description || "",
      threshold: rule.threshold,
    });
    setSelectedType(rule.ruleType);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingId(null);
    setFormData({ name: "", description: "", threshold: "" });
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
          <h1 className="text-3xl font-bold text-zinc-50">Trading Alerts</h1>
          <p className="text-zinc-500 mt-1">
            Market monitors and portfolio alerts
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null);
            setFormData({ name: "", description: "", threshold: "" });
            setShowAddModal(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Alert
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Active Alerts</p>
                <p className="text-2xl font-bold text-zinc-50 mt-1">
                  {rulesLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <>
                      {activeRules.length}
                      <span className="text-zinc-500 text-lg font-normal">
                        /{rules?.length || 0}
                      </span>
                    </>
                  )}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-500/10">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={totalViolations > 0 ? "border-amber-500/30" : ""}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Violations</p>
                <p
                  className={`text-2xl font-bold mt-1 ${
                    totalViolations > 0 ? "text-amber-500" : "text-zinc-50"
                  }`}
                >
                  {totalViolations}
                </p>
              </div>
              <div
                className={`p-2.5 rounded-lg ${
                  totalViolations > 0 ? "bg-amber-500/10" : "bg-zinc-800"
                }`}
              >
                <AlertTriangle
                  className={`h-5 w-5 ${
                    totalViolations > 0 ? "text-amber-500" : "text-zinc-500"
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
                <p className="text-sm text-zinc-500">Discipline Score</p>
                <p className="text-2xl font-bold text-emerald-500 mt-1">
                  {disciplineScore}%
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-500/10">
                <BarChart3 className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">This Week</p>
                <p className="text-2xl font-bold text-zinc-50 mt-1">
                  {tradesThisWeek} trades
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-500/10">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Violations Alert */}
      {totalViolations > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
          <div className="flex-1">
            <span className="font-medium text-amber-500">
              {totalViolations} rule violation{totalViolations > 1 ? "s" : ""}{" "}
              detected
            </span>
            <span className="text-zinc-400 ml-1">
              — Review before making new trades
            </span>
          </div>
        </div>
      )}

      {/* Rules Table */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>All Alerts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {rulesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12">Status</TableHead>
                  <TableHead>Alert Config</TableHead>
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
                  const ruleViolations = violations.get(rule.id) || [];
                  const count = ruleViolations.length;
                  const isExpanded = expandedRules.includes(rule.id);

                  const toggleExpand = () => {
                    setExpandedRules((prev) =>
                      prev.includes(rule.id)
                        ? prev.filter((id) => id !== rule.id)
                        : [...prev, rule.id],
                    );
                  };

                  return (
                    <Fragment key={rule.id}>
                      <TableRow
                        className={`${!rule.isActive ? "opacity-50" : ""} cursor-pointer hover:bg-zinc-900`}
                        onClick={toggleExpand}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <button
                            className="text-zinc-500 hover:text-zinc-50 transition-colors"
                            onClick={() => handleToggle(rule)}
                            disabled={toggleRule.isPending}
                          >
                            {rule.isActive ? (
                              <ToggleRight className="h-5 w-5 text-emerald-500" />
                            ) : (
                              <ToggleLeft className="h-5 w-5" />
                            )}
                          </button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {count > 0 && (
                              <div className="text-zinc-500">
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-zinc-50">
                                {rule.name}
                              </p>
                              <p className="text-sm text-zinc-500 mt-0.5">
                                {rule.description}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${config.color}`} />
                            <span className="text-zinc-400">
                              {config.label}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-mono text-zinc-50">
                            {rule.threshold}
                            {rule.ruleType === "TRADE_FREQUENCY" ? "/wk" : "%"}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {count > 0 ? (
                            <Badge variant="warning">{count}</Badge>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(rule)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-400"
                              onClick={() => handleDelete(rule.id)}
                              disabled={deleteRule.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {isExpanded && count > 0 && (
                        <TableRow className="bg-zinc-900/50 hover:bg-zinc-900/50 border-0">
                          <TableCell colSpan={6} className="p-0">
                            <div className="p-4 space-y-2 border-l-2 border-amber-500 ml-4 bg-zinc-950">
                              {ruleViolations.map(
                                (v: RuleViolation, i: number) => (
                                  <div
                                    key={i}
                                    className="flex items-start gap-2 text-sm"
                                  >
                                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                                    <div>
                                      <p className="text-zinc-50">
                                        {v.message}
                                      </p>
                                      {v.impact && (
                                        <p className="text-zinc-500 text-xs mt-1">
                                          {v.impact}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {!rulesLoading && (!rules || rules.length === 0) && (
            <div className="text-center py-8 text-zinc-500">
              No alerts configured. Add your first trading alert to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Alert Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-md mx-4 bg-zinc-950 border-zinc-800 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {editingId ? "Edit Trading Alert" : "Create Trading Alert"}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-zinc-800"
                onClick={closeModal}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-500">
                    Alert Name
                  </label>
                  <Input
                    placeholder="e.g., Max Position Size"
                    className="mt-1.5 bg-zinc-900 border-zinc-800"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-500">
                    Alert Type
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
                          className={`justify-start ${selectedType === type ? "bg-zinc-50 text-zinc-900 hover:bg-zinc-200" : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800"}`}
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
                  <label className="text-sm font-medium text-zinc-500">
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
                    className="mt-1.5 bg-zinc-900 border-zinc-800"
                    value={formData.threshold}
                    onChange={(e) =>
                      setFormData({ ...formData, threshold: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-500">
                    Description (optional)
                  </label>
                  <Input
                    placeholder="When should this alert trigger?"
                    className="mt-1.5 bg-zinc-900 border-zinc-800"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={closeModal}
                    className="hover:bg-zinc-800 text-zinc-400"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createRule.isPending || updateRule.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {createRule.isPending || updateRule.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {editingId ? "Update Alert" : "Create Alert"}
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
