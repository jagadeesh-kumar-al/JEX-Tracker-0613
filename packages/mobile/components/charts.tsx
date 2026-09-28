import { View, Text } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { useColors } from "@/hooks/use-colors";
import { Type } from "@/constants/theme";
import { categoryColor } from "@/lib/categories";
import { formatMoney, formatPercent } from "@/lib/format";
import { useCurrency } from "@/components/preferences";

type Slice = { label: string; value: number; color: string };

/** Donut breakdown with a centred total. */
export function DonutChart({
  slices,
  total,
  size = 180,
  thickness = 22,
  centerLabel = "Spent",
}: {
  slices: Slice[];
  total: number;
  size?: number;
  thickness?: number;
  centerLabel?: string;
}) {
  const colors = useColors();
  useCurrency();
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const visible = slices.filter((slice) => slice.value > 0);

  let offset = 0;
  const arcs = visible.map((slice) => {
    const length = total > 0 ? (slice.value / total) * circumference : 0;
    const arc = {
      ...slice,
      dash: [Math.max(length - 3, 0), circumference - Math.max(length - 3, 0)],
      rotation: (offset / circumference) * 360 - 90,
    };
    offset += length;
    return arc;
  });

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.muted}
          strokeWidth={thickness}
        />
        {arcs.map((arc) => (
          <Circle
            key={arc.label}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={arc.color}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={arc.dash}
            transform={`rotate(${arc.rotation} ${size / 2} ${size / 2})`}
          />
        ))}
      </Svg>
      <View style={{ alignItems: "center" }}>
        <Text
          style={{
            fontFamily: Type.bodySemi,
            fontSize: 10,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: colors.mutedForeground,
          }}
        >
          {centerLabel}
        </Text>
        <Text style={{ fontFamily: Type.num, fontSize: 22, color: colors.foreground }}>
          {formatMoney(total, { compact: total > 999_999 })}
        </Text>
      </View>
    </View>
  );
}

/** Vertical bars — monthly trend or weekly buckets. */
export function BarSeries({
  data,
  height = 160,
}: {
  data: { label: string; value: number; secondary?: number }[];
  height?: number;
}) {
  const colors = useColors();
  useCurrency();
  const max = Math.max(...data.map((point) => Math.max(point.value, point.secondary ?? 0)), 1);
  const plot = height - 42;

  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8, height }}>
      {data.map((point, index) => {
        const isLast = index === data.length - 1;
        return (
          <View key={point.label} style={{ flex: 1, alignItems: "center", gap: 6 }}>
            <Text
              style={{
                fontFamily: Type.num,
                fontSize: 10,
                color: isLast ? colors.foreground : colors.mutedForeground,
              }}
            >
              {formatMoney(point.value, { compact: true })}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-end",
                justifyContent: "center",
                gap: 3,
                width: "100%",
              }}
            >
              <View
                style={{
                  flex: 1,
                  maxWidth: 26,
                  height: Math.max((point.value / max) * plot, 4),
                  borderTopLeftRadius: 8,
                  borderTopRightRadius: 8,
                  backgroundColor: isLast ? "#7C3AED" : "#C4B5FD",
                }}
              />
              {!!point.secondary && (
                <View
                  style={{
                    width: 8,
                    height: Math.max((point.secondary / max) * plot, 4),
                    borderTopLeftRadius: 6,
                    borderTopRightRadius: 6,
                    backgroundColor: "rgba(18,185,129,0.45)",
                  }}
                />
              )}
            </View>
            <Text
              style={{ fontFamily: Type.bodyMedium, fontSize: 10, color: colors.mutedForeground }}
            >
              {point.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/** Smooth area chart for daily spend. */
export function DailyArea({
  data,
  height = 110,
  width = 320,
}: {
  data: { day: number; total: number }[];
  height?: number;
  width?: number;
}) {
  if (!data.length) return null;
  const max = Math.max(...data.map((point) => point.total), 1);
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
    <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <LinearGradient id="area" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#7C3AED" stopOpacity="0.35" />
          <Stop offset="1" stopColor="#7C3AED" stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={`${path} L ${width} ${height} L 0 ${height} Z`} fill="url(#area)" />
      <Path d={path} fill="none" stroke="#7C3AED" strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

/** Budget ring drawn on the gradient hero. */
export function ProgressRing({
  share,
  size = 112,
  thickness = 10,
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

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth={thickness}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={share > 1 ? "#FFB4C8" : "#FFFFFF"}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={[clamped * circumference, circumference]}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ alignItems: "center" }}>{children}</View>
    </View>
  );
}

/** Horizontal category bars with share labels. */
export function CategoryBars({
  rows,
}: {
  rows: { name: string; color: string; total: number; share: number }[];
}) {
  const colors = useColors();
  useCurrency();
  const max = Math.max(...rows.map((row) => row.total), 1);

  return (
    <View style={{ gap: 14 }}>
      {rows.map((row) => (
        <View key={row.name} style={{ gap: 6 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text
              style={{ fontFamily: Type.bodyMedium, fontSize: 13, color: colors.foreground }}
              numberOfLines={1}
            >
              {row.name}
            </Text>
            <Text style={{ fontFamily: Type.num, fontSize: 13, color: colors.foreground }}>
              {formatMoney(row.total)}
              <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>
                {"  "}
                {formatPercent(row.share, 1)}
              </Text>
            </Text>
          </View>
          <View
            style={{
              height: 9,
              borderRadius: 999,
              backgroundColor: colors.muted,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: "100%",
                borderRadius: 999,
                width: `${(row.total / max) * 100}%`,
                backgroundColor: categoryColor(row.color),
              }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}
