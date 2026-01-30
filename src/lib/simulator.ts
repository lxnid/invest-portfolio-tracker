// Tranche represents a single price-point entry within a stock
export interface Tranche {
  id: string;
  price: number;
  percent: number; // % of this stock's allocation (should sum to 100)
  label?: string; // "Initial", "Price Drop", etc.
}

// StockEntry represents a stock with its total allocation and nested tranches
export interface StockEntry {
  id: string;
  symbol: string;
  allocationPercent: number; // % of TOTAL capital for this stock
  isPriority: boolean;
  tranches: Tranche[]; // Price points for staged buying
}

// Legacy interface for internal calculation (flattened from StockEntry)
export interface FlattenedTranche {
  entryId: string; // StockEntry.id
  trancheId: string; // Tranche.id
  symbol: string;
  price: number;
  effectiveAllocation: number; // (stock.allocationPercent * tranche.percent / 100)
  isPriority: boolean;
  label?: string;
}

export interface SimulationResult {
  entryId: string; // Maps back to StockEntry.id
  trancheId: string; // Maps back to Tranche.id
  symbol: string;
  trancheLabel?: string;
  price: number; // Entry price for this tranche
  targetShares: number; // Raw fractional shares
  optimizedShares: number; // Rounded shares
  cost: number; // Total cost including fees
  baseCost: number; // Cost without fees
  fees: number; // Fee amount
  actualPercent: number; // Of the total *invested* amount
}

export interface CombinedStockResult {
  symbol: string;
  entries: SimulationResult[]; // Individual tranches
  totalShares: number;
  totalBaseCost: number;
  totalFees: number;
  totalCost: number;
  avgPrice: number; // Weighted average price
}

export interface SimulationOutput {
  results: SimulationResult[];
  combinedResults: CombinedStockResult[]; // Grouped by symbol
  totalCost: number;
  totalFees: number;
  remainingCapital: number;
}

// Transaction fee rate (1.12%)
const FEE_RATE = 0.0112;

