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
} from "lucide-react";
import { useMarketData, useSettings } from "@/lib/hooks";
import {
  calculateAllocation,
  StockInput,
  SimulationResult,
} from "@/lib/simulator";
import { Badge } from "@/components/ui/badge";

export default function PortfolioSimulatorPage() {
  // Global State
  const { data: settings } = useSettings();
  const { data: marketData } = useMarketData();

  const [investmentCapital, setInvestmentCapital] = useState<string>("");
  const [step, setStep] = useState<number>(10);

  // Stock Inputs
  const [stocks, setStocks] = useState<StockInput[]>([]);

  // Simulation Results
  const [results, setResults] = useState<SimulationResult[] | null>(null);
  const [simulationSummary, setSimulationSummary] = useState<{
    totalCost: number;
    remainingCapital: number;
  } | null>(null);

  // Search/Add State
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

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

  const handleAddStock = (stock: any) => {
    // Check if already added
    if (stocks.find((s) => s.symbol === stock.symbol)) return;

    // Distribute remaining allocation equally? Or just defaults.
    // Let's default to a split or 0

    setStocks((prev) => [
      ...prev,
      {
        symbol: stock.symbol,
        price: stock.price,
        allocationPercent: 0,
        tranchePercent: 100,
        isPriority: false,
      },
    ]);
    setSearchQuery("");
    setShowSuggestions(false);
    setResults(null); // Reset results on change
  };

  const updateStock = (index: number, updates: Partial<StockInput>) => {
    setStocks((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
    setResults(null);
  };

  const removeStock = (index: number) => {
    setStocks((prev) => prev.filter((_, i) => i !== index));
    setResults(null);
  };

  const handleRunSimulation = () => {
    const capital = parseFloat(investmentCapital);
    if (isNaN(capital) || capital <= 0) return;

    const output = calculateAllocation(capital, stocks, step);
    setResults(output.results);
    setSimulationSummary({
      totalCost: output.totalCost,
      remainingCapital: output.remainingCapital,
    });
  };

  const totalAllocation = stocks.reduce(
    (sum, s) => sum + s.allocationPercent,
    0,
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex items-center justify-between">
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
                  <div
                    className={`text-sm font-mono ${totalAllocation > 100 ? "text-[#f87171]" : totalAllocation === 100 ? "text-[#4ade80]" : "text-[#facc15]"}`}
                  >
                    Total: {totalAllocation}%
                  </div>
                </div>

                {stocks.map((stock, index) => (
                  <div
                    key={stock.symbol}
                    className="p-3 bg-[#262626] rounded-lg border border-[#333333] animate-in fade-in slide-in-from-bottom-2"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded bg-[#333333] flex items-center justify-center font-bold text-[#f5f5f5]">
                          {stock.symbol[0]}
                        </div>
                        <div>
                          <div className="font-bold text-[#f5f5f5]">
                            {stock.symbol}
                          </div>
                          <div className="text-xs text-[#a8a8a8] font-mono">
                            LKR {stock.price.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-[#666666] hover:text-[#f87171]"
                        onClick={() => removeStock(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      {/* Target Allocation */}
                      <div className="md:col-span-5 space-y-1">
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
                            updateStock(index, { allocationPercent: vals[0] })
                          }
                          className="py-1"
                        />
                      </div>

                      {/* Tranche % */}
                      <div className="md:col-span-4 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-[#a8a8a8]">
                            Initial Tranche
                          </span>
                          <span className="font-mono text-[#e879f9]">
                            {stock.tranchePercent}%
                          </span>
                        </div>
                        <Slider
                          value={[stock.tranchePercent]}
                          max={100}
                          step={5}
                          onValueChange={(vals) =>
                            updateStock(index, { tranchePercent: vals[0] })
                          }
                          className="py-1 [&_.relative_span]:bg-[#e879f9]"
                        />
                      </div>

                      {/* Priority */}
                      <div className="md:col-span-3 flex justify-end">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`priority-${stock.symbol}`}
                            checked={stock.isPriority}
                            onCheckedChange={(checked: boolean) =>
                              updateStock(index, {
                                isPriority: checked,
                              })
                            }
                            className="border-[#666666] data-[state=checked]:bg-[#5eead4] data-[state=checked]:text-black"
                          />
                          <label
                            htmlFor={`priority-${stock.symbol}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-[#a8a8a8]"
                          >
                            Priority
                          </label>
                        </div>
                      </div>
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

              {/* Detailed List */}
              <div className="space-y-3">
                {results.map((res) => (
                  <Card
                    key={res.symbol}
                    className="border-[#333333] bg-[#1e1e1e] hover:bg-[#262626] transition-colors"
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-bold text-[#f5f5f5] text-lg">
                            {res.symbol}
                          </div>
                          <div className="text-xs text-[#a8a8a8] flex items-center gap-1">
                            Target: {Math.round(res.targetShares)} sh
                            {res.targetShares !== res.optimizedShares && (
                              <span className="text-[#e879f9] ml-1">
                                → {res.optimizedShares} sh
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-[#f5f5f5] font-bold">
                            {res.cost.toLocaleString()}
                          </div>
                          <div className="text-xs text-[#5eead4]">
                            {res.actualPercent.toFixed(1)}%
                          </div>
                        </div>
                      </div>

                      {/* Simple Visual Bar */}
                      <div className="h-1.5 w-full bg-[#333333] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-teal-500 to-emerald-500"
                          style={{ width: `${res.actualPercent}%` }}
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
    </div>
  );
}
