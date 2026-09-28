import { Colors, type ThemeColors } from "@/constants/theme";
import { usePreferences } from "@/components/preferences";

/**
 * Returns the color palette for the active color scheme. The scheme follows the
 * user's Appearance preference (Account tab) — light, dark, or the OS setting.
 *
 * ```tsx
 * const colors = useColors();
 * <View style={{ backgroundColor: colors.background }}>
 *   <Text style={{ color: colors.foreground }}>Hello</Text>
 * </View>
 * ```
 */
export function useColors(): ThemeColors {
  return Colors[usePreferences().resolvedScheme];
}

/** The resolved scheme itself, for status bars and gradients. */
export function useScheme(): "light" | "dark" {
  return usePreferences().resolvedScheme;
}