export function calculateAllocation(
  totalCapital: number,
  stocks: StockEntry[],
  step: number = 10,
): SimulationOutput {
  const results: SimulationResult[] = [];
  let currentTotalCost = 0;

  // 1. Flatten StockEntry[] into FlattenedTranche[] for processing
  const flattenedTranches: FlattenedTranche[] = [];
  for (const stock of stocks) {
    for (const tranche of stock.tranches) {
      flattenedTranches.push({
        entryId: stock.id,
        trancheId: tranche.id,
        symbol: stock.symbol,
        price: tranche.price,
        effectiveAllocation: (stock.allocationPercent * tranche.percent) / 100,
        isPriority: stock.isPriority,
        label: tranche.label,
      });
    }
  }

  // 2. Calculate Initial Targets & Effective Budget
  let effectiveBudget = 0;

  const initialCalculations = flattenedTranches.map((tranche) => {
    // How much of capital is allocated to this tranche?
    const targetAmt = totalCapital * (tranche.effectiveAllocation / 100);
    effectiveBudget += targetAmt;

    // Raw shares needed to hit that target amount
    const rawShares = tranche.price > 0 ? targetAmt / tranche.price : 0;

    // Initial rounding (floor to step)
    let roundedShares = Math.floor(rawShares / step) * step;
    if (roundedShares < 0) roundedShares = 0;

    const baseCost = roundedShares * tranche.price;
    const fees = baseCost * FEE_RATE;
    const totalCost = baseCost + fees;

    return {
      ...tranche,
      targetAmt,
      rawShares,
      roundedShares,
      currentBaseCost: baseCost,
      currentFees: fees,
      currentCost: totalCost,
    };
  });

  currentTotalCost = initialCalculations.reduce(
    (sum, item) => sum + item.currentCost,
    0,
  );

  // 3. Adjustments to fit Effective Budget
  let workingSet = [...initialCalculations];

  // Case A: Over Budget -> Reduce Shares
  while (currentTotalCost > effectiveBudget) {
    workingSet.sort((a, b) => {
      if (a.isPriority && !b.isPriority) return 1;
      if (!a.isPriority && b.isPriority) return -1;
      const diffA = a.currentCost - a.targetAmt;
      const diffB = b.currentCost - b.targetAmt;
      return diffB - diffA;
    });

    const candidateIndex = workingSet.findIndex(
      (item) => item.roundedShares >= step,
    );

    if (candidateIndex === -1) break;

    const candidate = workingSet[candidateIndex];
    candidate.roundedShares -= step;
    candidate.currentBaseCost = candidate.roundedShares * candidate.price;
    candidate.currentFees = candidate.currentBaseCost * FEE_RATE;
    candidate.currentCost = candidate.currentBaseCost + candidate.currentFees;
    currentTotalCost -= step * candidate.price * (1 + FEE_RATE);
  }

  // Case B: Under Budget -> Increase Shares
  let improvementPossible = true;
  while (improvementPossible) {
    improvementPossible = false;
    const remainingInBudget = effectiveBudget - currentTotalCost;

    const validCandidates = workingSet.filter(
      (item) => step * item.price * (1 + FEE_RATE) <= remainingInBudget,
    );

    if (validCandidates.length === 0) break;

    validCandidates.sort((a, b) => {
      const diffA = a.targetAmt - a.currentCost;
      const diffB = b.targetAmt - b.currentCost;

      if (a.isPriority && !b.isPriority) return -1;
      if (!a.isPriority && b.isPriority) return 1;

      return diffB - diffA;
    });

    const best = validCandidates[0];
    best.roundedShares += step;
    best.currentBaseCost = best.roundedShares * best.price;
    best.currentFees = best.currentBaseCost * FEE_RATE;
    best.currentCost = best.currentBaseCost + best.currentFees;
    currentTotalCost += step * best.price * (1 + FEE_RATE);
    improvementPossible = true;
  }

  // 4. Finalize Output
  results.push(
    ...workingSet.map((item) => ({
      entryId: item.entryId,
      trancheId: item.trancheId,
      symbol: item.symbol,
      trancheLabel: item.label,
      price: item.price,
      targetShares: item.rawShares,
      optimizedShares: item.roundedShares,
      baseCost: item.currentBaseCost,
      fees: item.currentFees,
      cost: item.currentCost,
      actualPercent: 0,
    })),
  );

  // Calculate actual percentages
  const finalInvested = results.reduce((sum, r) => sum + r.cost, 0);
  const totalFees = results.reduce((sum, r) => sum + r.fees, 0);

  results.forEach((r) => {
    r.actualPercent = finalInvested > 0 ? (r.cost / finalInvested) * 100 : 0;
  });

  // 5. Compute Combined Results (grouped by symbol)
  const symbolMap = new Map<string, SimulationResult[]>();
  for (const r of results) {
    if (!symbolMap.has(r.symbol)) {
      symbolMap.set(r.symbol, []);
    }
    symbolMap.get(r.symbol)!.push(r);
  }

  const combinedResults: CombinedStockResult[] = [];
  for (const [symbol, entries] of symbolMap) {
    const totalShares = entries.reduce((sum, e) => sum + e.optimizedShares, 0);
    const totalBaseCost = entries.reduce((sum, e) => sum + e.baseCost, 0);
    const totalFeesForSymbol = entries.reduce((sum, e) => sum + e.fees, 0);
    const totalCostForSymbol = entries.reduce((sum, e) => sum + e.cost, 0);
    const avgPrice = totalShares > 0 ? totalBaseCost / totalShares : 0;

    combinedResults.push({
      symbol,
      entries,
      totalShares,
      totalBaseCost,
      totalFees: totalFeesForSymbol,
      totalCost: totalCostForSymbol,
      avgPrice,
    });
  }

  return {
    results,
    combinedResults,
    totalCost: finalInvested,
    totalFees,
    remainingCapital: totalCapital - finalInvested,
  };
}
