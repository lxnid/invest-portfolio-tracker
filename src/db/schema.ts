import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  varchar,
  decimal,
  timestamp,
  integer,
  boolean,
  text,
} from "drizzle-orm/pg-core";

// ============================================================================
// STOCKS - Master list of stocks
// ============================================================================
export const stocks = pgTable("stocks", {
  id: serial("id").primaryKey(),
  symbol: varchar("symbol", { length: 20 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  sector: varchar("sector", { length: 100 }),
  logoPath: varchar("logo_path", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const stocksRelations = relations(stocks, ({ many }) => ({
  holdings: many(holdings),
  transactions: many(transactions),
}));

// ============================================================================
// HOLDINGS - Current portfolio positions
// ============================================================================
export const holdings = pgTable("holdings", {
  id: serial("id").primaryKey(),
  stockId: integer("stock_id")
    .references(() => stocks.id, { onDelete: "cascade" })
    .notNull(),
  quantity: integer("quantity").notNull(),
  avgBuyPrice: decimal("avg_buy_price", { precision: 15, scale: 2 }).notNull(),
  totalInvested: decimal("total_invested", {
    precision: 15,
    scale: 2,
  }).notNull(),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const holdingsRelations = relations(holdings, ({ one }) => ({
  stock: one(stocks, {
    fields: [holdings.stockId],
    references: [stocks.id],
  }),
}));

// ============================================================================
// TRANSACTIONS - Historical buy/sell records
// ============================================================================
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  stockId: integer("stock_id")
    .references(() => stocks.id, { onDelete: "cascade" })
    .notNull(),
  type: varchar("type", { length: 10 }).notNull(), // BUY, SELL, DIVIDEND
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 15, scale: 2 }).notNull(),
  fees: decimal("fees", { precision: 15, scale: 2 }).default("0").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const transactionsRelations = relations(transactions, ({ one }) => ({
  stock: one(stocks, {
    fields: [transactions.stockId],
    references: [stocks.id],
  }),
}));

// ============================================================================
// SETTINGS - User Preferences
// ============================================================================
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  capital: decimal("capital", { precision: 15, scale: 2 })
    .default("0")
    .notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// TRADING RULES
// ============================================================================
export const tradingRules = pgTable("trading_rules", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  ruleType: varchar("rule_type", { length: 50 }).notNull(), // STOP_LOSS, TAKE_PROFIT, etc.
  threshold: decimal("threshold", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Types based on schema
export type Stock = typeof stocks.$inferSelect;
export type NewStock = typeof stocks.$inferInsert;

export type Holding = typeof holdings.$inferSelect;
export type NewHolding = typeof holdings.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export type TradingRule = typeof tradingRules.$inferSelect;
export type NewTradingRule = typeof tradingRules.$inferInsert;

export type Settings = typeof settings.$inferSelect;
