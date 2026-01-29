export interface StockInput {
  symbol: string;
  price: number;
  allocationPercent: number; // 0-100
  tranchePercent: number; // 0-100 (staged investment)
  isPriority: boolean;
}

export interface SimulationResult {
  symbol: string;
  targetShares: number; // Raw fractional shares
  optimizedShares: number; // Rounded shares
  cost: number; // Total cost including fees
  baseCost: number; // Cost without fees
  fees: number; // Fee amount
  actualPercent: number; // Of the total *invested* amount
}

export interface SimulationOutput {
  results: SimulationResult[];
  totalCost: number;
  totalFees: number;
  remainingCapital: number;
}

// Transaction fee rate (1.12%)
const FEE_RATE = 0.0112;

export function calculateAllocation(
  totalCapital: number,
  stocks: StockInput[],
  step: number = 10,
): SimulationOutput {
  const results: SimulationResult[] = [];
  let currentTotalCost = 0;

  // 1. Calculate Initial Targets & Effective Budget
  // The user specifies "Tranche Percent" which implies a specific budget for this run.
  // We should not optimize up to 'totalCapital' (User's Total Portfolio Value) if the Tranche is only a fraction.
  // We calculate the 'Effective Budget' as the sum of all target amounts for this tranche.

  let effectiveBudget = 0;

  const initialCalculations = stocks.map((stock) => {
    // How much *of the total capital* is allocated to this stock?
    const fullAllocationAmt = totalCapital * (stock.allocationPercent / 100);
    // How much of that allocation are we investing *now*?
    const targetAmt = fullAllocationAmt * (stock.tranchePercent / 100);

    effectiveBudget += targetAmt;

    // Raw shares needed to hit that target amount
    // Avoid division by zero
    const rawShares = stock.price > 0 ? targetAmt / stock.price : 0;

    // Initial rounding
    // User requirement: "number of stocks that can be bought to a nearest 10 multiple"
    // "Can be bought" implies we generally shouldn't exceed the budget (Floor).
    // "Remaining will be left out" supports the conservative approach.
    let roundedShares = Math.floor(rawShares / step) * step;

    // Ensure we don't go negative
    if (roundedShares < 0) roundedShares = 0;

    const baseCost = roundedShares * stock.price;
    const fees = baseCost * FEE_RATE;
    const totalCost = baseCost + fees;

    return {
      ...stock,
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

  // 2. Adjustments (Skewing) to fit Effective Budget
  // We respect 'effectiveBudget' as the soft target, but 'totalCapital' is the hard limit (though usually effectiveBudget <= totalCapital).

  // Clone to modify
  let workingSet = [...initialCalculations];

  // Case A: Over Budget -> Reduce Shares
  // Usually with Math.floor we are under budget, BUT if step is large or prices vary, maybe?
  // Or if we decide to treat 'effectiveBudget' strictly.

  while (currentTotalCost > effectiveBudget) {
    // Find the best candidate to reduce
    workingSet.sort((a, b) => {
      // If one is priority and other isn't, priority comes later (less likely to be cut)
      if (a.isPriority && !b.isPriority) return 1;
      if (!a.isPriority && b.isPriority) return -1;

      const diffA = a.currentCost - a.targetAmt;
      const diffB = b.currentCost - b.targetAmt;
      return diffB - diffA; // Largest diff first
    });

    // Try to reduce the first one that has shares >= step
    const candidateIndex = workingSet.findIndex(
      (item) => item.roundedShares >= step,
    );

    if (candidateIndex === -1) {
      break;
    }

    const candidate = workingSet[candidateIndex];
    candidate.roundedShares -= step;
    candidate.currentBaseCost = candidate.roundedShares * candidate.price;
    candidate.currentFees = candidate.currentBaseCost * FEE_RATE;
    candidate.currentCost = candidate.currentBaseCost + candidate.currentFees;
    currentTotalCost -= step * candidate.price * (1 + FEE_RATE);
  }

  // Case B: Under Budget -> Increase Shares?
  // User: "remaining will be left out to the next tranche"
  // However, we should try to get as close to the target as possible WITHOUT exceeding it significantly just to be nice?
  // With Math.floor, we might be consistently under.
  // If we have enough "remainder" to buy a full step for someone, we should, provided it keeps us <= Effective Budget.
  // OR at least closest to Effective Budget without going over 'totalCapital' (which is minimal constraint here).
  // Actually, strictly respecting 'effectiveBudget' means we don't add if it exceeds effectiveBudget.

  let improvementPossible = true;
  while (improvementPossible) {
    improvementPossible = false;
    const remainingInBudget = effectiveBudget - currentTotalCost;

    // Candidates: Anyone who can accept 'step' shares without exceeding Effective Budget
    // Include fees in the cost check
    const validCandidates = workingSet.filter(
      (item) => step * item.price * (1 + FEE_RATE) <= remainingInBudget,
    );

    if (validCandidates.length === 0) break;

    // Criteria:
    // 1. Most "Underweight" (TargetAmt - CurrentCost)
    // 2. Priority
    validCandidates.sort((a, b) => {
      const diffA = a.targetAmt - a.currentCost;
      const diffB = b.targetAmt - b.currentCost;

      if (a.isPriority && !b.isPriority) return -1; // Priority first
      if (!a.isPriority && b.isPriority) return 1;

      return diffB - diffA; // Largest underweight first
    });

    const best = validCandidates[0];

    // We add to Best
    best.roundedShares += step;
    best.currentBaseCost = best.roundedShares * best.price;
    best.currentFees = best.currentBaseCost * FEE_RATE;
    best.currentCost = best.currentBaseCost + best.currentFees;
    currentTotalCost += step * best.price * (1 + FEE_RATE);
    improvementPossible = true;
  }

  // 3. Finalize Output
  results.push(
    ...workingSet.map((item) => ({
      symbol: item.symbol,
      targetShares: item.rawShares,
      optimizedShares: item.roundedShares,
      baseCost: item.currentBaseCost,
      fees: item.currentFees,
      cost: item.currentCost,
      actualPercent: 0, // Will calc below
    })),
  );

  // Calculate actual percentages based on *invested* amount (total including fees)
  const finalInvested = results.reduce((sum, r) => sum + r.cost, 0);
  const totalFees = results.reduce((sum, r) => sum + r.fees, 0);

  results.forEach((r) => {
    r.actualPercent = finalInvested > 0 ? (r.cost / finalInvested) * 100 : 0;
  });

  return {
    results,
    totalCost: finalInvested,
    totalFees,
    remainingCapital: totalCapital - finalInvested, // Remaining from the GRAND total (User's context)
  };
}
