import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { Type } from "@/constants/theme";
import { useAppState } from "@/components/app-state";
import { CategoryTile } from "@/components/ui";
import { useCategories, useCreateCategory } from "@/queries/categories";
import {
  COLOR_CHOICES,
  ICON_CHOICES,
  categoryColor,
  categoryIcon,
  categoryTint,
} from "@/lib/categories";
import { noOutline } from "@/lib/style";

export default function CategoriesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { draft, patchDraft } = useAppState();
  const categories = useCategories();
  const createCategory = useCreateCategory();

  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(ICON_CHOICES[0]);
  const [color, setColor] = useState(COLOR_CHOICES[0]);
  const [kind, setKind] = useState<"expense" | "income">("expense");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = categories.data ?? [];
    return term ? list.filter((item) => item.name.toLowerCase().includes(term)) : list;
  }, [categories.data, search]);

  const expenses = filtered.filter((item) => item.kind === "expense");
  const income = filtered.filter((item) => item.kind === "income");

  const pick = (id: number, itemKind: "expense" | "income") => {
    patchDraft({ categoryId: id, kind: itemKind });
    router.back();
  };

  const groups = [
    { title: "Expenses", items: expenses },
    { title: "Income", items: income },
  ].filter((group) => group.items.length > 0);

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
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="close" size={22} color={colors.mutedForeground} />
          </Pressable>
          <Text style={{ fontFamily: Type.display, fontSize: 16, color: colors.foreground }}>
            Select Category
          </Text>
          <Pressable onPress={() => setCreating((value) => !value)} hitSlop={8}>
            <Ionicons
              name={creating ? "remove-circle-outline" : "add-circle-outline"}
              size={22}
              color={colors.primary}
            />
          </Pressable>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            backgroundColor: colors.muted,
            borderRadius: 14,
            paddingHorizontal: 12,
            height: 44,
          }}
        >
          <Ionicons name="search" size={17} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search categories"
            placeholderTextColor={colors.mutedForeground}
            style={[
              {
                flex: 1,
                fontFamily: Type.body,
                fontSize: 14,
                color: colors.foreground,
              },
              noOutline,
            ]}
          />
          {!!search && (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Ionicons name="close-circle" size={17} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 22 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {creating && (
          <View
            style={{
              gap: 14,
              padding: 16,
              borderRadius: 22,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontFamily: Type.display, fontSize: 14, color: colors.foreground }}>
              New category
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Category name"
              placeholderTextColor={colors.mutedForeground}
              style={[
                {
                  height: 44,
                  borderRadius: 14,
                  paddingHorizontal: 13,
                  backgroundColor: colors.muted,
                  fontFamily: Type.bodyMedium,
                  fontSize: 14,
                  color: colors.foreground,
                },
                noOutline,
              ]}
            />

            <View
              style={{
                flexDirection: "row",
                borderRadius: 999,
                backgroundColor: colors.muted,
                padding: 3,
              }}
            >
              {(["expense", "income"] as const).map((option) => {
                const active = kind === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setKind(option)}
                    style={{
                      flex: 1,
                      height: 32,
                      borderRadius: 999,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: active ? colors.card : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: Type.bodySemi,
                        fontSize: 12,
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

            {/* Icon picker */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 9 }}
            >
              {ICON_CHOICES.map((key) => {
                const active = icon === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => setIcon(key)}
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 14,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1.5,
                      borderColor: active ? categoryColor(color) : colors.border,
                      backgroundColor: active ? categoryTint(color) : "transparent",
                    }}
                  >
                    <MaterialCommunityIcons
                      name={categoryIcon(key)}
                      size={19}
                      color={active ? categoryColor(color) : colors.mutedForeground}
                    />
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Color picker */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 9 }}>
              {COLOR_CHOICES.map((key) => {
                const active = color === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => setColor(key)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 999,
                      backgroundColor: categoryColor(key),
                      borderWidth: active ? 3 : 0,
                      borderColor: colors.card,
                      shadowColor: categoryColor(key),
                      shadowOpacity: active ? 0.6 : 0,
                      shadowRadius: 6,
                      shadowOffset: { width: 0, height: 2 },
                    }}
                  />
                );
              })}
            </View>

            <Pressable
              disabled={!name.trim() || createCategory.isPending}
              onPress={() =>
                createCategory.mutate(
                  { name: name.trim(), icon, color, kind },
                  {
                    onSuccess: () => {
                      setName("");
                      setCreating(false);
                    },
                  },
                )
              }
              style={{
                height: 46,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: name.trim() ? colors.primary : colors.muted,
              }}
            >
              <Text
                style={{
                  fontFamily: Type.bodyBold,
                  fontSize: 14,
                  color: name.trim() ? "#FFFFFF" : colors.mutedForeground,
                }}
              >
                {createCategory.isPending ? "Creating…" : "Create category"}
              </Text>
            </Pressable>
          </View>
        )}

        {groups.map((group) => (
          <View key={group.title} style={{ gap: 14 }}>
            <Text
              style={{
                fontFamily: Type.bodySemi,
                fontSize: 10.5,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: colors.mutedForeground,
              }}
            >
              {group.title}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {group.items.map((item) => {
                const active = draft.categoryId === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => pick(item.id, item.kind)}
                    style={{
                      width: "25%",
                      alignItems: "center",
                      gap: 7,
                      paddingVertical: 10,
                    }}
                  >
                    <View
                      style={{
                        padding: 3,
                        borderRadius: 22,
                        borderWidth: 2,
                        borderColor: active ? categoryColor(item.color) : "transparent",
                      }}
                    >
                      <CategoryTile icon={item.icon} color={item.color} size={52} />
                    </View>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontFamily: Type.bodyMedium,
                        fontSize: 10.5,
                        textAlign: "center",
                        color: active ? colors.foreground : colors.mutedForeground,
                      }}
                    >
                      {item.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        {!groups.length && (
          <View
            style={{
              paddingVertical: 40,
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
              No categories match "{search}"
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
