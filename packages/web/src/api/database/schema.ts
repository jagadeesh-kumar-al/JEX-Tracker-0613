import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

/**
 * SpendWise schema. Money is stored as integer **cents** to avoid float drift.
 * Apply with `bun run db:push` from packages/web.
 */

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** Owner. Null only for rows created before sign-in existed. */
  userId: text("user_id"),
  name: text("name").notNull(),
  /** Icon key resolved to a platform icon component (see lib/categories). */
  icon: text("icon").notNull().default("tag"),
  /** Hue key from the design palette (violet, emerald, sky, ...). */
  color: text("color").notNull().default("violet"),
  kind: text("kind", { enum: ["expense", "income"] })
    .notNull()
    .default("expense"),
  /** Optional monthly budget for this category, in cents. */
  monthlyBudget: integer("monthly_budget"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const transactions = sqliteTable(
  "transactions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    /** Owner. Null only for rows created before sign-in existed. */
    userId: text("user_id"),
    /** Always positive, in cents. `kind` decides the sign in the UI. */
    amount: integer("amount").notNull(),
    kind: text("kind", { enum: ["expense", "income"] })
      .notNull()
      .default("expense"),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    merchant: text("merchant").notNull().default(""),
    note: text("note"),
    occurredAt: integer("occurred_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("transactions_occurred_at_idx").on(table.occurredAt),
    index("transactions_user_id_idx").on(table.userId),
  ],
);

export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** One row per account. Null only for the pre-sign-in row. */
  userId: text("user_id"),
  /** Overall monthly budget in cents. */
  monthlyBudget: integer("monthly_budget").notNull().default(250000),
  currency: text("currency").notNull().default("USD"),
  /** "light" | "dark" | "system" — chosen in preferences, synced across devices. */
  themeMode: text("theme_mode").notNull().default("system"),
  ownerName: text("owner_name").notNull().default(""),
});

export type Category = typeof categories.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Settings = typeof settings.$inferSelect;

export * from "./auth-schema";
