import { eq, isNull, sql } from "drizzle-orm";
import { db } from "../database";
import * as schema from "../database/schema";

type Starter = {
  name: string;
  icon: string;
  color: string;
  kind: "expense" | "income";
  monthlyBudget: number | null;
};

/** Categories every new account starts with. */
const STARTER_CATEGORIES: Starter[] = [
  { name: "Groceries", icon: "groceries", color: "emerald", kind: "expense", monthlyBudget: 60000 },
  { name: "Rent", icon: "rent", color: "amber", kind: "expense", monthlyBudget: 160000 },
  { name: "Dining", icon: "dining", color: "rose", kind: "expense", monthlyBudget: 30000 },
  { name: "Travel", icon: "travel", color: "sky", kind: "expense", monthlyBudget: 40000 },
  { name: "Car", icon: "car", color: "indigo", kind: "expense", monthlyBudget: 30000 },
  { name: "Home", icon: "home", color: "violet", kind: "expense", monthlyBudget: 20000 },
  { name: "Shopping", icon: "shopping", color: "rose", kind: "expense", monthlyBudget: 35000 },
  { name: "Internet", icon: "internet", color: "teal", kind: "expense", monthlyBudget: 9000 },
  {
    name: "Subscriptions",
    icon: "subscription",
    color: "orange",
    kind: "expense",
    monthlyBudget: 10000,
  },
  { name: "Gym", icon: "gym", color: "lime", kind: "expense", monthlyBudget: 8000 },
  { name: "Insurance", icon: "insurance", color: "cyan", kind: "expense", monthlyBudget: 18000 },
  { name: "Other", icon: "other", color: "slate", kind: "expense", monthlyBudget: 10000 },
  { name: "Salary", icon: "salary", color: "emerald", kind: "income", monthlyBudget: null },
  { name: "Freelance", icon: "freelance", color: "violet", kind: "income", monthlyBudget: null },
];

/**
 * Gives a freshly created account its own data.
 *
 * Rows that predate authentication carry no owner. The very first account to
 * sign up adopts them, so the data entered before login is not orphaned;
 * every later account starts from the starter categories instead.
 */
export async function provisionUser(userId: string) {
  const [claimed] = await db
    .update(schema.categories)
    .set({ userId })
    .where(isNull(schema.categories.userId))
    .returning({ id: schema.categories.id });

  if (claimed) {
    await db
      .update(schema.transactions)
      .set({ userId })
      .where(isNull(schema.transactions.userId));
    await db.update(schema.settings).set({ userId }).where(isNull(schema.settings.userId));
  } else {
    await db
      .insert(schema.categories)
      .values(STARTER_CATEGORIES.map((category) => ({ ...category, userId })));
  }

  const [existingSettings] = await db
    .select({ id: schema.settings.id })
    .from(schema.settings)
    .where(eq(schema.settings.userId, userId))
    .limit(1);
  if (!existingSettings) await db.insert(schema.settings).values({ userId });
}

/** Safety net for accounts created before provisioning existed. */
export async function ensureProvisioned(userId: string) {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.categories)
    .where(sql`${schema.categories.userId} = ${userId}`);
  if (Number(row?.count ?? 0) > 0) return;
  await provisionUser(userId);
}
