import { z } from "zod";
import { and, desc, eq, gte, like, lt, or, sql } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { authed } from "../middleware/auth";
import { db } from "../database";
import * as schema from "../database/schema";
import { monthRange } from "../lib/period";

const listInput = z.object({
  /** "YYYY-MM"; omit for all time. */
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  categoryId: z.number().int().optional(),
  kind: z.enum(["expense", "income"]).optional(),
  search: z.string().max(80).optional(),
  limit: z.number().int().min(1).max(500).default(100),
});

const createInput = z.object({
  amount: z.number().int().positive(),
  kind: z.enum(["expense", "income"]).default("expense"),
  categoryId: z.number().int(),
  merchant: z.string().max(60).default(""),
  note: z.string().max(200).nullable().optional(),
  /** ISO date string; defaults to now. */
  occurredAt: z.string().optional(),
});

function rowSelection() {
  return {
    id: schema.transactions.id,
    amount: schema.transactions.amount,
    kind: schema.transactions.kind,
    categoryId: schema.transactions.categoryId,
    merchant: schema.transactions.merchant,
    note: schema.transactions.note,
    occurredAt: schema.transactions.occurredAt,
    categoryName: schema.categories.name,
    categoryIcon: schema.categories.icon,
    categoryColor: schema.categories.color,
  };
}

/** Every query is scoped to the caller, so ids from another account never match. */
const owned = (userId: string) => eq(schema.transactions.userId, userId);

export const transactions = {
  list: authed.input(listInput).handler(async ({ input, context }) => {
    const filters = [owned(context.userId)];
    if (input.month) {
      const { start, end } = monthRange(input.month);
      filters.push(gte(schema.transactions.occurredAt, start));
      filters.push(lt(schema.transactions.occurredAt, end));
    }
    if (input.categoryId) filters.push(eq(schema.transactions.categoryId, input.categoryId));
    if (input.kind) filters.push(eq(schema.transactions.kind, input.kind));
    if (input.search?.trim()) {
      const term = `%${input.search.trim().toLowerCase()}%`;
      filters.push(
        or(
          like(sql`lower(${schema.transactions.merchant})`, term),
          like(sql`lower(${schema.categories.name})`, term),
          like(sql`lower(coalesce(${schema.transactions.note}, ''))`, term),
        )!,
      );
    }

    return db
      .select(rowSelection())
      .from(schema.transactions)
      .innerJoin(schema.categories, eq(schema.categories.id, schema.transactions.categoryId))
      .where(and(...filters))
      .orderBy(desc(schema.transactions.occurredAt), desc(schema.transactions.id))
      .limit(input.limit);
  }),

  byId: authed.input(z.object({ id: z.number().int() })).handler(async ({ input, context }) => {
    const [row] = await db
      .select(rowSelection())
      .from(schema.transactions)
      .innerJoin(schema.categories, eq(schema.categories.id, schema.transactions.categoryId))
      .where(and(eq(schema.transactions.id, input.id), owned(context.userId)));
    if (!row) throw new ORPCError("NOT_FOUND", { message: "Transaction not found" });
    return row;
  }),

  create: authed.input(createInput).handler(async ({ input, context }) => {
    const [category] = await db
      .select()
      .from(schema.categories)
      .where(
        and(
          eq(schema.categories.id, input.categoryId),
          eq(schema.categories.userId, context.userId),
        ),
      );
    if (!category) throw new ORPCError("NOT_FOUND", { message: "Category not found" });

    const [created] = await db
      .insert(schema.transactions)
      .values({
        userId: context.userId,
        amount: input.amount,
        kind: input.kind,
        categoryId: input.categoryId,
        merchant: input.merchant || category.name,
        note: input.note ?? null,
        occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
      })
      .returning();
    return created;
  }),

  update: authed
    .input(
      createInput.partial().extend({
        id: z.number().int(),
      }),
    )
    .handler(async ({ input, context }) => {
      const { id, occurredAt, ...rest } = input;

      const [existing] = await db
        .select()
        .from(schema.transactions)
        .where(and(eq(schema.transactions.id, id), owned(context.userId)));
      if (!existing) throw new ORPCError("NOT_FOUND", { message: "Transaction not found" });

      if (rest.categoryId !== undefined) {
        const [category] = await db
          .select()
          .from(schema.categories)
          .where(
            and(
              eq(schema.categories.id, rest.categoryId),
              eq(schema.categories.userId, context.userId),
            ),
          );
        if (!category) throw new ORPCError("NOT_FOUND", { message: "Category not found" });
      }

      // Only write keys the caller actually sent, so a partial edit never
      // blanks the fields it left out.
      const values: Partial<typeof schema.transactions.$inferInsert> = {};
      if (rest.amount !== undefined) values.amount = rest.amount;
      if (rest.kind !== undefined) values.kind = rest.kind;
      if (rest.categoryId !== undefined) values.categoryId = rest.categoryId;
      if (rest.merchant !== undefined) values.merchant = rest.merchant;
      if (rest.note !== undefined) values.note = rest.note ?? null;
      if (occurredAt) values.occurredAt = new Date(occurredAt);

      if (Object.keys(values).length === 0) return existing;

      const [updated] = await db
        .update(schema.transactions)
        .set(values)
        .where(and(eq(schema.transactions.id, id), owned(context.userId)))
        .returning();
      if (!updated) throw new ORPCError("NOT_FOUND", { message: "Transaction not found" });
      return updated;
    }),

  remove: authed.input(z.object({ id: z.number().int() })).handler(async ({ input, context }) => {
    const [deleted] = await db
      .delete(schema.transactions)
      .where(and(eq(schema.transactions.id, input.id), owned(context.userId)))
      .returning({ id: schema.transactions.id });
    if (!deleted) throw new ORPCError("NOT_FOUND", { message: "Transaction not found" });
    return { id: deleted.id };
  }),
};
