// System-managed layout — extend in place, never rewrite from scratch.
// Keep the provider chain intact: ErrorBoundary → OneDollarStats → SafeArea → QueryClient.
// To switch navigation, replace only the <Slot /> line with <Stack /> or <Tabs />.
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Sora_600SemiBold, Sora_700Bold } from "@expo-google-fonts/sora";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { ErrorBoundary } from "../components/__ErrorBoundary";
import { OneDollarStatsProvider } from "../lib/__analytics";
import { isWeb, startWebSafeArea } from "../lib/__web-safe-area";
import { AppStateProvider } from "../components/app-state";
import { PreferencesProvider } from "../components/preferences";
import { useColors, useScheme } from "../hooks/use-colors";
import { SignInScreen } from "../components/sign-in-screen";
import { authClient } from "../lib/auth";
import appJson from "../app.json";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
});

const applicationId = appJson.expo.extra.applicationId ?? "";
const hostname = applicationId ? `${applicationId}-mobile` : "localhost";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Sora_600SemiBold,
    Sora_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  const { data: session, isPending: sessionPending } = authClient.useSession();

  useEffect(() => {
    if (isWeb) startWebSafeArea();
  }, []);

  // Completes a returning Expo Web sign-in redirect; a no-op on native.
  useEffect(() => {
    void authClient.managedAuth.handleRedirect();
  }, []);

  const ready = fontsLoaded && !sessionPending;

  return (
    <ErrorBoundary>
      {/* Runable analytics provider — do not remove, required for analytics tracking */}
      <OneDollarStatsProvider
        config={{
          hostname,
          collectorUrl: "https://r.lilstts.com/events",
          devmode: true,
        }}
      >
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <AppStateProvider>
              <PreferencesProvider>
                {ready && session ? (
                  <ThemedStack />
                ) : ready ? (
                  <>
                    <StatusBar style="light" />
                    <SignInScreen />
                  </>
                ) : (
                  <View
                    style={{
                      flex: 1,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#5B21B6",
                    }}
                  >
                    <StatusBar style="light" />
                    <ActivityIndicator color="#FFFFFF" />
                  </View>
                )}
              </PreferencesProvider>
            </AppStateProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </OneDollarStatsProvider>
    </ErrorBoundary>
  );
}

/** Navigation stack, painted in the user's chosen light/dark palette. */
function ThemedStack() {
  const colors = useColors();
  const scheme = useScheme();

  return (
    <>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add" options={{ presentation: "modal" }} />
        <Stack.Screen name="categories" options={{ presentation: "modal" }} />
        <Stack.Screen name="auth/callback" />
      </Stack>
    </>
  );
}
