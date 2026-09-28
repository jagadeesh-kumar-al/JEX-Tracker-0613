/**
 * Seeds SpendWise demo data: categories, a monthly budget, and ~5 months of
 * transactions ending today. Run from packages/web:
 *   bun --env-file=../../.env src/api/database/seed.ts
 * Safe to re-run — it clears the three tables first.
 */
import { db } from "./__client";
import * as schema from "./schema";

type Seed = {
  name: string;
  icon: string;
  color: string;
  kind: "expense" | "income";
  budget?: number;
  /** Typical monthly spend in dollars, used to generate transactions. */
  monthly?: number;
  merchants?: string[];
  /** Transactions per month. */
  frequency?: number;
};

const CATEGORIES: Seed[] = [
  {
    name: "Groceries",
    icon: "groceries",
    color: "emerald",
    kind: "expense",
    budget: 60000,
    monthly: 520,
    frequency: 8,
    merchants: ["Whole Foods", "Trader Joe's", "Corner Market", "Sprouts"],
  },
  {
    name: "Travel",
    icon: "travel",
    color: "sky",
    kind: "expense",
    budget: 40000,
    monthly: 310,
    frequency: 2,
    merchants: ["Delta Air", "Airbnb", "Amtrak"],
  },
  {
    name: "Car",
    icon: "car",
    color: "indigo",
    kind: "expense",
    budget: 30000,
    monthly: 240,
    frequency: 4,
    merchants: ["Shell", "Chevron", "Jiffy Lube", "City Parking"],
  },
  {
    name: "Home",
    icon: "home",
    color: "violet",
    kind: "expense",
    budget: 20000,
    monthly: 180,
    frequency: 3,
    merchants: ["IKEA", "Home Depot", "Target"],
  },
  {
    name: "Insurance",
    icon: "insurance",
    color: "cyan",
    kind: "expense",
    budget: 18000,
    monthly: 165,
    frequency: 1,
    merchants: ["Geico", "Blue Shield"],
  },
  {
    name: "Education",
    icon: "education",
    color: "pink",
    kind: "expense",
    budget: 15000,
    monthly: 96,
    frequency: 2,
    merchants: ["Coursera", "Kindle Store", "Udemy"],
  },
  {
    name: "Shopping",
    icon: "shopping",
    color: "rose",
    kind: "expense",
    budget: 35000,
    monthly: 295,
    frequency: 5,
    merchants: ["Zara", "Amazon", "Uniqlo", "Nike"],
  },
  {
    name: "Internet",
    icon: "internet",
    color: "teal",
    kind: "expense",
    budget: 9000,
    monthly: 85,
    frequency: 1,
    merchants: ["Xfinity"],
  },
  {
    name: "Water",
    icon: "water",
    color: "sky",
    kind: "expense",
    budget: 6000,
    monthly: 48,
    frequency: 1,
    merchants: ["City Water"],
  },
  {
    name: "Rent",
    icon: "rent",
    color: "amber",
    kind: "expense",
    budget: 160000,
    monthly: 1550,
    frequency: 1,
    merchants: ["Bayview Apartments"],
  },
  {
    name: "Gym",
    icon: "gym",
    color: "lime",
    kind: "expense",
    budget: 8000,
    monthly: 65,
    frequency: 1,
    merchants: ["Equinox"],
  },
  {
    name: "Subscriptions",
    icon: "subscription",
    color: "orange",
    kind: "expense",
    budget: 10000,
    monthly: 78,
    frequency: 4,
    merchants: ["Netflix", "Spotify", "iCloud", "Figma"],
  },
  {
    name: "Dining",
    icon: "dining",
    color: "rose",
    kind: "expense",
    budget: 30000,
    monthly: 265,
    frequency: 9,
    merchants: ["Blue Bottle", "Sushi Yama", "Tacos El Rey", "Pasta Bar"],
  },
  {
    name: "Vacation",
    icon: "vacation",
    color: "teal",
    kind: "expense",
    budget: 20000,
    monthly: 120,
    frequency: 1,
    merchants: ["Booking.com", "Beach Rentals"],
  },
  {
    name: "Other",
    icon: "other",
    color: "slate",
    kind: "expense",
    budget: 10000,
    monthly: 70,
    frequency: 2,
    merchants: ["Post Office", "Pharmacy"],
  },
  {
    name: "Salary",
    icon: "salary",
    color: "emerald",
    kind: "income",
    monthly: 6200,
    frequency: 1,
    merchants: ["Northwind Studio"],
  },
  {
    name: "Freelance",
    icon: "freelance",
    color: "violet",
    kind: "income",
    monthly: 900,
    frequency: 2,
    merchants: ["Client — Lumen", "Client — Vero"],
  },
];

