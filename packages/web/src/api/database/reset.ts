/**
 * Clears all demo/seed transaction data so the app starts empty.
 * Categories are kept (the picker needs them) and settings are reset to
 * neutral defaults. Run from packages/web:
 *   bun --env-file=../../.env src/api/database/reset.ts
 *
 * Pass --all to also wipe categories:
 *   bun --env-file=../../.env src/api/database/reset.ts --all
 */
import { db } from "./__client";
import * as schema from "./schema";

const wipeCategories = process.argv.includes("--all");

await db.delete(schema.transactions);
if (wipeCategories) await db.delete(schema.categories);

await db.delete(schema.settings);
await db.insert(schema.settings).values({
  monthlyBudget: 250000,
  currency: "USD",
  ownerName: "You",
});

const [{ count: categoryCount } = { count: 0 }] = await db
  .select({ count: schema.categories.id })
  .from(schema.categories)
  .then((rows) => [{ count: rows.length }]);

console.log(
  `Cleared all transactions. ${
    wipeCategories ? "Categories wiped." : `${categoryCount} categories kept.`
  } Settings reset.`,
);
