import { useId, useState } from "react";
import { categoryColor } from "../lib/categories";
import { formatMoney, formatPercent } from "../lib/format";
import { useCurrency } from "./preferences";
import { cn } from "@/lib/utils";

type Slice = { label: string; value: number; color: string };

/** Donut breakdown with a hover-driven center label. */
export function DonutChart({
  slices,
  total,
  size = 208,
  thickness = 26,
  centerLabel = "Total spent",
}: {
  slices: Slice[];
  total: number;
  size?: number;
  thickness?: number;
  centerLabel?: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  useCurrency();
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const visible = slices.filter((slice) => slice.value > 0);

  let offset = 0;
  const arcs = visible.map((slice, index) => {
    const share = total > 0 ? slice.value / total : 0;
    const length = share * circumference;
    const arc = {
      ...slice,
      index,
      share,
      dash: `${Math.max(length - 3, 0)} ${circumference - Math.max(length - 3, 0)}`,
      rotation: (offset / circumference) * 360,
    };
    offset += length;
    return arc;
  });

  const shown = active !== null ? visible[active] : null;

  return (
    <div className="flex items-center justify-center" style={{ width: size, height: size }}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--muted)"
            strokeWidth={thickness}
          />
          {arcs.map((arc) => (
            <circle
              key={arc.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={arc.color}
              strokeWidth={active === arc.index ? thickness + 6 : thickness}
              strokeDasharray={arc.dash}
              strokeLinecap="round"
              transform={`rotate(${arc.rotation} ${size / 2} ${size / 2})`}
              className="cursor-pointer transition-[stroke-width] duration-200"
              onMouseEnter={() => setActive(arc.index)}
              onMouseLeave={() => setActive(null)}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {shown ? shown.label : centerLabel}
          </span>
          <span className="num text-2xl font-semibold text-foreground">
            {formatMoney(shown ? shown.value : total, { compact: total > 9_999_99 })}
          </span>
          {shown && (
            <span className="text-xs text-muted-foreground">
              {formatPercent(total > 0 ? shown.value / total : 0, 1)} of total
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/** Vertical bars with value labels — used for trend and weekly charts. */
export function BarSeries({
  data,
  height = 200,
  highlightLast = true,
  compact = true,
}: {
  data: { label: string; value: number; secondary?: number }[];
  height?: number;
  highlightLast?: boolean;
  compact?: boolean;
}) {
  const gradientId = useId();
  useCurrency();
  const max = Math.max(...data.map((d) => Math.max(d.value, d.secondary ?? 0)), 1);

  return (
    <div className="w-full">
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#A78BFA" />
          </linearGradient>
        </defs>
      </svg>
      <div className="flex items-end gap-2 sm:gap-3" style={{ height }}>
        {data.map((point, index) => {
          const isLast = highlightLast && index === data.length - 1;
          const alwaysLabel = data.length <= 7;
          const barHeight = Math.max((point.value / max) * (height - 34), 4);
          const secondaryHeight = point.secondary
            ? Math.max((point.secondary / max) * (height - 34), 4)
            : 0;
          return (
            <div key={point.label} className="group flex flex-1 flex-col items-center gap-2">
              <span
                className={cn(
                  "num text-[11px] font-semibold transition-opacity",
                  isLast ? "text-foreground" : "text-muted-foreground",
                  alwaysLabel || isLast ? "" : "opacity-0 group-hover:opacity-100",
                )}
              >
                {formatMoney(point.value, { compact })}
              </span>
              <div className="flex w-full items-end justify-center gap-1">
                <div
                  className="max-w-12 flex-1 rounded-t-[10px] transition-all duration-500"
                  style={{
                    height: barHeight,
                    background: isLast
                      ? "linear-gradient(180deg,#5B21B6,#8B5CF6)"
                      : "linear-gradient(180deg,#A78BFA,#DDD6FE)",
                  }}
                />
                {secondaryHeight > 0 && (
                  <div
                    className="w-1/4 max-w-6 rounded-t-[8px] bg-success/45 transition-all duration-500"
                    style={{ height: secondaryHeight }}
                    title={`Income ${formatMoney(point.secondary ?? 0)}`}
                  />
                )}
              </div>
              <span className="text-[11px] font-medium text-muted-foreground">{point.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Smooth area chart for the day-by-day spend of a month. */
export function DailyArea({
  data,
  height = 120,
}: {
  data: { day: number; total: number }[];
  height?: number;
}) {
  const gradientId = useId();
  const width = 560;
  const max = Math.max(...data.map((d) => d.total), 1);
  const stepX = data.length > 1 ? width / (data.length - 1) : width;

  const points = data.map((point, index) => ({
    x: index * stepX,
    y: height - (point.total / max) * (height - 12) - 6,
  }));

  const path = points
    .map((point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      const prev = points[index - 1];
      const midX = (prev.x + point.x) / 2;
      return `C ${midX} ${prev.y}, ${midX} ${point.y}, ${point.x} ${point.y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L ${width} ${height} L 0 ${height} Z`} fill={`url(#${gradientId})`} />
      <path d={path} fill="none" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/** Budget progress ring. */
export function ProgressRing({
  share,
  size = 132,
  thickness = 12,
  children,
}: {
  share: number;
  size?: number;
  thickness?: number;
  children?: React.ReactNode;
}) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(share, 0), 1);
  const over = share > 1;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth={thickness}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={over ? "#FFB4C8" : "#FFFFFF"}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${clamped * circumference} ${circumference}`}
          className="transition-[stroke-dasharray] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

/** Horizontal category bars with share labels. */
export function CategoryBars({
  rows,
}: {
  rows: { name: string; color: string; total: number; share: number }[];
}) {
  const max = Math.max(...rows.map((row) => row.total), 1);
  useCurrency();
  return (
    <div className="space-y-3.5">
      {rows.map((row) => (
        <div key={row.name} className="space-y-1.5">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium text-foreground">{row.name}</span>
            <span className="num font-semibold text-foreground">
              {formatMoney(row.total)}
              <span className="ml-2 text-xs font-medium text-muted-foreground">
                {formatPercent(row.share, 1)}
              </span>
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${(row.total / max) * 100}%`,
                backgroundColor: categoryColor(row.color),
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
