import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/hooks/use-colors";
import { HeroGradient, Type } from "@/constants/theme";
import { authClient } from "@/lib/auth";
import { useAppState } from "@/components/app-state";
import { Card, CategoryTile, SectionTitle } from "@/components/ui";
import { useOverview, useSettings, useUpdateSettings } from "@/queries/analytics";
import { useCategories, useDeleteCategory } from "@/queries/categories";
import { formatMoney, parseAmountToCents } from "@/lib/format";
import { CURRENCIES } from "@/lib/currency";
import { type ThemeMode, usePreferences } from "@/components/preferences";
import { noOutline } from "@/lib/style";

const THEME_MODES: { value: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: "light", label: "Light", icon: "sunny-outline" },
  { value: "dark", label: "Dark", icon: "moon-outline" },
  { value: "system", label: "System", icon: "phone-portrait-outline" },
];

export default function AccountScreen() {
  const colors = useColors();
  const prefs = usePreferences();
  const insets = useSafeAreaInsets();
  const { month } = useAppState();
  const settings = useSettings();
  const updateSettings = useUpdateSettings();
  const overview = useOverview(month);
  const categories = useCategories();
  const deleteCategory = useDeleteCategory();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const accountName = session?.user?.name ?? "";
  const accountEmail = session?.user?.email ?? "";

  const signOut = () => {
    Alert.alert("Sign out?", "You can sign back in with Google any time.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await authClient.signOut();
          queryClient.clear();
        },
      },
    ]);
  };

  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");

  useEffect(() => {
    if (!settings.data) return;
    setName(settings.data.ownerName ?? "");
    setBudget(settings.data.monthlyBudget ? (settings.data.monthlyBudget / 100).toFixed(0) : "");
  }, [settings.data]);

  const dirty =
    !!settings.data &&
    (name !== (settings.data.ownerName ?? "") ||
      parseAmountToCents(budget) !== (settings.data.monthlyBudget ?? 0));

  const confirmDelete = (id: number, label: string) => {
    Alert.alert(
      `Delete "${label}"?`,
      "Every transaction in this category is deleted too.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteCategory.mutate({ id }),
        },
      ],
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={[...HeroGradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: insets.top + 18,
          paddingHorizontal: 20,
          paddingBottom: 54,
          borderBottomLeftRadius: 34,
          borderBottomRightRadius: 34,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <View
            style={{
              width: 58,
              height: 58,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255,255,255,0.2)",
            }}
          >
            <Text style={{ fontFamily: Type.displayBold, fontSize: 22, color: "#FFFFFF" }}>
              {(settings.data?.ownerName || accountName || "S").slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: Type.display, fontSize: 20, color: "#FFFFFF" }}>
              {settings.data?.ownerName || accountName || "SpendWise"}
            </Text>
            <Text
              numberOfLines={1}
              style={{ fontFamily: Type.body, fontSize: 12, color: "rgba(255,255,255,0.75)" }}
            >
              {accountEmail ||
                `${settings.data?.currency ?? "USD"} · ${formatMoney(settings.data?.monthlyBudget ?? 0)} monthly budget`}
            </Text>
          </View>
          <Pressable
            onPress={signOut}
            hitSlop={8}
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255,255,255,0.18)",
            }}
          >
            <Ionicons name="log-out-outline" size={19} color="#FFFFFF" />
          </Pressable>
        </View>
      </LinearGradient>

      <View style={{ paddingHorizontal: 20, marginTop: -34, gap: 18 }}>
        <Card style={{ flexDirection: "row", paddingVertical: 16 }}>
          {[
            { label: "This month", value: formatMoney(overview.data?.spent ?? 0) },
            { label: "Entries", value: String(overview.data?.transactionCount ?? 0) },
            { label: "Categories", value: String(categories.data?.length ?? 0) },
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
                  color: colors.foreground,
                  marginTop: 4,
                }}
              >
                {stat.value}
              </Text>
            </View>
          ))}
        </Card>

        {/* Settings */}
        <Card>
          <SectionTitle>Preferences</SectionTitle>
          <View style={{ gap: 14 }}>
            <View style={{ gap: 6 }}>
              <Text
                style={{
                  fontFamily: Type.bodySemi,
                  fontSize: 11,
                  color: colors.mutedForeground,
                }}
              >
                Display name
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name"
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
            </View>
            <View style={{ gap: 6 }}>
              <Text
                style={{
                  fontFamily: Type.bodySemi,
                  fontSize: 11,
                  color: colors.mutedForeground,
                }}
              >
                Monthly budget
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  height: 44,
                  borderRadius: 14,
                  paddingLeft: 13,
                  backgroundColor: colors.muted,
                }}
              >
                <Text
                  style={{
                    fontFamily: Type.num,
                    fontSize: 15,
                    color: colors.mutedForeground,
                  }}
                >
                  {prefs.currency.symbol}
                </Text>
                <TextInput
                  value={budget}
                  onChangeText={setBudget}
                  keyboardType="decimal-pad"
                  placeholder="3200"
                  placeholderTextColor={colors.mutedForeground}
                  style={[
                    {
                      flex: 1,
                      height: 44,
                      paddingLeft: 7,
                      paddingRight: 13,
                      fontFamily: Type.num,
                      fontSize: 15,
                      color: colors.foreground,
                    },
                    noOutline,
                  ]}
                />
              </View>
            </View>
            <Pressable
              disabled={!dirty || updateSettings.isPending}
              onPress={() =>
                updateSettings.mutate({
                  ownerName: name.trim() || accountName || "SpendWise",
                  monthlyBudget: parseAmountToCents(budget),
                })
              }
              style={{
                height: 46,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: dirty ? colors.primary : colors.muted,
              }}
            >
              <Text
                style={{
                  fontFamily: Type.bodyBold,
                  fontSize: 14,
                  color: dirty ? "#FFFFFF" : colors.mutedForeground,
                }}
              >
                {updateSettings.isPending ? "Saving…" : dirty ? "Save changes" : "Saved"}
              </Text>
            </Pressable>

            <View style={{ gap: 8 }}>
              <Text
                style={{ fontFamily: Type.bodySemi, fontSize: 11, color: colors.mutedForeground }}
              >
                Currency
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {CURRENCIES.map((entry) => {
                  const active = entry.code === prefs.currency.code;
                  return (
                    <Pressable
                      key={entry.code}
                      onPress={() => prefs.setCurrency(entry.code)}
                      style={{
                        height: 36,
                        paddingHorizontal: 12,
                        borderRadius: 12,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 5,
                        backgroundColor: active ? colors.primary : colors.muted,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: Type.num,
                          fontSize: 13,
                          color: active ? "#FFFFFF" : colors.foreground,
                        }}
                      >
                        {entry.symbol}
                      </Text>
                      <Text
                        style={{
                          fontFamily: Type.bodySemi,
                          fontSize: 11,
                          color: active ? "rgba(255,255,255,0.85)" : colors.mutedForeground,
                        }}
                      >
                        {entry.code}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text
                style={{ fontFamily: Type.body, fontSize: 11, color: colors.mutedForeground }}
              >
                Amounts show as {formatMoney(123456, { currency: prefs.currency.code })} across the
                app.
              </Text>
            </View>

            <View style={{ gap: 8 }}>
              <Text
                style={{ fontFamily: Type.bodySemi, fontSize: 11, color: colors.mutedForeground }}
              >
                Appearance
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  gap: 6,
                  padding: 4,
                  borderRadius: 16,
                  backgroundColor: colors.muted,
                }}
              >
                {THEME_MODES.map((mode) => {
                  const active = mode.value === prefs.themeMode;
                  return (
                    <Pressable
                      key={mode.value}
                      onPress={() => prefs.setThemeMode(mode.value)}
                      style={{
                        flex: 1,
                        height: 40,
                        borderRadius: 13,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        backgroundColor: active ? colors.card : "transparent",
                      }}
                    >
                      <Ionicons
                        name={mode.icon}
                        size={15}
                        color={active ? colors.primary : colors.mutedForeground}
                      />
                      <Text
                        style={{
                          fontFamily: Type.bodySemi,
                          fontSize: 12,
                          color: active ? colors.foreground : colors.mutedForeground,
                        }}
                      >
                        {mode.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </Card>

        {/* Categories */}
        <Card>
          <SectionTitle
            action={
              <Pressable onPress={() => router.push("/categories")} hitSlop={6}>
                <Text style={{ fontFamily: Type.bodySemi, fontSize: 12, color: colors.primary }}>
                  Manage
                </Text>
              </Pressable>
            }
          >
            Categories
          </SectionTitle>
          <View style={{ gap: 2 }}>
            {(categories.data ?? []).map((category) => (
              <View
                key={category.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  paddingVertical: 8,
                }}
              >
                <CategoryTile icon={category.icon} color={category.color} size={36} />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: Type.bodySemi,
                      fontSize: 13,
                      color: colors.foreground,
                    }}
                  >
                    {category.name}
                  </Text>
                  <Text
                    style={{
                      fontFamily: Type.body,
                      fontSize: 11,
                      color: colors.mutedForeground,
                      textTransform: "capitalize",
                    }}
                  >
                    {category.kind}
                    {category.monthlyBudget
                      ? ` · ${formatMoney(category.monthlyBudget)} budget`
                      : ""}
                  </Text>
                </View>
                <Pressable
                  onPress={() => confirmDelete(category.id, category.name)}
                  hitSlop={8}
                  style={{ padding: 4 }}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.mutedForeground} />
                </Pressable>
              </View>
            ))}
          </View>
        </Card>

        <Text
          style={{
            fontFamily: Type.body,
            fontSize: 11,
            color: colors.mutedForeground,
            textAlign: "center",
          }}
        >
          SpendWise · signed in{accountEmail ? ` as ${accountEmail}` : ""} · your data is private to
          your account
        </Text>
      </View>
    </ScrollView>
  );
}
