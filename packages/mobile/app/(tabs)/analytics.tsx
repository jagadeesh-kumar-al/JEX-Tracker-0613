import { useState } from "react";
import { Dimensions, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/use-colors";
import { Type } from "@/constants/theme";
import { useAppState } from "@/components/app-state";
import { Card, CategoryTile, MonthSwitcher, SectionTitle } from "@/components/ui";
import { BarSeries, CategoryBars, DailyArea, DonutChart } from "@/components/charts";
import { useOverview } from "@/queries/analytics";
import { categoryColor } from "@/lib/categories";
import { formatMoney, formatPercent } from "@/lib/format";
import { useCurrency } from "@/components/preferences";

const width = Dimensions.get("window").width;

export default function AnalyticsScreen() {
  const colors = useColors();
  useCurrency();
  const insets = useSafeAreaInsets();
  const { month } = useAppState();
  const [range, setRange] = useState<"monthly" | "weekly">("monthly");
  const overview = useOverview(month);
  const data = overview.data;

  const bars =
    range === "monthly"
      ? (data?.trend ?? []).map((point) => ({
          label: point.label,
          value: point.spent,
          secondary: point.income,
        }))
      : (data?.weekly ?? []).map((point) => ({ label: point.label, value: point.total }));

  const slices = (data?.byCategory ?? []).slice(0, 6).map((entry) => ({
    label: entry.name,
    value: entry.total,
    color: categoryColor(entry.color),
  }));

  const highlights = [
    {
      icon: "flame-outline" as const,
      label: "Biggest expense",
      value: data?.largest ? formatMoney(data.largest.amount) : "—",
      hint: data?.largest?.merchant || data?.largest?.name || "No expenses",
    },
    {
      icon: "speedometer-outline" as const,
      label: "Daily average",
      value: formatMoney(data?.dailyAvg ?? 0),
      hint: `${data?.transactionCount ?? 0} transactions`,
    },
    {
      icon: "trending-up-outline" as const,
      label: "Projected",
      value: formatMoney(data?.projected ?? 0),
      hint: "Full-month pace",
    },
    {
      icon: "swap-vertical-outline" as const,
      label: "vs last month",
      value:
        (data?.changeShare ?? 0) === 0
          ? "—"
          : `${(data?.changeShare ?? 0) > 0 ? "+" : "−"}${Math.abs((data?.changeShare ?? 0) * 100).toFixed(0)}%`,
      hint: `Was ${formatMoney(data?.prevSpent ?? 0)}`,
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 14,
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View>
          <Text style={{ fontFamily: Type.display, fontSize: 21, color: colors.foreground }}>
            Analytics
          </Text>
          <Text style={{ fontFamily: Type.body, fontSize: 12, color: colors.mutedForeground }}>
            {formatMoney(data?.spent ?? 0)} spent · {formatMoney(data?.income ?? 0)} in
          </Text>
        </View>
        <MonthSwitcher />
      </View>

      <View style={{ padding: 20, gap: 18 }}>
        {/* Highlights grid */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {highlights.map((item) => (
            <Card key={item.label} style={{ width: (width - 52) / 2, padding: 14 }}>
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.accent,
                }}
              >
                <Ionicons name={item.icon} size={16} color={colors.primary} />
              </View>
              <Text
                style={{
                  fontFamily: Type.bodySemi,
                  fontSize: 10,
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  color: colors.mutedForeground,
                  marginTop: 10,
                }}
              >
                {item.label}
              </Text>
              <Text
                style={{
                  fontFamily: Type.num,
                  fontSize: 18,
                  color: colors.foreground,
                  marginTop: 2,
                }}
              >
                {item.value}
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: Type.body,
                  fontSize: 11,
                  color: colors.mutedForeground,
                  marginTop: 1,
                }}
              >
                {item.hint}
              </Text>
            </Card>
          ))}
        </View>

        {/* Bars */}
        <Card>
          <SectionTitle
            action={
              <View
                style={{
                  flexDirection: "row",
                  borderRadius: 999,
                  backgroundColor: colors.muted,
                  padding: 3,
                }}
              >
                {(["monthly", "weekly"] as const).map((option) => {
                  const active = range === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => setRange(option)}
                      style={{
                        paddingHorizontal: 11,
                        paddingVertical: 5,
                        borderRadius: 999,
                        backgroundColor: active ? colors.card : "transparent",
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: Type.bodySemi,
                          fontSize: 11,
                          textTransform: "capitalize",
                          color: active ? colors.foreground : colors.mutedForeground,
                        }}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            }
          >
            {range === "monthly" ? "Monthly spend" : "Weekly buckets"}
          </SectionTitle>
          {bars.length ? <BarSeries data={bars} height={176} /> : <View style={{ height: 176 }} />}
          {range === "monthly" && (
            <View style={{ flexDirection: "row", gap: 16, marginTop: 10 }}>
              {[
                { label: "Spend", color: "#7C3AED" },
                { label: "Income", color: "rgba(18,185,129,0.6)" },
              ].map((legend) => (
                <View
                  key={legend.label}
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <View
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: 3,
                      backgroundColor: legend.color,
                    }}
                  />
                  <Text
                    style={{
                      fontFamily: Type.body,
                      fontSize: 11,
                      color: colors.mutedForeground,
                    }}
                  >
                    {legend.label}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Donut */}
        <Card>
          <SectionTitle>Category mix</SectionTitle>
          {slices.length ? (
            <View style={{ alignItems: "center", gap: 18 }}>
              <DonutChart slices={slices} total={data?.spent ?? 0} size={190} thickness={24} />
              <View style={{ width: "100%", gap: 9 }}>
                {slices.map((slice) => (
                  <View
                    key={slice.label}
                    style={{ flexDirection: "row", alignItems: "center", gap: 9 }}
                  >
                    <View
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: 3,
                        backgroundColor: slice.color,
                      }}
                    />
                    <Text
                      numberOfLines={1}
                      style={{
                        flex: 1,
                        fontFamily: Type.bodyMedium,
                        fontSize: 12.5,
                        color: colors.foreground,
                      }}
                    >
                      {slice.label}
                    </Text>
                    <Text
                      style={{ fontFamily: Type.num, fontSize: 12.5, color: colors.foreground }}
                    >
                      {formatMoney(slice.value)}
                    </Text>
                    <Text
                      style={{
                        fontFamily: Type.body,
                        fontSize: 11,
                        color: colors.mutedForeground,
                        width: 42,
                        textAlign: "right",
                      }}
                    >
                      {formatPercent(
                        (data?.spent ?? 0) > 0 ? slice.value / (data?.spent ?? 1) : 0,
                        1,
                      )}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <Text style={{ fontFamily: Type.body, fontSize: 12.5, color: colors.mutedForeground }}>
              No data for this month.
            </Text>
          )}
        </Card>

        {/* Full category bars */}
        {!!data?.byCategory?.length && (
          <Card>
            <SectionTitle>Every category</SectionTitle>
            <CategoryBars rows={data.byCategory} />
          </Card>
        )}

        {/* Daily rhythm */}
        <Card>
          <SectionTitle>Daily rhythm</SectionTitle>
          {data?.daily?.length ? (
            <DailyArea data={data.daily} width={width - 76} height={120} />
          ) : (
            <View style={{ height: 120 }} />
          )}
        </Card>

        {/* Top merchants */}
        <Card>
          <SectionTitle>Top merchants</SectionTitle>
          {data?.topMerchants?.length ? (
            <View style={{ gap: 4 }}>
              {data.topMerchants.map((merchant, index) => (
                <View
                  key={merchant.merchant}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    paddingVertical: 8,
                  }}
                >
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 9,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: colors.muted,
                    }}
                  >
                    <Text
                      style={{ fontFamily: Type.num, fontSize: 11, color: colors.mutedForeground }}
                    >
                      {index + 1}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontFamily: Type.bodySemi,
                        fontSize: 13,
                        color: colors.foreground,
                      }}
                    >
                      {merchant.merchant}
                    </Text>
                    <Text
                      style={{
                        fontFamily: Type.body,
                        fontSize: 11,
                        color: colors.mutedForeground,
                      }}
                    >
                      {merchant.count} {merchant.count === 1 ? "visit" : "visits"}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: Type.num, fontSize: 13.5, color: colors.foreground }}>
                    {formatMoney(merchant.total)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ fontFamily: Type.body, fontSize: 12.5, color: colors.mutedForeground }}>
              Nothing to rank yet.
            </Text>
          )}
        </Card>

        {/* Budget health */}
        <Card>
          <SectionTitle>Budget health</SectionTitle>
          <View style={{ gap: 12 }}>
            {(data?.byCategory ?? [])
              .filter((entry) => !!entry.budget)
              .slice(0, 6)
              .map((entry) => {
                const budget = entry.budget ?? 0;
                const ratio = budget > 0 ? entry.total / budget : 0;
                const over = ratio > 1;
                return (
                  <View key={entry.categoryId} style={{ flexDirection: "row", gap: 12 }}>
                    <CategoryTile icon={entry.icon} color={entry.color} size={36} />
                    <View style={{ flex: 1, gap: 6 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text
                          style={{
                            fontFamily: Type.bodySemi,
                            fontSize: 12.5,
                            color: colors.foreground,
                          }}
                        >
                          {entry.name}
                        </Text>
                        <Text
                          style={{
                            fontFamily: Type.num,
                            fontSize: 12,
                            color: over ? colors.destructive : colors.mutedForeground,
                          }}
                        >
                          {formatMoney(entry.total)} / {formatMoney(budget)}
                        </Text>
                      </View>
                      <View
                        style={{
                          height: 7,
                          borderRadius: 999,
                          backgroundColor: colors.muted,
                          overflow: "hidden",
                        }}
                      >
                        <View
                          style={{
                            height: "100%",
                            borderRadius: 999,
                            width: `${Math.min(ratio, 1) * 100}%`,
                            backgroundColor: over ? colors.destructive : colors.primary,
                          }}
                        />
                      </View>
                    </View>
                  </View>
                );
              })}
            {!(data?.byCategory ?? []).some((entry) => !!entry.budget) && (
              <Text
                style={{ fontFamily: Type.body, fontSize: 12.5, color: colors.mutedForeground }}
              >
                No category budgets set.
              </Text>
            )}
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}
