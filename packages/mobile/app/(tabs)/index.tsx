import { useMemo } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { HeroGradient, Type } from "@/constants/theme";
import { useAppState } from "@/components/app-state";
import { Card, CategoryTile, MonthSwitcher, SectionTitle, TransactionList } from "@/components/ui";
import { CategoryBars, DailyArea, ProgressRing } from "@/components/charts";
import { useOverview, useSettings } from "@/queries/analytics";
import { useCategories } from "@/queries/categories";
import { useTransactions } from "@/queries/transactions";
import { formatMoney, formatPercent } from "@/lib/format";
import { useCurrency } from "@/components/preferences";

const width = Dimensions.get("window").width;

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen() {
  const colors = useColors();
  useCurrency();
  const insets = useSafeAreaInsets();
  const { month, patchDraft } = useAppState();
  const overview = useOverview(month);
  const settings = useSettings();
  const categories = useCategories();
  const filters = useMemo(() => ({ month, limit: 6 }), [month]);
  const transactions = useTransactions(filters);

  const data = overview.data;
  const spent = data?.spent ?? 0;
  const budget = data?.budget ?? 0;
  const share = data?.budgetShare ?? 0;
  const over = share > 1;
  const change = data?.changeShare ?? 0;

  const quickCategories = (categories.data ?? [])
    .filter((category) => category.kind === "expense")
    .slice(0, 7);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={overview.isFetching && !overview.isLoading}
          onRefresh={() => {
            overview.refetch();
            transactions.refetch();
          }}
          tintColor={colors.primary}
        />
      }
    >
      <LinearGradient
        colors={[...HeroGradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          paddingBottom: 66,
          borderBottomLeftRadius: 34,
          borderBottomRightRadius: 34,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View>
            <Text
              style={{
                fontFamily: Type.body,
                fontSize: 12.5,
                color: "rgba(255,255,255,0.72)",
              }}
            >
              {greeting()}
            </Text>
            <Text style={{ fontFamily: Type.display, fontSize: 19, color: "#FFFFFF" }}>
              {settings.data?.ownerName ?? "SpendWise"}
            </Text>
          </View>
          <MonthSwitcher tone="dark" />
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 24,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: Type.bodySemi,
                fontSize: 11,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.65)",
              }}
            >
              Spent this month
            </Text>
            {overview.isLoading ? (
              <ActivityIndicator color="#FFFFFF" style={{ marginTop: 14, alignSelf: "flex-start" }} />
            ) : (
              <Text
                style={{
                  fontFamily: Type.displayBold,
                  fontSize: 38,
                  color: "#FFFFFF",
                  marginTop: 2,
                  letterSpacing: -1,
                }}
              >
                {formatMoney(spent)}
              </Text>
            )}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                marginTop: 10,
                alignSelf: "flex-start",
                paddingHorizontal: 9,
                paddingVertical: 4,
                borderRadius: 999,
                backgroundColor: "rgba(255,255,255,0.16)",
              }}
            >
              <Ionicons
                name={change > 0 ? "trending-up" : "trending-down"}
                size={12}
                color="#FFFFFF"
              />
              <Text style={{ fontFamily: Type.bodySemi, fontSize: 11, color: "#FFFFFF" }}>
                {change === 0
                  ? "No prior month"
                  : `${Math.abs(change * 100).toFixed(0)}% vs last month`}
              </Text>
            </View>
          </View>

          <ProgressRing share={share} size={104} thickness={9}>
            <Text style={{ fontFamily: Type.displayBold, fontSize: 18, color: "#FFFFFF" }}>
              {budget > 0 ? formatPercent(Math.min(share, 9.99)) : "—"}
            </Text>
            <Text
              style={{
                fontFamily: Type.body,
                fontSize: 9.5,
                color: "rgba(255,255,255,0.7)",
                marginTop: 1,
              }}
            >
              of budget
            </Text>
          </ProgressRing>
        </View>
      </LinearGradient>

      {/* Floating stat strip */}
      <View style={{ paddingHorizontal: 20, marginTop: -46 }}>
        <Card style={{ flexDirection: "row", paddingVertical: 16 }}>
          {[
            { label: "Income", value: data?.income ?? 0, tone: colors.success },
            { label: "Net", value: data?.net ?? 0, tone: (data?.net ?? 0) >= 0 ? colors.success : colors.destructive },
            { label: "Left", value: Math.max(budget - spent, 0), tone: over ? colors.destructive : colors.foreground },
          ].map((stat, index) => (
            <View
              key={stat.label}
              style={{
                flex: 1,
                alignItems: "center",
                borderLeftWidth: index === 0 ? 0 : 1,
                borderLeftColor: colors.border,
              }}
            >
              <Text
                style={{
                  fontFamily: Type.bodySemi,
                  fontSize: 10,
                  letterSpacing: 0.7,
                  textTransform: "uppercase",
                  color: colors.mutedForeground,
                }}
              >
                {stat.label}
              </Text>
              <Text
                style={{
                  fontFamily: Type.num,
                  fontSize: 16,
                  color: stat.tone,
                  marginTop: 4,
                }}
              >
                {formatMoney(stat.value)}
              </Text>
            </View>
          ))}
        </Card>
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 22, gap: 18 }}>
        {/* Quick add */}
        <View>
          <SectionTitle
            action={
              <Pressable onPress={() => router.push("/categories")} hitSlop={6}>
                <Text style={{ fontFamily: Type.bodySemi, fontSize: 12, color: colors.primary }}>
                  All categories
                </Text>
              </Pressable>
            }
          >
            Quick add
          </SectionTitle>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 14, paddingVertical: 2 }}>
              {quickCategories.map((category) => (
                <Pressable
                  key={category.id}
                  onPress={() => {
                    patchDraft({ categoryId: category.id, kind: "expense" });
                    router.push("/add");
                  }}
                  style={{ alignItems: "center", width: 62, gap: 6 }}
                >
                  <CategoryTile icon={category.icon} color={category.color} size={52} />
                  <Text
                    numberOfLines={1}
                    style={{
                      fontFamily: Type.bodyMedium,
                      fontSize: 10.5,
                      color: colors.mutedForeground,
                    }}
                  >
                    {category.name}
                  </Text>
                </Pressable>
              ))}
              <Pressable
                onPress={() => router.push("/categories")}
                style={{ alignItems: "center", width: 62, gap: 6 }}
              >
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 18,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1.5,
                    borderStyle: "dashed",
                    borderColor: colors.border,
                  }}
                >
                  <Ionicons name="add" size={22} color={colors.mutedForeground} />
                </View>
                <Text
                  style={{
                    fontFamily: Type.bodyMedium,
                    fontSize: 10.5,
                    color: colors.mutedForeground,
                  }}
                >
                  More
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>

        {/* Daily rhythm */}
        <Card>
          <SectionTitle
            action={
              <Text style={{ fontFamily: Type.num, fontSize: 12, color: colors.mutedForeground }}>
                {formatMoney(data?.dailyAvg ?? 0)}/day
              </Text>
            }
          >
            Daily spend
          </SectionTitle>
          {data?.daily?.length ? (
            <DailyArea data={data.daily} width={width - 76} height={104} />
          ) : (
            <View style={{ height: 104 }} />
          )}
        </Card>

        {/* Category split */}
        <Card>
          <SectionTitle
            action={
              <Text style={{ fontFamily: Type.body, fontSize: 11.5, color: colors.mutedForeground }}>
                {data?.byCategory?.length ?? 0} categories
              </Text>
            }
          >
            Where it went
          </SectionTitle>
          {data?.byCategory?.length ? (
            <CategoryBars rows={data.byCategory.slice(0, 5)} />
          ) : (
            <Text
              style={{ fontFamily: Type.body, fontSize: 12.5, color: colors.mutedForeground }}
            >
              No spending recorded this month.
            </Text>
          )}
        </Card>

        {/* Recent */}
        <View>
          <SectionTitle
            action={
              <Pressable onPress={() => router.push("/transactions")} hitSlop={6}>
                <Text style={{ fontFamily: Type.bodySemi, fontSize: 12, color: colors.primary }}>
                  See all
                </Text>
              </Pressable>
            }
          >
            Recent activity
          </SectionTitle>
          <Card style={{ paddingVertical: 6 }}>
            <TransactionList
              rows={transactions.data ?? []}
              isLoading={transactions.isLoading}
              filters={filters}
              groupByDay={false}
              emptyLabel="Nothing logged this month yet"
            />
          </Card>
        </View>
      </View>
    </ScrollView>
  );
}
