"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
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
  Calculator,
  Trash2,
  X,
  RotateCcw,
  Sparkles,
  Info,
  Save,
  FolderOpen,
} from "lucide-react";
import { useMarketData, useSettings, fetchStockPrice } from "@/lib/hooks";
import {
  calculateAllocation,
  StockEntry,
  Tranche,
  SimulationResult,
  CombinedStockResult,
} from "@/lib/simulator";
import { Badge } from "@/components/ui/badge";

export default function PortfolioSimulatorPage() {
  // Global State
  const { data: settings } = useSettings();
  const { data: marketData } = useMarketData();

  const [investmentCapital, setInvestmentCapital] = useState<string>("");
  const [step, setStep] = useState<number>(10);

  // Stock Entries (with nested tranches)
  const [stocks, setStocks] = useState<StockEntry[]>([]);

  // Simulation Results
  const [results, setResults] = useState<SimulationResult[] | null>(null);
  const [combinedResults, setCombinedResults] = useState<
    CombinedStockResult[] | null
  >(null);
  const [simulationSummary, setSimulationSummary] = useState<{
    totalCost: number;
    totalFees: number;
    remainingCapital: number;
  } | null>(null);

  // Search/Add State
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Save State
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSimulation = async () => {
    if (!saveName.trim()) return;
    setIsSaving(true);
    try {
      const config = {
        investmentCapital,
        step,
        stocks,
      };

      const res = await fetch("/api/simulations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: saveName, configuration: config }),
      });

      if (res.ok) {
        setIsSaveModalOpen(false);
        setSaveName("");
        // Optional: Trigger a refresh or notification
      }
    } catch (e) {
      console.error("Failed to save", e);
    } finally {
      setIsSaving(false);
    }
  };

  // Load State
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [savedSimulations, setSavedSimulations] = useState<any[]>([]);
  const [isLoadingSimulations, setIsLoadingSimulations] = useState(false);

  const fetchSavedSimulations = async () => {
    setIsLoadingSimulations(true);
    try {
      const res = await fetch("/api/simulations");
      if (res.ok) {
        const data = await res.json();
        setSavedSimulations(data);
      }
    } catch (e) {
      console.error("Failed to load simulations", e);
    } finally {
      setIsLoadingSimulations(false);
    }
  };

  useEffect(() => {
    if (isLoadModalOpen) {
      fetchSavedSimulations();
    }
  }, [isLoadModalOpen]);

  const handleLoadSimulation = (sim: any) => {
    const config = sim.configuration;
    if (config) {
      setInvestmentCapital(config.investmentCapital || "");
      setStep(config.step || 10);
      setStocks(config.stocks || []);
      setResults(null); // Clear previous results
      setIsLoadModalOpen(false);
    }
  };

  // Initialize capital from settings once loaded
  useEffect(() => {
    if (settings?.capital && !investmentCapital) {
      setInvestmentCapital(settings.capital);
    }
  }, [settings, investmentCapital]);

  // Stocks for autocomplete
  const availableStocks = useMemo(() => {
    return marketData?.allStocks || [];
  }, [marketData]);

  const filteredStocks = useMemo(() => {
    if (!searchQuery) return [];
    const query = searchQuery.toLowerCase();

    return availableStocks
      .filter(
        (s) =>
          s.symbol.toLowerCase().includes(query) ||
          s.name.toLowerCase().includes(query),
      )
      .slice(0, 5);
  }, [availableStocks, searchQuery]);

  // Click outside to close suggestions
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

  const handleAddStock = async (stock: any) => {
    // Fetch fresh price first for accuracy
    let currentPrice = stock.price;
    try {
      const freshData = await fetchStockPrice(stock.symbol);
      if (freshData?.price) {
        currentPrice = freshData.price;
      }
    } catch (e) {
      console.error("Failed to fetch fresh price", e);
    }

    // Check if this symbol already exists
    const existingStock = stocks.find((s) => s.symbol === stock.symbol);

    if (existingStock) {
      // Add a new tranche to the existing stock using fresh price
      handleAddTranche(existingStock.id, currentPrice);
    } else {
      // Create new stock entry with one default tranche using fresh price
      const stockId = `${stock.symbol}-${Date.now()}`;
      const trancheId = `${stockId}-t1`;

      setStocks((prev) => [
        ...prev,
        {
          id: stockId,
          symbol: stock.symbol,
          allocationPercent: 0,
          isPriority: false,
          tranches: [
            {
              id: trancheId,
              price: currentPrice,
              percent: 100, // Single tranche gets 100% of this stock's allocation
              label: undefined,
            },
          ],
        },
      ]);
    }

    setSearchQuery("");
    setShowSuggestions(false);
    setResults(null);
    setCombinedResults(null);
  };

  const handleAddTranche = (stockId: string, defaultPrice?: number) => {
    setStocks((prev) =>
      prev.map((stock) => {
        if (stock.id !== stockId) return stock;

        const trancheNum = stock.tranches.length + 1;
        const newTrancheId = `${stockId}-t${trancheNum}-${Date.now()}`;

        // Redistribute percentages evenly
        const newPercent = Math.floor(100 / (stock.tranches.length + 1));
        const updatedTranches = stock.tranches.map((t) => ({
          ...t,
          percent: newPercent,
        }));

        // Give remainder to new tranche
        const remainder = 100 - newPercent * stock.tranches.length;

        return {
          ...stock,
          tranches: [
            ...updatedTranches,
            {
              id: newTrancheId,
              price: defaultPrice || stock.tranches[0]?.price || 0,
              percent: remainder,
              label: `Tranche ${trancheNum}`,
            },
          ],
        };
      }),
    );
    setResults(null);
    setCombinedResults(null);
  };

  const updateStock = (
    stockId: string,
    updates: Partial<Omit<StockEntry, "tranches">>,
  ) => {
    setStocks((prev) =>
      prev.map((stock) =>
        stock.id === stockId ? { ...stock, ...updates } : stock,
      ),
    );
    setResults(null);
    setCombinedResults(null);
  };

  const updateTranche = (
    stockId: string,
    trancheId: string,
    updates: Partial<Tranche>,
  ) => {
    setStocks((prev) =>
      prev.map((stock) => {
        if (stock.id !== stockId) return stock;
        return {
          ...stock,
          tranches: stock.tranches.map((t) =>
            t.id === trancheId ? { ...t, ...updates } : t,
          ),
        };
      }),
    );
    setResults(null);
    setCombinedResults(null);
  };

  const removeTranche = (stockId: string, trancheId: string) => {
    setStocks((prev) =>
      prev
        .map((stock) => {
          if (stock.id !== stockId) return stock;
          const remaining = stock.tranches.filter((t) => t.id !== trancheId);
          // If no tranches left, return null to filter out
          if (remaining.length === 0) return null as any;
          // Redistribute percentages
          const perTranche = Math.floor(100 / remaining.length);
          const last = 100 - perTranche * (remaining.length - 1);
          return {
            ...stock,
            tranches: remaining.map((t, i) => ({
              ...t,
              percent: i === remaining.length - 1 ? last : perTranche,
            })),
          };
        })
        .filter(Boolean),
    );
    setResults(null);
    setCombinedResults(null);
  };

  const removeStock = (stockId: string) => {
    setStocks((prev) => prev.filter((s) => s.id !== stockId));
    setResults(null);
    setCombinedResults(null);
  };

  const handleRunSimulation = () => {
    const capital = parseFloat(investmentCapital);
    if (isNaN(capital) || capital <= 0) return;

    const output = calculateAllocation(capital, stocks, step);
    setResults(output.results);
    setCombinedResults(output.combinedResults);
    setSimulationSummary({
      totalCost: output.totalCost,
      totalFees: output.totalFees,
      remainingCapital: output.remainingCapital,
    });
  };

  // Sum of target allocations (how much capital is designated to each entry)
  const totalAllocation = stocks.reduce(
    (sum, s) => sum + s.allocationPercent,
    0,
  );

  // Effective investment = sum of all allocations (100% of each stock's allocation now)
  // Since tranches within each stock sum to 100%, effective = total allocation
  const effectiveInvestment = totalAllocation;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#f5f5f5] flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-[#5eead4]" />
            Portfolio Simulator
          </h1>
          <p className="text-[#8a8a8a] mt-1">
            Optimize your portfolio allocation with advanced rounding and
            tranche logic.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            onClick={() => setIsLoadModalOpen(true)}
            className="border-[#333333] hover:bg-[#262626]"
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            Load
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsSaveModalOpen(true)}
            className="border-[#333333] hover:bg-[#262626]"
            disabled={stocks.length === 0}
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setStocks([]);
              setResults(null);
            }}
            className="border-[#333333] hover:bg-[#262626]"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Left Column: Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-[#333333] bg-[#1e1e1e]">
            <CardHeader className="pb-3 border-b border-[#2f2f2f]">
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Inputs Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[#a8a8a8]">
                    Simulation Capital (LKR)
                  </Label>
                  <Input
                    type="number"
                    value={investmentCapital}
                    onChange={(e) => {
                      setInvestmentCapital(e.target.value);
                      setResults(null);
                    }}
                    className="font-mono text-lg bg-[#262626] border-none"
                    placeholder="Enter amount..."
                  />
                  <p className="text-xs text-[#666666]">
                    Adjust this to leave a cash buffer.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#a8a8a8]">Share Rounding Step</Label>
                  <div className="flex gap-2">
                    {[10, 50, 100, 1000].map((val) => (
                      <Button
                        key={val}
                        onClick={() => {
                          setStep(val);
                          setResults(null);
                        }}
                        variant={step === val ? "default" : "outline"}
                        className={
                          step === val
                            ? "bg-[#5eead4] text-black hover:bg-[#5eead4]/90"
                            : "bg-[#262626] border-transparent text-[#a8a8a8] hover:bg-[#333333]"
                        }
                        size="sm"
                      >
                        {val}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-[#666666]">
                    Shares will be rounded to nearest {step}.
                  </p>
                </div>
              </div>

              {/* Stock List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-[#a8a8a8]">Asset Allocation</Label>
                  <div className="flex items-center gap-3 text-sm font-mono">
                    <span
                      className={`${totalAllocation > 100 ? "text-[#f87171]" : totalAllocation === 100 ? "text-[#4ade80]" : "text-[#facc15]"}`}
                    >
                      Total: {totalAllocation}%
                    </span>
                    <span className="text-[#666666]">|</span>
                    <span
                      className="text-[#5eead4]"
                      title="Effective investment considering tranche %"
                    >
                      Invest: {effectiveInvestment.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {stocks.map((stock) => (
                  <div
                    key={stock.id}
                    className="p-4 bg-[#262626] rounded-lg border border-[#333333] animate-in fade-in slide-in-from-bottom-2"
                  >
                    {/* Stock Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-[#333333] flex items-center justify-center font-bold text-[#f5f5f5] text-lg">
                          {stock.symbol[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#f5f5f5] text-lg">
                              {stock.symbol}
                            </span>
                            {stock.tranches.length > 1 && (
                              <Badge
                                variant="outline"
                                className="text-xs text-[#e879f9] border-[#e879f9]/30"
                              >
                                {stock.tranches.length} tranches
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-[#666666]">
                            {stock.allocationPercent}% of capital
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-[#5eead4] hover:text-[#5eead4]/80"
                          onClick={() => handleAddTranche(stock.id)}
                        >
                          + Tranche
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-[#666666] hover:text-[#f87171]"
                          onClick={() => removeStock(stock.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Stock-level Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center mb-4 pb-4 border-b border-[#333333]">
                      {/* Target Allocation */}
                      <div className="md:col-span-8 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-[#a8a8a8]">
                            Target Allocation
                          </span>
                          <span className="font-mono text-[#5eead4]">
                            {stock.allocationPercent}%
                          </span>
                        </div>
                        <Slider
                          value={[stock.allocationPercent]}
                          max={100}
                          step={1}
                          onValueChange={(vals) =>
                            updateStock(stock.id, {
                              allocationPercent: vals[0],
                            })
                          }
                          className="py-1"
                        />
                      </div>

                      {/* Priority */}
                      <div className="md:col-span-4 flex justify-end">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`priority-${stock.id}`}
                            checked={stock.isPriority}
                            onCheckedChange={(checked: boolean) =>
                              updateStock(stock.id, { isPriority: checked })
                            }
                            className="border-[#666666] data-[state=checked]:bg-[#5eead4] data-[state=checked]:text-black"
                          />
                          <label
                            htmlFor={`priority-${stock.id}`}
                            className="text-sm font-medium text-[#a8a8a8]"
                          >
                            Priority
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Nested Tranches */}
                    <div className="space-y-3">
                      {stock.tranches.map((tranche, idx) => (
                        <div
                          key={tranche.id}
                          className="pl-4 border-l-2 border-[#444444] py-2"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-[#666666]">
                                {idx + 1}.
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-[#666666]">
                                  @
                                </span>
                                <Input
                                  type="number"
                                  value={tranche.price}
                                  onChange={(e) =>
                                    updateTranche(stock.id, tranche.id, {
                                      price: parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  className="h-6 w-20 text-xs font-mono bg-[#1e1e1e] border-[#444444] px-2"
                                  step="0.01"
                                />
                              </div>
                              <Input
                                type="text"
                                placeholder="Label"
                                value={tranche.label || ""}
                                onChange={(e) =>
                                  updateTranche(stock.id, tranche.id, {
                                    label: e.target.value || undefined,
                                  })
                                }
                                className="h-6 w-24 text-xs bg-[#1e1e1e] border-[#444444] px-2"
                              />
                            </div>
                            {stock.tranches.length > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 text-[#666666] hover:text-[#f87171]"
                                onClick={() =>
                                  removeTranche(stock.id, tranche.id)
                                }
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-[#a8a8a8] w-20">
                              {tranche.percent}% of alloc
                            </span>
                            <Slider
                              value={[tranche.percent]}
                              max={100}
                              step={5}
                              onValueChange={(vals) =>
                                updateTranche(stock.id, tranche.id, {
                                  percent: vals[0],
                                })
                              }
                              className="flex-1 py-1 [&_.relative_span]:bg-[#e879f9]"
                            />
                          </div>
                        </div>
                      ))}

                      {/* Tranche % Validation Warning */}
                      {stock.tranches.reduce((sum, t) => sum + t.percent, 0) !==
                        100 && (
                        <div className="text-xs text-[#f87171] pl-4">
                          ⚠ Tranche percentages sum to{" "}
                          {stock.tranches.reduce(
                            (sum, t) => sum + t.percent,
                            0,
                          )}
                          % (should be 100%)
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Add Stock */}
                <div className="relative" ref={wrapperRef}>
                  {!showSuggestions ? (
                    <Button
                      variant="outline"
                      className="w-full border-dashed border-[#444444] text-[#888888] hover:bg-[#262626] hover:text-[#f5f5f5]"
                      onClick={() => setShowSuggestions(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Stock
                    </Button>
                  ) : (
                    <div className="relative animate-in fade-in zoom-in-95 duration-200">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666666]" />
                      <Input
                        autoFocus
                        placeholder="Search symbol..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-[#262626] border-[#5eead4]"
                      />
                      {filteredStocks.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 overflow-hidden bg-[#262626] border border-[#333333] rounded-md shadow-lg">
                          {filteredStocks.map((stock) => (
                            <div
                              key={stock.symbol}
                              className="flex items-center justify-between px-4 py-3 hover:bg-[#333333] cursor-pointer transition-colors"
                              onClick={() => handleAddStock(stock)}
                            >
                              <div>
                                <span className="font-bold text-[#f5f5f5] mr-2">
                                  {stock.symbol}
                                </span>
                                <span className="text-xs text-[#a8a8a8]">
                                  {stock.name}
                                </span>
                              </div>
                              <div className="font-mono text-[#5eead4]">
                                {stock.price.toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-[#2f2f2f] flex justify-end">
                <Button
                  size="lg"
                  onClick={handleRunSimulation}
                  disabled={stocks.length === 0 || !investmentCapital}
                  className="bg-linear-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-black font-semibold shadow-lg shadow-teal-500/20"
                >
                  <Calculator className="mr-2 h-5 w-5" />
                  Simulate Allocation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-1">
          {results ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              {/* Summary Card */}
              <Card className="border-[#333333] bg-[#1e1e1e] overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-teal-500 to-emerald-500" />
                <CardHeader className="pb-2">
                  <CardTitle>Results Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[#a8a8a8] text-sm">Total Cost</span>
                    <span className="text-2xl font-bold text-[#f5f5f5] font-mono">
                      {simulationSummary?.totalCost.toLocaleString()}{" "}
                      <span className="text-sm font-sans text-[#666666]">
                        LKR
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-[#a8a8a8] text-sm">Fees (1.12%)</span>
                    <span className="text-lg font-bold text-[#f97316] font-mono">
                      {simulationSummary?.totalFees?.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      <span className="text-sm font-sans text-[#666666]">
                        LKR
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-[#a8a8a8] text-sm">
                      Remaining Capital
                    </span>
                    <span className="text-xl font-bold text-[#5eead4] font-mono">
                      {simulationSummary?.remainingCapital.toLocaleString()}{" "}
                      <span className="text-sm font-sans text-[#666666]">
                        LKR
                      </span>
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Combined Results - Grouped by Symbol */}
              <div className="space-y-3">
                {combinedResults?.map((combined) => (
                  <Card
                    key={combined.symbol}
                    className="border-[#333333] bg-[#1e1e1e] hover:bg-[#262626] transition-colors"
                  >
                    <CardContent className="p-4">
                      {/* Header with symbol and totals */}
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-bold text-[#f5f5f5] text-lg flex items-center gap-2">
                            {combined.symbol}
                            {combined.entries.length > 1 && (
                              <Badge
                                variant="outline"
                                className="text-xs text-[#e879f9] border-[#e879f9]/30"
                              >
                                {combined.entries.length} tranches
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-[#a8a8a8] mt-1">
                            Total: {combined.totalShares} shares @ avg LKR{" "}
                            {combined.avgPrice.toFixed(2)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-[#f5f5f5] font-bold text-lg">
                            {combined.totalCost.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </div>
                          <div className="text-xs text-[#666666] font-mono">
                            {combined.totalBaseCost.toLocaleString()} +{" "}
                            <span className="text-[#f97316]">
                              {combined.totalFees.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Individual Tranches (if more than 1) */}
                      {combined.entries.length > 1 && (
                        <div className="mt-3 pt-3 border-t border-[#333333] space-y-2">
                          {combined.entries.map((entry, idx) => (
                            <div
                              key={entry.trancheId}
                              className="flex justify-between items-center text-sm"
                            >
                              <div className="text-[#a8a8a8]">
                                <span className="text-[#666666]">├─</span> @
                                {entry.price.toFixed(2)}
                                {entry.trancheLabel && (
                                  <span className="text-[#e879f9] ml-2">
                                    ({entry.trancheLabel})
                                  </span>
                                )}
                              </div>
                              <div className="font-mono text-[#f5f5f5]">
                                {entry.optimizedShares} sh →{" "}
                                {entry.cost.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Visual Bar */}
                      <div className="h-1.5 w-full bg-[#333333] rounded-full overflow-hidden mt-3">
                        <div
                          className="h-full bg-linear-to-r from-teal-500 to-emerald-500"
                          style={{
                            width: `${(combined.totalCost / (simulationSummary?.totalCost || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-200 flex items-start gap-3">
                <Info className="h-5 w-5 shrink-0" />
                <p>
                  Calculations are optimized for step constraints. You can
                  adjust the configuration to fine-tune the results.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-[#333333] rounded-xl bg-[#1e1e1e]/50 text-[#666666]">
              <Sparkles className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-lg font-medium mb-1">Ready to Simulate</p>
              <p className="text-sm max-w-xs">
                Add stocks and configure your parameters on the left to generate
                an optimized portfolio allocation.
              </p>
            </div>
          )}
        </div>
      </div>
      {/* Save Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-md bg-[#1e1e1e] border-[#333333] shadow-2xl">
            <CardHeader className="pb-3 border-b border-[#2f2f2f]">
              <div className="flex items-center justify-between">
                <CardTitle>Save Simulation</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-[#333333]"
                  onClick={() => setIsSaveModalOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label className="text-[#a8a8a8]">Simulation Name</Label>
                <Input
                  autoFocus
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="e.g. Dividend Portfolio Plan A"
                  className="bg-[#262626] border-[#444444]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveSimulation();
                  }}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="border-[#333333] hover:bg-[#262626]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveSimulation}
                  disabled={isSaving || !saveName.trim()}
                  className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold"
                >
                  {isSaving ? "Saving..." : "Save Simulation"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Load Modal */}
      {isLoadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-2xl bg-[#1e1e1e] border-[#333333] shadow-2xl max-h-[80vh] flex flex-col">
            <CardHeader className="pb-3 border-b border-[#2f2f2f] shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle>Load Saved Simulation</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-[#333333]"
                  onClick={() => setIsLoadModalOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 overflow-y-auto custom-scrollbar">
              {isLoadingSimulations ? (
                <div className="flex justify-center p-8 text-[#666666]">
                  Loading...
                </div>
              ) : savedSimulations.length === 0 ? (
                <div className="text-center p-8 text-[#666666] border-2 border-dashed border-[#333333] rounded-lg">
                  <FolderOpen className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p>No saved simulations found.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {savedSimulations.map((sim: any) => (
                    <div
                      key={sim.id}
                      className="p-4 rounded-lg border border-[#333333] bg-[#262626] hover:bg-[#333333] transition-colors cursor-pointer group"
                      onClick={() => handleLoadSimulation(sim)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-bold text-[#f5f5f5]">
                            {sim.name}
                          </h3>
                          <p className="text-xs text-[#a8a8a8] mt-1">
                            {new Date(sim.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-mono text-[#5eead4]">
                            {parseFloat(
                              sim.configuration.investmentCapital,
                            ).toLocaleString()}{" "}
                            LKR
                          </div>
                          <div className="text-xs text-[#666666] mt-1">
                            {sim.configuration.stocks.length} assets
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
