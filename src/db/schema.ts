import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================================
// STOCKS
// ============================================================================
export const stocks = pgTable("stocks", {
  id: serial("id").primaryKey(),
  symbol: varchar("symbol", { length: 20 }).unique().notNull(), // e.g., "LOLC.N0000"
  name: varchar("name", { length: 255 }).notNull(),
  sector: varchar("sector", { length: 100 }),
  logoPath: varchar("logo_path", { length: 500 }),
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
// TRADING RULES - User defined rules for the engine
// ============================================================================
export type RuleType =
  | "POSITION_SIZE"
  | "STOP_LOSS"
  | "TAKE_PROFIT"
  | "SECTOR_LIMIT"
  | "TRADE_FREQUENCY";

export interface RuleCondition {
  threshold: number; // Percentage or Count
  sector?: string;
  customExpression?: string;
}

export const tradingRules = pgTable("trading_rules", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  ruleType: varchar("rule_type", { length: 50 }).$type<RuleType>().notNull(),
  conditions: jsonb("conditions").$type<RuleCondition>().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// SETTINGS - User global settings
// ============================================================================
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(), // Single row expected
  capital: decimal("capital", { precision: 15, scale: 2 })
    .default("0")
    .notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================
export type Stock = typeof stocks.$inferSelect;
export type NewStock = typeof stocks.$inferInsert;

export type Holding = typeof holdings.$inferSelect;
export type NewHolding = typeof holdings.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export type TradingRule = typeof tradingRules.$inferSelect;
export type NewTradingRule = typeof tradingRules.$inferInsert;

export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;
