import {
  evaluateRules,
  RuleViolation,
  calculatePortfolioTotals,
} from "./rule-engine";
import { Holding, Transaction, Settings, TradingRule } from "./hooks";

/**
 * Simulates a potential transaction to see its impact on the portfolio and rules
 */
export function simulateTransaction(
  currentHoldings: Holding[],
  currentTransactions: Transaction[],
  rules: TradingRule[],
  settings: Settings,
  proposedTx: {
    stockId: number;
    symbol: string;
    type: "BUY" | "SELL";
    quantity: number;
    price: number;
    fees: number;
  },
) {
  // 1. Create a deep copy of holdings to mutate
  // We need to find if we already own this stock
  const holdingsCopy = currentHoldings.map((h) => ({ ...h }));
  const existingHoldingIndex = holdingsCopy.findIndex(
    (h) => h.stockId === proposedTx.stockId,
  );

  let newHolding: Holding | undefined;

  const totalCost = proposedTx.quantity * proposedTx.price + proposedTx.fees;
  const totalProceeds =
    proposedTx.quantity * proposedTx.price - proposedTx.fees;

  if (proposedTx.type === "BUY") {
    if (existingHoldingIndex >= 0) {
      // Update existing
      const h = holdingsCopy[existingHoldingIndex];
      const oldQty = h.quantity;
      const oldTotalInvested = parseFloat(h.totalInvested);

      const newQty = oldQty + proposedTx.quantity;
      const newTotalInvested = oldTotalInvested + totalCost;
      const newAvgPrice = newTotalInvested / newQty;

      holdingsCopy[existingHoldingIndex] = {
        ...h,
        quantity: newQty,
        totalInvested: newTotalInvested.toString(),
        avgBuyPrice: newAvgPrice.toString(),
        // We update lastBuyPrice for the simulation
        lastBuyPrice: proposedTx.price.toString(),
        // initialBuyPrice stays same unless it was empty (re-entry logic simulated)
        initialBuyPrice:
          oldQty === 0 ? proposedTx.price.toString() : h.initialBuyPrice,
      };
    } else {
      // New holding
      // We need a mock stock object since we only have stockId/symbol
      const mockStock = {
        id: proposedTx.stockId,
        symbol: proposedTx.symbol,
        name: "Simulated Stock",
        sector: "Unknown",
        // ... other fields irrelevant for rules
        logoPath: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      holdingsCopy.push({
        id: -1, // Temporary ID
        stockId: proposedTx.stockId,
        quantity: proposedTx.quantity,
        avgBuyPrice: proposedTx.price.toString(),
        totalInvested: totalCost.toString(),
        initialBuyPrice: proposedTx.price.toString(),
        lastBuyPrice: proposedTx.price.toString(),
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stock: mockStock,
        // Enriched fields for calculation
        currentPrice: proposedTx.price,
        currentValue: proposedTx.quantity * proposedTx.price,
        profitLoss: 0 - proposedTx.fees,
        profitLossPercent: 0,
      });
    }
  } else if (proposedTx.type === "SELL") {
    if (existingHoldingIndex >= 0) {
      const h = holdingsCopy[existingHoldingIndex];
      const newQty = h.quantity - proposedTx.quantity;

      if (newQty <= 0) {
        // Sold out
        holdingsCopy.splice(existingHoldingIndex, 1);
      } else {
        // Reduced position
        // Total invested reduces proportionally
        const prop = newQty / h.quantity;
        const newTotalInvested = parseFloat(h.totalInvested) * prop;

        holdingsCopy[existingHoldingIndex] = {
          ...h,
          quantity: newQty,
          totalInvested: newTotalInvested.toString(),
        };
      }
    }
  }

  // 2. Run Evaluate Rules on the NEW state
  const violations = evaluateRules(
    rules,
    holdingsCopy,
    currentTransactions,
    settings,
  );

  // 3. Check specific BUY/SELL criteria (Pre-trade rules)
  const preTradeViolations: RuleViolation[] = [];

  if (proposedTx.type === "BUY") {
    // Check Rule 3: Buy only if price dropped 15% from last buy (if existing)
    if (existingHoldingIndex >= 0) {
      const h = currentHoldings[existingHoldingIndex];
      if (h.lastBuyPrice) {
        const lastPrice = parseFloat(h.lastBuyPrice);
        const percentDrop = ((lastPrice - proposedTx.price) / lastPrice) * 100;

        // Find if we have a configured threshold for this
        const buyRule = rules.find(
          (r) => r.ruleType === "BUY_CONDITION" && r.isActive,
        );
        const threshold = buyRule ? parseFloat(buyRule.threshold) : 15; // Default 15%

        if (percentDrop < threshold && percentDrop > -5) {
          // If it hasn't dropped enough (and isn't significantly higher either, assuming uptrend buying is separate)
          // Wait, rule says: "Stock falls 15–25% from your last buy".
          // So if current price is 100, last buy was 110. Drop is 9%. Threshold 15%.
          // Violation: You are buying too soon.
          // Exception: "Market-wide correction" (we can't easily check this here yet)

          // Logic Correction: Drop is positive number here (110 - 100 = 10 decrease).
          // If percentDrop < threshold (e.g. 9% < 15%), it's a violation.
          // But if price IS HIGHER (percentDrop negative), it's definitely a violation of "average down" rule unless specific breakout logic exists.
          // The user said "You do not buy because price moved... only if... Stock falls 15-25%".

          preTradeViolations.push({
            ruleId: buyRule?.id || 999,
            ruleName: buyRule?.name || "Disciplined Buying",
            ruleType: "BUY_CONDITION" as any,
            threshold: threshold,
            currentValue: percentDrop,
            message: `Price only dropped ${percentDrop.toFixed(1)}% from last buy (Required: >${threshold}%). Don't catch a falling knife too early.`,
            severity: "warning",
            impact: "Waiting for a deeper discount improves safety margin.",
          });
        } else if (percentDrop < -10) {
          // Buying on way up?
          preTradeViolations.push({
            ruleId: buyRule?.id || 999,
            ruleName: buyRule?.name || "Disciplined Buying",
            ruleType: "BUY_CONDITION" as any,
            threshold: 0,
            currentValue: percentDrop,
            message: `Price is up ${Math.abs(percentDrop).toFixed(1)}% since last buy. ensure fundamentals improved.`,
            severity: "warning",
            impact:
              "Buying on strength should be justified by earnings growth.",
          });
        }
      }
    }
  }

  // Combine results
  const allViolations: RuleViolation[] = [];
  violations.forEach((vList) => allViolations.push(...vList));
  allViolations.push(...preTradeViolations);

  // Return generic report
  const totals = calculatePortfolioTotals(holdingsCopy, settings);

  return {
    isValid:
      allViolations.filter((v) => v.severity === "critical").length === 0,
    violations: allViolations,
    newTotals: totals,
  };
}
