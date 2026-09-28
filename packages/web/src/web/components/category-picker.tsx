import { useMemo, useState } from "react";
import { Check, Loader2, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  COLOR_CHOICES,
  ICON_CHOICES,
  categoryColor,
  categoryIcon,
  categoryTint,
} from "../lib/categories";
import { useCategories, useCreateCategory } from "../queries/categories";
import type { CategoryRow } from "../types/finance";

/** Icon grid category picker — mirrors the mobile "Select Category" screen. */
export function CategoryPicker({
  value,
  onChange,
  kind = "expense",
  columns = "grid-cols-4 sm:grid-cols-5",
}: {
  value: number | null;
  onChange: (id: number) => void;
  kind?: "expense" | "income";
  columns?: string;
}) {
  const categories = useCategories();
  const createCategory = useCreateCategory();
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ name: "", icon: "tag", color: "violet" });

  const items = useMemo(() => {
    const rows = (categories.data ?? []) as CategoryRow[];
    const term = search.trim().toLowerCase();
    return rows
      .filter((row) => row.kind === kind)
      .filter((row) => (term ? row.name.toLowerCase().includes(term) : true));
  }, [categories.data, kind, search]);

  async function submitDraft() {
    if (!draft.name.trim()) return;
    const created = await createCategory.mutateAsync({
      name: draft.name.trim(),
      icon: draft.icon,
      color: draft.color,
      kind,
    });
    if (created) onChange(created.id);
    setDraft({ name: "", icon: "tag", color: "violet" });
    setCreating(false);
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search for categories"
          aria-label="Search categories"
          className="h-12 w-full rounded-2xl border border-border bg-card pl-11 pr-4 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
        />
      </div>

      {categories.isLoading ? (
        <div className={cn("grid gap-3", columns)}>
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="h-[86px] animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className={cn("grid gap-3", columns)}>
          <button
            type="button"
            onClick={() => setCreating((open) => !open)}
            className="flex h-[86px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-primary/40 bg-card text-primary transition hover:bg-primary/5"
          >
            {creating ? <X className="size-5" /> : <Plus className="size-5" />}
            <span className="text-xs font-semibold">{creating ? "Cancel" : "Add"}</span>
          </button>

          {items.map((category) => {
            const Icon = categoryIcon(category.icon);
            const selected = value === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onChange(category.id)}
                className={cn(
                  "relative flex h-[86px] flex-col items-center justify-center gap-1.5 rounded-2xl bg-card text-center shadow-soft transition hover:-translate-y-0.5",
                  selected && "ring-2 ring-primary",
                )}
              >
                {selected && (
                  <span className="absolute right-2 top-2 grid size-4 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3" />
                  </span>
                )}
                <span
                  className="grid size-9 place-items-center rounded-xl"
                  style={{ backgroundColor: categoryTint(category.color) }}
                >
                  <Icon className="size-4.5" style={{ color: categoryColor(category.color) }} />
                </span>
                <span className="px-1 text-[11px] font-semibold leading-tight text-foreground">
                  {category.name}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {creating && (
        <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <input
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            placeholder="Category name"
            aria-label="Category name"
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary/50"
          />
          <div className="flex flex-wrap gap-2">
            {ICON_CHOICES.slice(0, 16).map((key) => {
              const Icon = categoryIcon(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDraft({ ...draft, icon: key })}
                  className={cn(
                    "grid size-9 place-items-center rounded-xl border border-border transition",
                    draft.icon === key ? "border-primary bg-primary/10" : "hover:bg-muted",
                  )}
                >
                  <Icon className="size-4" />
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2">
            {COLOR_CHOICES.map((key) => (
              <button
                key={key}
                type="button"
                aria-label={key}
                onClick={() => setDraft({ ...draft, color: key })}
                className={cn(
                  "size-7 rounded-full transition",
                  draft.color === key && "ring-2 ring-foreground/40 ring-offset-2",
                )}
                style={{ backgroundColor: categoryColor(key) }}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={submitDraft}
            disabled={!draft.name.trim() || createCategory.isPending}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
          >
            {createCategory.isPending && <Loader2 className="size-4 animate-spin" />}
            Create category
          </button>
        </div>
      )}
    </div>
  );
}
