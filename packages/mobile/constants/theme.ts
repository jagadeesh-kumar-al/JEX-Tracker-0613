import { Platform } from "react-native";

/**
 * App color tokens. Recolor these to brand the app — every screen and component
 * reads from here via `useColors()` (see `hooks/use-colors.ts`), so changing a
 * value here updates the whole app in both light and dark mode.
 *
 * The token names mirror the web app's design tokens (`packages/web/src/web/styles.css`)
 * so the two platforms share one vocabulary: `background`, `foreground`, `card`,
 * `primary`, `muted`, `border`, etc. Values are plain hex/rgba strings — React
 * Native's StyleSheet does not support CSS color functions like `oklch()`.
 */
export const Colors = {
  light: {
    background: "#F4F2FA",
    foreground: "#1A162B",
    card: "#FFFFFF",
    cardForeground: "#1A162B",
    primary: "#7C3AED",
    primaryForeground: "#FFFFFF",
    primaryDeep: "#5B21B6",
    secondary: "#EFECF9",
    secondaryForeground: "#3B2F66",
    muted: "#F1EEFA",
    mutedForeground: "#6E6A85",
    accent: "#EDE9FE",
    accentForeground: "#4C1D95",
    border: "#E8E5F2",
    destructive: "#E0245E",
    success: "#12B981",
    warning: "#F59E0B",
  },
  dark: {
    background: "#0B0A12",
    foreground: "#F6F4FF",
    card: "#16141F",
    cardForeground: "#F6F4FF",
    primary: "#A78BFA",
    primaryForeground: "#14121C",
    primaryDeep: "#7C3AED",
    secondary: "#221F2E",
    secondaryForeground: "#E7E2FF",
    muted: "#1D1A28",
    mutedForeground: "#A09CB8",
    accent: "#271F3D",
    accentForeground: "#DDD3FF",
    border: "#26222F",
    destructive: "#FF4D79",
    success: "#34D399",
    warning: "#F59E0B",
  },
} as const;

/** Hero gradient stops, shared with the web app. */
export const HeroGradient = ["#5B21B6", "#7C3AED", "#A78BFA"] as const;

export type ColorScheme = keyof typeof Colors;
export type ThemeColors = (typeof Colors)[ColorScheme];

/**
 * Platform-appropriate font families. Use for `fontFamily` in styles, or load a
 * custom font with `useFonts` from `expo-font` and reference it here.
 */
export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', sans-serif",
    mono: "'SF Mono', 'Roboto Mono', monospace",
  },
});

/**
 * Loaded Google fonts (see `app/_layout.tsx`). `display` carries headings and
 * every number; `body` carries prose and labels.
 */
export const Type = {
  body: "PlusJakartaSans_400Regular",
  bodyMedium: "PlusJakartaSans_500Medium",
  bodySemi: "PlusJakartaSans_600SemiBold",
  bodyBold: "PlusJakartaSans_700Bold",
  display: "Sora_600SemiBold",
  displayBold: "Sora_700Bold",
  num: "Sora_600SemiBold",
} as const;
