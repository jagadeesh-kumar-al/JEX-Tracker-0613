import { z } from "zod";
import { and, eq, asc } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { authed } from "../middleware/auth";
import { db } from "../database";
import * as schema from "../database/schema";

const categoryInput = z.object({
  name: z.string().min(1).max(40),
  icon: z.string().min(1).max(40).default("tag"),
  color: z.string().min(1).max(20).default("violet"),
  kind: z.enum(["expense", "income"]).default("expense"),
  monthlyBudget: z.number().int().nonnegative().nullable().optional(),
});

/** Every query is scoped to the caller, so ids from another account never match. */
const owned = (userId: string) => eq(schema.categories.userId, userId);

export const categories = {
  list: authed.handler(({ context }) =>
    db
      .select()
      .from(schema.categories)
      .where(owned(context.userId))
      .orderBy(asc(schema.categories.id)),
  ),

  create: authed.input(categoryInput).handler(async ({ input, context }) => {
    const [created] = await db
      .insert(schema.categories)
      .values({
        userId: context.userId,
        name: input.name,
        icon: input.icon,
        color: input.color,
        kind: input.kind,
        monthlyBudget: input.monthlyBudget ?? null,
      })
      .returning();
    return created;
  }),

  update: authed
    .input(categoryInput.partial().extend({ id: z.number().int() }))
    .handler(async ({ input, context }) => {
      const { id, ...rest } = input;
      const [updated] = await db
        .update(schema.categories)
        .set(rest)
        .where(and(eq(schema.categories.id, id), owned(context.userId)))
        .returning();
      if (!updated) throw new ORPCError("NOT_FOUND", { message: "Category not found" });
      return updated;
    }),

  remove: authed.input(z.object({ id: z.number().int() })).handler(async ({ input, context }) => {
    const [category] = await db
      .select({ id: schema.categories.id })
      .from(schema.categories)
      .where(and(eq(schema.categories.id, input.id), owned(context.userId)));
    if (!category) throw new ORPCError("NOT_FOUND", { message: "Category not found" });

    await db
      .delete(schema.transactions)
      .where(
        and(
          eq(schema.transactions.categoryId, input.id),
          eq(schema.transactions.userId, context.userId),
        ),
      );
    await db.delete(schema.categories).where(eq(schema.categories.id, input.id));
    return { id: input.id };
  }),
};
