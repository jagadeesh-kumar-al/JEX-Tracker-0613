import { useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseAmountToCents } from "../lib/format";
import { useCreateTransaction, useUpdateTransaction } from "../queries/transactions";
import { CategoryPicker } from "./category-picker";
import { useCurrency } from "./preferences";
import type { TransactionRow } from "../types/finance";

function toDateInput(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function todayInput() {
  return toDateInput(new Date());
}

function centsToInput(cents: number) {
  return (cents / 100).toFixed(2);
}

export function AddTransactionDialog({
  open,
  onClose,
  defaultCategoryId,
  transaction,
}: {
  open: boolean;
  onClose: () => void;
  defaultCategoryId?: number;
  /** Pass a row to edit it instead of creating a new one. */
  transaction?: TransactionRow | null;
}) {
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const currency = useCurrency();
  const isEdit = Boolean(transaction);
  const [kind, setKind] = useState<"expense" | "income">(transaction?.kind ?? "expense");
  const [amount, setAmount] = useState(
    transaction ? centsToInput(transaction.amount) : "",
  );
  const [categoryId, setCategoryId] = useState<number | null>(
    transaction?.categoryId ?? defaultCategoryId ?? null,
  );
  const [merchant, setMerchant] = useState(transaction?.merchant ?? "");
  const [note, setNote] = useState(transaction?.note ?? "");
  const [date, setDate] = useState(
    transaction ? toDateInput(transaction.occurredAt) : todayInput(),
  );
  const [error, setError] = useState<string | null>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  // Re-hydrate whenever the dialog opens, or the row being edited changes.
  useEffect(() => {
    if (!open) return;
    setError(null);
    if (transaction) {
      setKind(transaction.kind);
      setAmount(centsToInput(transaction.amount));
      setCategoryId(transaction.categoryId);
      setMerchant(transaction.merchant ?? "");
      setNote(transaction.note ?? "");
      setDate(toDateInput(transaction.occurredAt));
    } else {
      setKind("expense");
      setAmount("");
      setCategoryId(defaultCategoryId ?? null);
      setMerchant("");
      setNote("");
      setDate(todayInput());
    }
  }, [open, defaultCategoryId, transaction]);

  // Focus the amount field when the dialog opens (replaces autoFocus).
  useEffect(() => {
    if (open) amountRef.current?.focus();
  }, [open]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function submit() {
    const cents = parseAmountToCents(amount);
    if (!cents) return setError("Enter an amount greater than zero.");
    if (!categoryId) return setError("Pick a category.");
    setError(null);
    const payload = {
      amount: cents,
      kind,
      categoryId,
      merchant: merchant.trim(),
      note: note.trim() || null,
      occurredAt: new Date(`${date}T12:00:00`).toISOString(),
    };
    try {
      if (transaction) {
        await updateTransaction.mutateAsync({ id: transaction.id, ...payload });
      } else {
        await createTransaction.mutateAsync(payload);
      }
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save. Try again.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#1a162b]/45 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-[28px] bg-card p-6 shadow-lifted sm:rounded-[28px] sm:p-7">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              {isEdit ? "Edit transaction" : "Add transaction"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isEdit
                ? "Change any detail and save."
                : "Log what you spent or earned in a few taps."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full bg-muted text-muted-foreground transition hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-6 inline-flex rounded-full bg-muted p-1">
          {(["expense", "income"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setKind(option);
                setCategoryId(null);
              }}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-semibold capitalize transition",
                kind === option
                  ? "bg-card text-foreground shadow-soft"
                  : "text-muted-foreground",
              )}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-3 rounded-2xl bg-muted/70 px-5 py-4">
          <span className="num text-2xl font-semibold text-muted-foreground">{currency.symbol}</span>
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="decimal"
            placeholder="0.00"
            aria-label="Amount"
            ref={amountRef}
            className="num w-full bg-transparent text-3xl font-semibold text-foreground outline-none placeholder:text-muted-foreground/60"
          />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Merchant
            </span>
            <input
              value={merchant}
              onChange={(event) => setMerchant(event.target.value)}
              placeholder="Whole Foods"
              aria-label="Merchant"
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary/50"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Date
            </span>
            <input
              type="date"
              aria-label="Date"
              value={date}
              max={todayInput()}
              onChange={(event) => setDate(event.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary/50"
            />
          </label>
        </div>

        <label className="mt-3 block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Note (optional)
          </span>
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Weekly shop"
            aria-label="Note"
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary/50"
          />
        </label>

        <div className="mt-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Category
          </p>
          <CategoryPicker value={categoryId} onChange={setCategoryId} kind={kind} />
        </div>

        {error && <p className="mt-4 text-sm font-medium text-destructive">{error}</p>}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-1 rounded-2xl bg-muted text-sm font-semibold text-foreground transition hover:bg-muted/70"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={createTransaction.isPending || updateTransaction.isPending}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            {(createTransaction.isPending || updateTransaction.isPending) && (
              <Loader2 className="size-4 animate-spin" />
            )}
            {isEdit ? "Save changes" : "Save transaction"}
          </button>
        </div>
      </div>
    </div>
  );
}
