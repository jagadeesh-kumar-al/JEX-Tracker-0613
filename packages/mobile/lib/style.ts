import { Platform } from "react-native";

/**
 * Suppresses the browser's default focus ring on react-native-web text inputs.
 * A no-op on native, where the property does not exist.
 */
export const noOutline =
  Platform.OS === "web" ? ({ outlineStyle: "none" } as unknown as undefined) : undefined;