// Deterministic PRNG so repeated seeds produce the same nice-looking data.
let seedState = 20260926;
function rand() {
  seedState = (seedState * 1664525 + 1013904223) % 4294967296;
  return seedState / 4294967296;
}

function pick<T>(items: T[]): T {
  return items[Math.floor(rand() * items.length)];
}

async function main() {
  await db.delete(schema.transactions);
  await db.delete(schema.categories);
  await db.delete(schema.settings);

  await db.insert(schema.settings).values({
    monthlyBudget: 420000,
    currency: "USD",
    ownerName: "Alex Rivera",
  });

  const inserted = await db
    .insert(schema.categories)
    .values(
      CATEGORIES.map((c) => ({
        name: c.name,
        icon: c.icon,
        color: c.color,
        kind: c.kind,
        monthlyBudget: c.budget ?? null,
      })),
    )
    .returning();

  const byName = new Map(inserted.map((c) => [c.name, c]));
  const now = new Date();
  const rows: (typeof schema.transactions.$inferInsert)[] = [];

  for (let monthsAgo = 5; monthsAgo >= 0; monthsAgo--) {
    const monthDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, 1),
    );
    const year = monthDate.getUTCFullYear();
    const monthIndex = monthDate.getUTCMonth();
    const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
    const isCurrent = monthsAgo === 0;
    const maxDay = isCurrent ? now.getUTCDate() : lastDay;
    // Seasonal drift so the trend chart is not flat.
    const drift = 0.82 + rand() * 0.4;

    for (const seed of CATEGORIES) {
      const category = byName.get(seed.name);
      if (!category || !seed.monthly || !seed.frequency) continue;

      const count = seed.frequency;
      const monthTotal = seed.monthly * drift * (isCurrent ? maxDay / lastDay : 1);
      if (monthTotal < 1) continue;

      for (let i = 0; i < count; i++) {
        const dayBase = seed.name === "Rent" || seed.kind === "income"
          ? 1 + Math.floor(i * 14)
          : 1 + Math.floor(rand() * lastDay);
        const day = Math.min(maxDay, Math.max(1, dayBase));
        if (day > maxDay) continue;
        // Split the month total across transactions with some variance.
        const weight = 0.6 + rand() * 0.8;
        const amount = Math.max(
          150,
          Math.round(((monthTotal / count) * weight * 100) / 5) * 5,
        );
        rows.push({
          amount,
          kind: seed.kind,
          categoryId: category.id,
          merchant: seed.merchants ? pick(seed.merchants) : seed.name,
          note: null,
          occurredAt: new Date(
            Date.UTC(year, monthIndex, day, 9 + Math.floor(rand() * 10), 0, 0),
          ),
          createdAt: new Date(),
        });
      }
    }
  }

  // Insert in chunks — libsql caps statement size.
  for (let i = 0; i < rows.length; i += 50) {
    await db.insert(schema.transactions).values(rows.slice(i, i + 50));
  }

  console.log(`Seeded ${inserted.length} categories and ${rows.length} transactions.`);
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
