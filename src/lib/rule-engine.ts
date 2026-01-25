import type { Holding, TradingRule, Transaction } from "./hooks";

export interface RuleViolation {
  ruleId: number;
  ruleName: string;
  ruleType: TradingRule["ruleType"];
  threshold: number;
  currentValue: number;
  message: string;
  severity: "warning" | "critical";
  relatedSymbol?: string;
}

// Calculate portfolio totals
export function calculatePortfolioTotals(holdings: Holding[]) {
  const totalInvested = holdings.reduce(
    (sum, h) => sum + parseFloat(h.totalInvested),
    0,
  );
  const totalValue = holdings.reduce(
    (sum, h) => sum + (h.currentValue || parseFloat(h.totalInvested)),
    0,
  );
  const profitLoss = totalValue - totalInvested;
  const profitLossPercent =
    totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

  return {
    totalInvested,
    totalValue,
    profitLoss,
    profitLossPercent,
    holdingsCount: holdings.length,
  };
}

// Enrich holdings with current prices
export function enrichHoldingsWithPrices(
  holdings: Holding[],
  stockPrices: Map<string, number>,
): Holding[] {
  return holdings.map((holding) => {
    const currentPrice = stockPrices.get(holding.stock.symbol);
    if (currentPrice === undefined) {
      return holding;
    }

    const currentValue = holding.quantity * currentPrice;
    const totalInvested = parseFloat(holding.totalInvested);
    const profitLoss = currentValue - totalInvested;
    const profitLossPercent =
      totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

    return {
      ...holding,
      currentPrice,
      currentValue,
      profitLoss,
      profitLossPercent,
    };
  });
}

// Evaluate all rules against current portfolio state
export function evaluateRules(
  rules: TradingRule[],
  holdings: Holding[],
  transactions: Transaction[],
): Map<number, RuleViolation[]> {
  const violations = new Map<number, RuleViolation[]>();
  const activeRules = rules.filter((r) => r.isActive);
  const totals = calculatePortfolioTotals(holdings);

  for (const rule of activeRules) {
    const ruleViolations: RuleViolation[] = [];
    const threshold = parseFloat(rule.threshold);

    switch (rule.ruleType) {
      case "POSITION_SIZE":
        // Check if any holding exceeds threshold % of portfolio
        for (const holding of holdings) {
          const holdingValue =
            holding.currentValue || parseFloat(holding.totalInvested);
          const percentOfPortfolio = (holdingValue / totals.totalValue) * 100;

          if (percentOfPortfolio > threshold) {
            ruleViolations.push({
              ruleId: rule.id,
              ruleName: rule.name,
              ruleType: rule.ruleType,
              threshold,
              currentValue: percentOfPortfolio,
              message: `${holding.stock.symbol} is ${percentOfPortfolio.toFixed(1)}% of portfolio (limit: ${threshold}%)`,
              severity:
                percentOfPortfolio > threshold * 1.2 ? "critical" : "warning",
              relatedSymbol: holding.stock.symbol,
            });
          }
        }
        break;

      case "STOP_LOSS":
        // Check if any holding is down more than threshold %
        for (const holding of holdings) {
          if (
            holding.profitLossPercent !== undefined &&
            holding.profitLossPercent < -threshold
          ) {
            ruleViolations.push({
              ruleId: rule.id,
              ruleName: rule.name,
              ruleType: rule.ruleType,
              threshold,
              currentValue: Math.abs(holding.profitLossPercent),
              message: `${holding.stock.symbol} is down ${Math.abs(holding.profitLossPercent).toFixed(1)}% (stop-loss: ${threshold}%)`,
              severity:
                holding.profitLossPercent < -threshold * 1.5
                  ? "critical"
                  : "warning",
              relatedSymbol: holding.stock.symbol,
            });
          }
        }
        break;

      case "TAKE_PROFIT":
        // Check if any holding is up more than threshold % (reminder to take profits)
        for (const holding of holdings) {
          if (
            holding.profitLossPercent !== undefined &&
            holding.profitLossPercent > threshold
          ) {
            ruleViolations.push({
              ruleId: rule.id,
              ruleName: rule.name,
              ruleType: rule.ruleType,
              threshold,
              currentValue: holding.profitLossPercent,
              message: `${holding.stock.symbol} is up ${holding.profitLossPercent.toFixed(1)}% - consider taking profits`,
              severity: "warning",
              relatedSymbol: holding.stock.symbol,
            });
          }
        }
        break;

      case "SECTOR_LIMIT":
        // Check sector concentration
        const sectorTotals = new Map<string, number>();
        for (const holding of holdings) {
          const sector = holding.stock.sector || "Unknown";
          const value =
            holding.currentValue || parseFloat(holding.totalInvested);
          sectorTotals.set(sector, (sectorTotals.get(sector) || 0) + value);
        }

        for (const [sector, value] of sectorTotals) {
          const percentOfPortfolio = (value / totals.totalValue) * 100;
          if (percentOfPortfolio > threshold) {
            ruleViolations.push({
              ruleId: rule.id,
              ruleName: rule.name,
              ruleType: rule.ruleType,
              threshold,
              currentValue: percentOfPortfolio,
              message: `${sector} sector is ${percentOfPortfolio.toFixed(1)}% of portfolio (limit: ${threshold}%)`,
              severity:
                percentOfPortfolio > threshold * 1.2 ? "critical" : "warning",
            });
          }
        }
        break;

      case "TRADE_FREQUENCY":
        // Count trades in the last week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const recentTrades = transactions.filter(
          (t) => new Date(t.date) >= oneWeekAgo && t.type !== "DIVIDEND",
        );

        if (recentTrades.length > threshold) {
          ruleViolations.push({
            ruleId: rule.id,
            ruleName: rule.name,
            ruleType: rule.ruleType,
            threshold,
            currentValue: recentTrades.length,
            message: `${recentTrades.length} trades this week (limit: ${threshold})`,
            severity:
              recentTrades.length > threshold * 1.5 ? "critical" : "warning",
          });
        }
        break;
    }

    if (ruleViolations.length > 0) {
      violations.set(rule.id, ruleViolations);
    }
  }

  return violations;
}

// Get total violation count
export function getTotalViolationCount(
  violations: Map<number, RuleViolation[]>,
): number {
  let count = 0;
  for (const ruleViolations of violations.values()) {
    count += ruleViolations.length;
  }
  return count;
}

// Calculate discipline score (100 - violations impact)
export function calculateDisciplineScore(
  rules: TradingRule[],
  violations: Map<number, RuleViolation[]>,
): number {
  const activeRules = rules.filter((r) => r.isActive);
  if (activeRules.length === 0) return 100;

  const violatedRuleCount = violations.size;
  const complianceRate =
    ((activeRules.length - violatedRuleCount) / activeRules.length) * 100;

  return Math.max(0, Math.round(complianceRate));
}
