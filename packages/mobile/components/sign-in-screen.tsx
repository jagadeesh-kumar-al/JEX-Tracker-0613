import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { HeroGradient, Type } from "@/constants/theme";
import { authClient } from "@/lib/auth";

const RETURNING_KEY = "spendwise_returning";

function readReturning(): boolean {
  try {
    return SecureStore.getItem(RETURNING_KEY) === "1";
  } catch {
    try {
      return globalThis.localStorage?.getItem(RETURNING_KEY) === "1";
    } catch {
      return false;
    }
  }
}

function markReturning() {
  try {
    SecureStore.setItem(RETURNING_KEY, "1");
  } catch {
    try {
      globalThis.localStorage?.setItem(RETURNING_KEY, "1");
    } catch {
      /* ignore */
    }
  }
}

type Mode = "signup" | "signin";

export function SignInScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>("signup");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (readReturning()) setMode("signin");
  }, []);

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await authClient.managedAuth.signIn({ provider: "google" });
      if (result?.error && result.error.code !== "AUTH_SESSION_DISMISSED") {
        setError(result.error.message ?? "Sign in failed. Try again.");
      } else if (!result?.error) {
        markReturning();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign in failed. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <LinearGradient
      colors={[...HeroGradient]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 28 }}
    >
      <View style={{ flex: 1, paddingHorizontal: 26, justifyContent: "space-between" }}>
        <View style={{ gap: 18 }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255,255,255,0.18)",
            }}
          >
            <Ionicons name="wallet-outline" size={26} color="#FFFFFF" />
          </View>
          <Text style={{ fontFamily: Type.displayBold, fontSize: 38, color: "#FFFFFF", lineHeight: 42 }}>
            SpendWise
          </Text>
          <Text
            style={{
              fontFamily: Type.body,
              fontSize: 15,
              lineHeight: 23,
              color: "rgba(255,255,255,0.82)",
              maxWidth: 320,
            }}
          >
            Track every expense, watch your budgets, and see where the month went. Your data stays
            private to your account.
          </Text>

          <View style={{ gap: 12, marginTop: 10 }}>
            {(
              [
                { icon: "flash-outline", label: "Log spending in seconds" },
                { icon: "pie-chart-outline", label: "See where the money went" },
                { icon: "lock-closed-outline", label: "Only you can see your data" },
              ] as const
            ).map((row) => (
              <View key={row.label} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(255,255,255,0.16)",
                  }}
                >
                  <Ionicons name={row.icon} size={16} color="#FFFFFF" />
                </View>
                <Text
                  style={{ fontFamily: Type.bodyMedium, fontSize: 14, color: "rgba(255,255,255,0.9)" }}
                >
                  {row.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ gap: 16 }}>
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "rgba(255,255,255,0.16)",
              borderRadius: 16,
              padding: 4,
            }}
          >
            {(
              [
                { key: "signup", label: "Sign up" },
                { key: "signin", label: "Sign in" },
              ] as const
            ).map((tab) => {
              const active = mode === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => setMode(tab.key)}
                  style={{
                    flex: 1,
                    height: 40,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: active ? "#FFFFFF" : "transparent",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: Type.bodyBold,
                      fontSize: 13,
                      color: active ? "#5B21B6" : "rgba(255,255,255,0.85)",
                    }}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text
            style={{
              fontFamily: Type.body,
              fontSize: 13,
              color: "rgba(255,255,255,0.78)",
              textAlign: "center",
            }}
          >
            {mode === "signup"
              ? "New here? Create your account with Google — takes a second."
              : "Welcome back. Continue with the Google account you used before."}
          </Text>

          <Pressable
            onPress={start}
            disabled={busy}
            style={{
              height: 54,
              borderRadius: 18,
              backgroundColor: "#FFFFFF",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? (
              <ActivityIndicator color="#5B21B6" />
            ) : (
              <Ionicons name="logo-google" size={19} color="#1A162B" />
            )}
            <Text style={{ fontFamily: Type.bodyBold, fontSize: 15, color: "#1A162B" }}>
              {busy
                ? "Opening Google…"
                : mode === "signup"
                  ? "Sign up with Google"
                  : "Sign in with Google"}
            </Text>
          </Pressable>

          {error ? (
            <Text
              style={{
                fontFamily: Type.bodyMedium,
                fontSize: 12.5,
                color: "#FFD9E3",
                textAlign: "center",
              }}
            >
              {error}
            </Text>
          ) : null}

          <Text
            style={{
              fontFamily: Type.body,
              fontSize: 11.5,
              color: "rgba(255,255,255,0.6)",
              textAlign: "center",
              lineHeight: 17,
            }}
          >
            Only your own transactions, categories and budgets are ever visible to you.
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}
