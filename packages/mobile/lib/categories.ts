import type { ComponentProps } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type MciName = ComponentProps<typeof MaterialCommunityIcons>["name"];

/** Icon keys stored on categories → MaterialCommunityIcons glyphs. */
export const CATEGORY_ICONS: Record<string, MciName> = {
  groceries: "basket-outline",
  travel: "airplane",
  car: "car-outline",
  home: "home-outline",
  insurance: "shield-check-outline",
  education: "book-open-outline",
  marketing: "bullhorn-outline",
  shopping: "shopping-outline",
  internet: "wifi",
  water: "water-outline",
  rent: "key-outline",
  gym: "dumbbell",
  subscription: "bell-outline",
  vacation: "white-balance-sunny",
  dining: "silverware-fork-knife",
  coffee: "coffee-outline",
  transit: "bus",
  fuel: "gas-station-outline",
  health: "heart-pulse",
  entertainment: "movie-open-outline",
  gift: "gift-outline",
  kids: "baby-carriage",
  pets: "paw-outline",
  phone: "cellphone",
  utilities: "flash-outline",
  beauty: "content-cut",
  salary: "wallet-outline",
  freelance: "laptop",
  savings: "piggy-bank-outline",
  other: "dots-horizontal",
  tag: "tag-outline",
};

/** Selectable icon keys for the "new category" flow. */
export const ICON_CHOICES = Object.keys(CATEGORY_ICONS).filter((key) => key !== "tag");

export function categoryIcon(key: string): MciName {
  return CATEGORY_ICONS[key] ?? "tag-outline";
}

/** Hue keys stored on categories → hex values (design.md palette). */
export const CATEGORY_COLORS: Record<string, string> = {
  violet: "#7C3AED",
  emerald: "#10B981",
  sky: "#0EA5E9",
  amber: "#F59E0B",
  rose: "#F43F5E",
  indigo: "#6366F1",
  teal: "#14B8A6",
  orange: "#FB923C",
  pink: "#EC4899",
  lime: "#84CC16",
  cyan: "#06B6D4",
  slate: "#64748B",
};

export const COLOR_CHOICES = Object.keys(CATEGORY_COLORS);

export function categoryColor(key: string) {
  return CATEGORY_COLORS[key] ?? CATEGORY_COLORS.violet;
}

/** Background tint for icon tiles. */
export function categoryTint(key: string, alpha = 0.14) {
  const hex = categoryColor(key).replace("#", "");
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
