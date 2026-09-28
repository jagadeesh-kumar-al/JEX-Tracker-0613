import { Alert, Platform, Pressable, Text, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { Type } from "@/constants/theme";
import { useAppState } from "@/components/app-state";
import { categoryColor, categoryIcon, categoryTint } from "@/lib/categories";
import { formatDay, formatMoney, monthTitle } from "@/lib/format";
import { useCurrency } from "@/components/preferences";
import { useDeleteTransaction, type TransactionFilters } from "@/queries/transactions";

export type TransactionRow = {
  id: number;
  amount: number;
  kind: "expense" | "income";
  categoryId: number;
  merchant: string;
  note: string | null;
  occurredAt: string | Date;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
};

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: 24,
          padding: 18,
          shadowColor: "#2B145C",
          shadowOpacity: 0.09,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function SectionTitle({ children, action }: { children: string; action?: React.ReactNode }) {
  const colors = useColors();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
      }}
    >
      <Text style={{ fontFamily: Type.display, fontSize: 16, color: colors.foreground }}>
        {children}
      </Text>
      {action}
    </View>
  );
}

export function MonthSwitcher({ tone = "light" }: { tone?: "light" | "dark" }) {
  const colors = useColors();
  const { month, stepMonth, isCurrentMonth } = useAppState();
  const onDark = tone === "dark";
  const fg = onDark ? "#FFFFFF" : colors.foreground;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
        borderRadius: 999,
        padding: 4,
        backgroundColor: onDark ? "rgba(255,255,255,0.18)" : colors.muted,
      }}
    >
      <Pressable
        onPress={() => stepMonth(-1)}
        hitSlop={6}
        style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center" }}
      >
        <Ionicons name="chevron-back" size={16} color={fg} />
      </Pressable>
      <Text
        style={{
          fontFamily: Type.bodySemi,
          fontSize: 12,
          color: fg,
          minWidth: 96,
          textAlign: "center",
        }}
      >
        {monthTitle(month)}
      </Text>
      <Pressable
        onPress={() => stepMonth(1)}
        disabled={isCurrentMonth}
        hitSlop={6}
        style={{
          width: 28,
          height: 28,
          alignItems: "center",
          justifyContent: "center",
          opacity: isCurrentMonth ? 0.35 : 1,
        }}
      >
        <Ionicons name="chevron-forward" size={16} color={fg} />
      </Pressable>
    </View>
  );
}

export function CategoryTile({
  icon,
  color,
  size = 40,
}: {
  icon: string;
  color: string;
  size?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 3,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: categoryTint(color),
      }}
    >
      <MaterialCommunityIcons
        name={categoryIcon(icon)}
        size={size * 0.5}
        color={categoryColor(color)}
      />
    </View>
  );
}

export function TransactionItem({
  row,
  onEdit,
  onDelete,
}: {
  row: TransactionRow;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const colors = useColors();
  useCurrency();
  const income = row.kind === "income";
  const title = row.merchant || row.categoryName;

  const askDelete = () => {
    if (!onDelete) return;
    if (Platform.OS === "web") {
      // Alert on RN-web has no buttons, so confirm through the browser.
      if (globalThis.confirm?.(`Delete ${title}?`)) onDelete();
      return;
    }
    Alert.alert("Delete transaction", `Remove ${title}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: onDelete },
    ]);
  };

  return (
    <Pressable
      onPress={onEdit}
      onLongPress={askDelete}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 10,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <CategoryTile icon={row.categoryIcon} color={row.categoryColor} />
      <View style={{ flex: 1 }}>
        <Text
          style={{ fontFamily: Type.bodySemi, fontSize: 14, color: colors.foreground }}
          numberOfLines={1}
        >
          {row.merchant || row.categoryName}
        </Text>
        <Text
          style={{ fontFamily: Type.body, fontSize: 11.5, color: colors.mutedForeground }}
          numberOfLines={1}
        >
          {row.note ? `${row.categoryName} · ${row.note}` : row.categoryName}
        </Text>
      </View>
      <Text
        style={{
          fontFamily: Type.num,
          fontSize: 14,
          color: income ? colors.success : colors.foreground,
        }}
      >
        {income ? "+" : "−"}
        {formatMoney(row.amount)}
      </Text>
      {onDelete && (
        <Pressable
          onPress={askDelete}
          hitSlop={10}
          style={{ paddingLeft: 4 }}
          accessibilityLabel={`Delete ${title}`}
        >
          <Ionicons name="trash-outline" size={15} color={colors.mutedForeground} />
        </Pressable>
      )}
    </Pressable>
  );
}

/** Day-grouped transaction list. */
export function TransactionList({
  rows,
  isLoading,
  filters,
  emptyLabel = "No transactions yet",
  groupByDay = true,
}: {
  rows: TransactionRow[];
  isLoading?: boolean;
  filters?: TransactionFilters;
  emptyLabel?: string;
  groupByDay?: boolean;
}) {
  const colors = useColors();
  useCurrency();
  const deleteTransaction = useDeleteTransaction(filters);

  if (isLoading) {
    return (
      <View style={{ gap: 10 }}>
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={{ height: 56, borderRadius: 18, backgroundColor: colors.muted }}
          />
        ))}
      </View>
    );
  }

  if (!rows.length) {
    return (
      <View
        style={{
          paddingVertical: 34,
          alignItems: "center",
          borderRadius: 20,
          borderWidth: 1,
          borderStyle: "dashed",
          borderColor: colors.border,
        }}
      >
        <Text
          style={{ fontFamily: Type.bodyMedium, fontSize: 13, color: colors.mutedForeground }}
        >
          {emptyLabel}
        </Text>
      </View>
    );
  }

  if (!groupByDay) {
    return (
      <View>
        {rows.map((row) => (
          <TransactionItem
            key={row.id}
            row={row}
            onEdit={() => router.push(`/add?id=${row.id}`)}
            onDelete={() => deleteTransaction.mutate({ id: row.id })}
          />
        ))}
      </View>
    );
  }

  const groups: { key: string; label: string; total: number; rows: TransactionRow[] }[] = [];
  for (const row of rows) {
    const date = new Date(row.occurredAt);
    const key = date.toDateString();
    let group = groups.find((entry) => entry.key === key);
    if (!group) {
      group = { key, label: formatDay(date), total: 0, rows: [] };
      groups.push(group);
    }
    group.rows.push(row);
    group.total += row.kind === "expense" ? row.amount : 0;
  }

  return (
    <View style={{ gap: 6 }}>
      {groups.map((group) => (
        <View key={group.key}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingTop: 10,
              paddingBottom: 2,
            }}
          >
            <Text
              style={{
                fontFamily: Type.bodySemi,
                fontSize: 10.5,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                color: colors.mutedForeground,
              }}
            >
              {group.label}
            </Text>
            <Text style={{ fontFamily: Type.num, fontSize: 11, color: colors.mutedForeground }}>
              {formatMoney(group.total)}
            </Text>
          </View>
          {group.rows.map((row) => (
            <TransactionItem
              key={row.id}
              row={row}
              onEdit={() => router.push(`/add?id=${row.id}`)}
              onDelete={() => deleteTransaction.mutate({ id: row.id })}
            />
          ))}
        </View>
      ))}
    </View>
  );
}
