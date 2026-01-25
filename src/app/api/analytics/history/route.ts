import { NextResponse } from "next/server";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Fetch all transactions for this user, sorted by date
    const allTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, session.userId))
      .orderBy(asc(transactions.date));

    if (allTransactions.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // 2. Build cumulative invested capital history
    // We want a time series: Date -> Total Invested Capital

    // Group transactions by day (or just stream them)
    const history: { date: string; value: number }[] = [];
    let currentInvested = 0;

    // Helper to format date as YYYY-MM-DD
    const formatDate = (date: Date) => date.toISOString().split("T")[0];

    for (const tx of allTransactions) {
      const txDate = formatDate(tx.date);
      const amount = parseFloat(tx.price) * tx.quantity;
      const fees = parseFloat(tx.fees || "0");

      if (tx.type === "BUY") {
        currentInvested += amount + fees;
      } else if (tx.type === "SELL") {
        // When selling, what happens to "invested capital"?
        // Option A: Reduce by the original cost basis (hard to track without specific lot matching).
        // Option B: Reduce by the sale amount (cash out).
        // Option C: Net Invested = Cash In - Cash Out.
        // Let's go with Option C (Net Cash Flow) as it's the most robust "Invested" metric.
        const saleProceeds = amount - fees;
        currentInvested -= saleProceeds;
      }

      // If we already have an entry for this day, update it. Otherwise push new.
      const lastEntry = history[history.length - 1];
      if (lastEntry && lastEntry.date === txDate) {
        lastEntry.value = currentInvested;
      } else {
        history.push({ date: txDate, value: currentInvested });
      }
    }

    // 3. Ensure we have a final data point for "today" if net investment hasn't changed since last tx
    const today = formatDate(new Date());
    const lastEntry = history[history.length - 1];
    if (lastEntry && lastEntry.date !== today) {
      history.push({ date: today, value: currentInvested });
    }

    // 4. Transform for Recharts (e.g., format date to "Jan 01")
    const chartData = history.map((h) => {
      const d = new Date(h.date);
      return {
        date: h.date, // Keep full date for tooltip
        month: d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        value: Math.max(0, h.value), // Avoid negative invested if math gets weird (though withdrawals > deposits is possible)
      };
    });

    return NextResponse.json({ data: chartData });
  } catch (error) {
    console.error("Failed to fetch history", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 },
    );
  }
}
