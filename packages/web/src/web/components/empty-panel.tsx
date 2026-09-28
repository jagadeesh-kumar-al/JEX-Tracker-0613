import { cn } from "@/lib/utils";

export function EmptyPanel({
  label,
  hint,
  className,
}: {
  label: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid place-items-center rounded-2xl border border-dashed border-border/70 px-4 py-8 text-center",
        className,
      )}
    >
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}
