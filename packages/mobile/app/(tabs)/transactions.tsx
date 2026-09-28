import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { Type } from "@/constants/theme";
import { useAppState } from "@/components/app-state";
import { Card, MonthSwitcher, TransactionList } from "@/components/ui";
import { useCategories } from "@/queries/categories";
import { useTransactions } from "@/queries/transactions";
import { formatMoney } from "@/lib/format";
import { useCurrency } from "@/components/preferences";
import { noOutline } from "@/lib/style";

type Kind = "all" | "expense" | "income";

export default function TransactionsScreen() {
  const colors = useColors();
  useCurrency();
  const insets = useSafeAreaInsets();
  const { month } = useAppState();
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<Kind>("all");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [allTime, setAllTime] = useState(false);
  const categories = useCategories();

  const filters = useMemo(
    () => ({
      month: allTime ? undefined : month,
      kind: kind === "all" ? undefined : kind,
      categoryId: categoryId ?? undefined,
      search: search.trim() || undefined,
      limit: 200,
    }),
    [allTime, month, kind, categoryId, search],
  );
  const transactions = useTransactions(filters);
  const rows = transactions.data ?? [];

  const spent = rows
    .filter((row) => row.kind === "expense")
    .reduce((sum, row) => sum + row.amount, 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 12,
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <View>
            <Text style={{ fontFamily: Type.display, fontSize: 21, color: colors.foreground }}>
              Activity
            </Text>
            <Text
              style={{ fontFamily: Type.body, fontSize: 12, color: colors.mutedForeground }}
            >
              {rows.length} entries · {formatMoney(spent)} spent
            </Text>
          </View>
          {allTime ? <View /> : <MonthSwitcher />}
        </View>

        {/* Search */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            backgroundColor: colors.muted,
            borderRadius: 14,
            paddingHorizontal: 12,
            height: 42,
          }}
        >
          <Ionicons name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search merchant, note, category"
            placeholderTextColor={colors.mutedForeground}
            style={[
              {
                flex: 1,
                fontFamily: Type.body,
                fontSize: 13.5,
                color: colors.foreground,
              },
              noOutline,
            ]}
          />
          {!!search && (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>

        {/* Kind + range toggles */}
        <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
          {(["all", "expense", "income"] as Kind[]).map((option) => {
            const active = kind === option;
            return (
              <Pressable
                key={option}
                onPress={() => setKind(option)}
                style={{
                  paddingHorizontal: 13,
                  paddingVertical: 7,
                  borderRadius: 999,
                  backgroundColor: active ? colors.primary : colors.muted,
                }}
              >
                <Text
                  style={{
                    fontFamily: Type.bodySemi,
                    fontSize: 11.5,
                    textTransform: "capitalize",
                    color: active ? "#FFFFFF" : colors.mutedForeground,
                  }}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => setAllTime((value) => !value)}
            style={{
              marginLeft: "auto",
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              paddingHorizontal: 13,
              paddingVertical: 7,
              borderRadius: 999,
              backgroundColor: allTime ? colors.accent : colors.muted,
            }}
          >
            <Ionicons
              name="infinite"
              size={13}
              color={allTime ? colors.accentForeground : colors.mutedForeground}
            />
            <Text
              style={{
                fontFamily: Type.bodySemi,
                fontSize: 11.5,
                color: allTime ? colors.accentForeground : colors.mutedForeground,
              }}
            >
              All time
            </Text>
          </Pressable>
        </View>

        {/* Category chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 10, marginHorizontal: -20 }}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        >
          <Pressable
            onPress={() => setCategoryId(null)}
            style={{
              paddingHorizontal: 13,
              paddingVertical: 7,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: categoryId === null ? colors.primary : colors.border,
              backgroundColor: categoryId === null ? colors.accent : "transparent",
            }}
          >
            <Text
              style={{
                fontFamily: Type.bodySemi,
                fontSize: 11.5,
                color: categoryId === null ? colors.accentForeground : colors.mutedForeground,
              }}
            >
              Everything
            </Text>
          </Pressable>
          {(categories.data ?? []).map((category) => {
            const active = categoryId === category.id;
            return (
              <Pressable
                key={category.id}
                onPress={() => setCategoryId(active ? null : category.id)}
                style={{
                  paddingHorizontal: 13,
                  paddingVertical: 7,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? colors.accent : "transparent",
                }}
              >
                <Text
                  style={{
                    fontFamily: Type.bodySemi,
                    fontSize: 11.5,
                    color: active ? colors.accentForeground : colors.mutedForeground,
                  }}
                >
                  {category.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Card style={{ paddingVertical: 8 }}>
          <TransactionList
            rows={rows}
            isLoading={transactions.isLoading}
            filters={filters}
            emptyLabel="No transactions match these filters"
          />
        </Card>
        <Text
          style={{
            fontFamily: Type.body,
            fontSize: 11,
            color: colors.mutedForeground,
            textAlign: "center",
            marginTop: 14,
          }}
        >
          Tap an entry to edit it · long-press to delete
        </Text>
      </ScrollView>

      <Pressable
        onPress={() => router.push("/add")}
        style={{
          position: "absolute",
          right: 20,
          bottom: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.primary,
          shadowColor: "#5B21B6",
          shadowOpacity: 0.4,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 8 },
          elevation: 6,
        }}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}
