import { db } from "@/db";
import { holdings, transactions, type NewTransaction } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export class PortfolioService {
  /**
   * Process a new transaction and update holdings accordingly.
   * This is the core accounting engine.
   */
  static async processTransaction(
    userId: string,
    txData: Omit<NewTransaction, "id" | "createdAt" | "updatedAt" | "userId">,
  ) {
    return await db.transaction(async (tx: any) => {
      // 1. Create the transaction record
      const [newTx] = await tx
        .insert(transactions)
        .values({
          ...txData,
          userId,
          fees: (txData.fees || "0").toString(),
          date: txData.date ? new Date(txData.date) : new Date(),
        })
        .returning();

      // 2. Fetch existing holding for this USER
      const existingHoldings = await tx
        .select()
        .from(holdings)
        .where(
          and(
            eq(holdings.stockId, txData.stockId),
            eq(holdings.userId, userId),
          ),
        );

      const currentHolding = existingHoldings[0];

      const fees = parseFloat(txData.fees || "0");

      if (txData.type === "BUY") {
        if (!currentHolding) {
          // New position
          const totalInvested =
            txData.quantity * parseFloat(txData.price) + fees;
          const avgBuyPrice = totalInvested / txData.quantity;

          await tx.insert(holdings).values({
            userId,
            stockId: txData.stockId,
            quantity: txData.quantity,
            avgBuyPrice: avgBuyPrice.toFixed(2),
            initialBuyPrice: parseFloat(txData.price).toFixed(2),
            lastBuyPrice: parseFloat(txData.price).toFixed(2),
            totalInvested: totalInvested.toFixed(2),
            status: "active",
          });
        } else {
          // Update existing position (Weighted Average)
          const oldQty = currentHolding.quantity;
          const currentTotalInvested = parseFloat(currentHolding.totalInvested);

          const buyQty = txData.quantity;
          const buyPrice = parseFloat(txData.price);

          const newQty = oldQty + buyQty;

          // Added Cost = (BuyQty * BuyPrice) + Fees
          const addedCost = buyQty * buyPrice + fees;
          const newTotalInvested = currentTotalInvested + addedCost;
          const newAvg = newTotalInvested / newQty;

          const updateData: any = {
            quantity: newQty,
            avgBuyPrice: newAvg.toFixed(2),
            lastBuyPrice: buyPrice.toFixed(2),
            totalInvested: newTotalInvested.toFixed(2),
            status: "active", // Reactivate if it was inactive
            updatedAt: new Date(),
          };

          // If restarting a position (quantity was 0), treat as new entry point
          if (oldQty === 0) {
            updateData.initialBuyPrice = buyPrice.toFixed(2);
          }

          await tx
            .update(holdings)
            .set(updateData)
            .where(eq(holdings.id, currentHolding.id));
        }
      } else if (txData.type === "SELL") {
        if (!currentHolding) {
          throw new Error("Cannot sell stock that is not in holdings");
        }

        const oldQty = currentHolding.quantity;
        const sellQty = txData.quantity;

        if (sellQty > oldQty) {
          throw new Error(`Cannot sell ${sellQty}. Only ${oldQty} available.`);
        }

        const newQty = oldQty - sellQty;
        // Total invested reduces proportionally
        // New Total Invested = Old Total Invested * (NewQty / OldQty)
        const currentTotalInvested = parseFloat(currentHolding.totalInvested);
        const newTotalInvested =
          newQty === 0 ? 0 : currentTotalInvested * (newQty / oldQty);

        // Avg Buy Price effectively remains the same for remaining shares
        const currentAvgPrice = parseFloat(currentHolding.avgBuyPrice);

        const newStatus = newQty === 0 ? "inactive" : "active";

        await tx
          .update(holdings)
          .set({
            quantity: newQty,
            // If newQty is 0, totalInvested is 0.
            // Otherwise, we update it.
            totalInvested: newTotalInvested.toFixed(2),
            status: newStatus,
            updatedAt: new Date(),
          })
          .where(eq(holdings.id, currentHolding.id));
      }

      return newTx;
    });
  }
}
