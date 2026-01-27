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
  json,
} from "drizzle-orm/pg-core";

// ============================================================================
// STOCKS - Master list of stocks (Shared Global Data)
// ============================================================================
export const stocks = pgTable("stocks", {
  id: serial("id").primaryKey(),
  symbol: varchar("symbol", { length: 20 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  sector: varchar("sector", { length: 100 }),
  logoPath: varchar("logo_path", { length: 255 }),
  createdBy: varchar("created_by", { length: 100 }).default("system").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const stocksRelations = relations(stocks, ({ many }) => ({
  holdings: many(holdings),
  transactions: many(transactions),
}));

// ============================================================================
// HOLDINGS - Current portfolio positions (User Specific)
// ============================================================================
export const holdings = pgTable("holdings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 100 }).default("admin-user").notNull(),
  stockId: integer("stock_id")
    .references(() => stocks.id, { onDelete: "cascade" })
    .notNull(),
  quantity: integer("quantity").notNull(),
  avgBuyPrice: decimal("avg_buy_price", { precision: 15, scale: 2 }).notNull(),
  initialBuyPrice: decimal("initial_buy_price", { precision: 15, scale: 2 }),
  lastBuyPrice: decimal("last_buy_price", { precision: 15, scale: 2 }),
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
// TRANSACTIONS - Historical buy/sell records (User Specific)
// ============================================================================
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 100 }).default("admin-user").notNull(),
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
// SETTINGS - User Preferences (User Specific)
// ============================================================================
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 100 }).default("admin-user").notNull(),
  capital: decimal("capital", { precision: 15, scale: 2 })
    .default("0")
    .notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// TRADING RULES (User Specific)
// ============================================================================
export const tradingRules = pgTable("trading_rules", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 100 }).default("admin-user").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  ruleType: varchar("rule_type", { length: 50 }).notNull(), // STOP_LOSS, TAKE_PROFIT, etc.
  threshold: decimal("threshold", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// FEEDBACK (User Submitted)
// ============================================================================
export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 100 }).default("anonymous").notNull(),
  type: varchar("type", { length: 20 }).notNull(), // FEATURE, BUG, OTHER
  message: text("message").notNull(),
  status: varchar("status", { length: 20 }).default("new").notNull(), // NEW, READ, ARCHIVED
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

export type Feedback = typeof feedback.$inferSelect;
export type NewFeedback = typeof feedback.$inferInsert;

// ============================================================================
// SAVED SIMULATIONS (User Specific)
// ============================================================================
export const savedSimulations = pgTable("saved_simulations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 100 }).default("admin-user").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  configuration: json("configuration").notNull(), // Stores { capital, step, stocks: [...] }
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SavedSimulation = typeof savedSimulations.$inferSelect;
export type NewSavedSimulation = typeof savedSimulations.$inferInsert;

// ============================================================================
// RATE LIMITS - DDoS Protection
// ============================================================================
export const rateLimits = pgTable("rate_limits", {
  key: varchar("key", { length: 255 }).primaryKey(), // IP or UserID
  count: integer("count").default(0).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export type RateLimit = typeof rateLimits.$inferSelect;
export type NewRateLimit = typeof rateLimits.$inferInsert;

// ============================================================================
// SAVINGS ENTRIES (User Specific)
// ============================================================================
export const savingsEntries = pgTable("savings_entries", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 100 }).default("admin-user").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  bankName: varchar("bank_name", { length: 255 }),
  type: varchar("type", { length: 50 }).notNull(), // 'SAVINGS', 'FIXED_DEPOSIT', 'OTHER'
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("LKR").notNull(),
  startDate: timestamp("start_date"),
  maturityDate: timestamp("maturity_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type SavingsEntry = typeof savingsEntries.$inferSelect;
export type NewSavingsEntry = typeof savingsEntries.$inferInsert;
