import { useEffect, useMemo, useRef } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { Type } from "@/constants/theme";
import { useAppState } from "@/components/app-state";
import { CategoryTile } from "@/components/ui";
import { useCategories } from "@/queries/categories";
import {
  useCreateTransaction,
  useTransaction,
  useUpdateTransaction,
} from "@/queries/transactions";
import { formatMoney, parseAmountToCents } from "@/lib/format";
import { useCurrency } from "@/components/preferences";
import { noOutline } from "@/lib/style";

export default function AddScreen() {
  const colors = useColors();
  const currency = useCurrency();
  const insets = useSafeAreaInsets();
  const { draft, patchDraft, resetDraft } = useAppState();
  const categories = useCategories();
  const create = useCreateTransaction();
  const update = useUpdateTransaction();

  const params = useLocalSearchParams<{ id?: string }>();
  const editId = params.id ? Number(params.id) : null;
  const isEdit = typeof editId === "number" && Number.isFinite(editId);
  const existing = useTransaction(isEdit ? editId : null);

  // Load the row being edited into the draft once it arrives.
  const hydratedFor = useRef<number | null>(null);
  useEffect(() => {
    if (!isEdit || !existing.data) return;
    if (hydratedFor.current === editId) return;
    hydratedFor.current = editId;
    const row = existing.data;
    patchDraft({
      amount: (row.amount / 100).toFixed(2),
      kind: row.kind,
      categoryId: row.categoryId,
      merchant: row.merchant ?? "",
      note: row.note ?? "",
    });
  }, [isEdit, editId, existing.data, patchDraft]);

  const pool = useMemo(
    () => (categories.data ?? []).filter((category) => category.kind === draft.kind),
    [categories.data, draft.kind],
  );
  const selected = pool.find((category) => category.id === draft.categoryId) ?? null;
  const cents = parseAmountToCents(draft.amount);
  const valid = cents > 0 && !!selected;

  const pending = create.isPending || update.isPending;

  const submit = () => {
    if (!valid || !selected || pending) return;
    const payload = {
      amount: cents,
      kind: draft.kind,
      categoryId: selected.id,
      merchant: draft.merchant.trim(),
      note: draft.note.trim() || null,
    };
    const done = {
      onSuccess: () => {
        resetDraft();
        router.back();
      },
    };
    if (isEdit && editId) {
      update.mutate({ id: editId, ...payload }, done);
    } else {
      create.mutate(payload, done);
    }
  };

  const close = () => {
    resetDraft();
    router.back();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 14,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Pressable onPress={close} hitSlop={8}>
          <Ionicons name="close" size={22} color={colors.mutedForeground} />
        </Pressable>
        <Text style={{ fontFamily: Type.display, fontSize: 16, color: colors.foreground }}>
          {isEdit ? "Edit transaction" : "New transaction"}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 30, gap: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Kind switch */}
        <View
          style={{
            flexDirection: "row",
            borderRadius: 999,
            backgroundColor: colors.muted,
            padding: 4,
          }}
        >
          {(["expense", "income"] as const).map((option) => {
            const active = draft.kind === option;
            return (
              <Pressable
                key={option}
                onPress={() => patchDraft({ kind: option, categoryId: null })}
                style={{
                  flex: 1,
                  height: 38,
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: active
                    ? option === "income"
                      ? colors.success
                      : colors.primary
                    : "transparent",
                }}
              >
                <Text
                  style={{
                    fontFamily: Type.bodyBold,
                    fontSize: 13,
                    textTransform: "capitalize",
                    color: active ? "#FFFFFF" : colors.mutedForeground,
                  }}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Amount */}
        <View
          style={{
            alignItems: "center",
            gap: 2,
            paddingVertical: 20,
            borderRadius: 24,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text
            style={{
              fontFamily: Type.bodySemi,
              fontSize: 10.5,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: colors.mutedForeground,
            }}
          >
            Amount
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
            <Text
              style={{
                fontFamily: Type.display,
                fontSize: 24,
                color: colors.mutedForeground,
                marginRight: 4,
                marginTop: 6,
              }}
            >
              {currency.symbol}
            </Text>
            <TextInput
              value={draft.amount}
              onChangeText={(value) => patchDraft({ amount: value })}
              accessibilityLabel="Amount"
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.border}
              selectionColor={colors.primary}
              style={[
                {
                  fontFamily: Type.displayBold,
                  fontSize: 44,
                  lineHeight: 54,
                  letterSpacing: -1.5,
                  color: colors.foreground,
                  minWidth: 120,
                  maxWidth: 220,
                  textAlign: "center",
                  padding: 0,
                },
                noOutline,
              ]}
            />
          </View>
        </View>

        {/* Category */}
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text
              style={{ fontFamily: Type.bodySemi, fontSize: 11, color: colors.mutedForeground }}
            >
              Category
            </Text>
            <Pressable onPress={() => router.push("/categories")} hitSlop={6}>
              <Text style={{ fontFamily: Type.bodySemi, fontSize: 11.5, color: colors.primary }}>
                Browse all
              </Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 9 }}>
            {pool.map((category) => {
              const active = category.id === draft.categoryId;
              return (
                <Pressable
                  key={category.id}
                  onPress={() => patchDraft({ categoryId: category.id })}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 7,
                    paddingVertical: 7,
                    paddingHorizontal: 10,
                    borderRadius: 999,
                    borderWidth: 1.5,
                    borderColor: active ? colors.primary : colors.border,
                    backgroundColor: active ? colors.accent : colors.card,
                  }}
                >
                  <CategoryTile icon={category.icon} color={category.color} size={22} />
                  <Text
                    style={{
                      fontFamily: Type.bodySemi,
                      fontSize: 12,
                      color: active ? colors.accentForeground : colors.foreground,
                    }}
                  >
                    {category.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Merchant + note */}
        {[
          {
            label: "Merchant",
            value: draft.merchant,
            onChange: (value: string) => patchDraft({ merchant: value }),
            placeholder: "Where did it go?",
          },
          {
            label: "Note",
            value: draft.note,
            onChange: (value: string) => patchDraft({ note: value }),
            placeholder: "Optional detail",
          },
        ].map((field) => (
          <View key={field.label} style={{ gap: 6 }}>
            <Text
              style={{ fontFamily: Type.bodySemi, fontSize: 11, color: colors.mutedForeground }}
            >
              {field.label}
            </Text>
            <TextInput
              value={field.value}
              onChangeText={field.onChange}
              accessibilityLabel={field.label}
              placeholder={field.placeholder}
              placeholderTextColor={colors.mutedForeground}
              style={[
                {
                  height: 46,
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  fontFamily: Type.bodyMedium,
                  fontSize: 14,
                  color: colors.foreground,
                },
                noOutline,
              ]}
            />
          </View>
        ))}
      </ScrollView>

      <View
        style={{
          padding: 20,
          paddingBottom: Math.max(insets.bottom, 16),
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.card,
        }}
      >
        <Pressable
          onPress={submit}
          disabled={!valid || pending}
          style={{
            height: 52,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: valid ? colors.primary : colors.muted,
          }}
        >
          <Text
            style={{
              fontFamily: Type.bodyBold,
              fontSize: 15,
              color: valid ? "#FFFFFF" : colors.mutedForeground,
            }}
          >
            {pending
              ? "Saving…"
              : cents > 0
                ? isEdit
                  ? `Save ${formatMoney(cents)}`
                  : `Add ${formatMoney(cents)}`
                : "Enter an amount"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
