import {
  Baby,
  Bell,
  BookOpen,
  Bus,
  Car,
  Coffee,
  Dumbbell,
  Droplets,
  Film,
  Fuel,
  Gift,
  HeartPulse,
  House,
  KeyRound,
  Laptop,
  Megaphone,
  MoreHorizontal,
  PawPrint,
  PiggyBank,
  Plane,
  Scissors,
  ShieldCheck,
  ShoppingBag,
  ShoppingBasket,
  Smartphone,
  Sun,
  Tag,
  UtensilsCrossed,
  Wallet,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";

/** Icon keys stored on categories → lucide components. */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  groceries: ShoppingBasket,
  travel: Plane,
  car: Car,
  home: House,
  insurance: ShieldCheck,
  education: BookOpen,
  marketing: Megaphone,
  shopping: ShoppingBag,
  internet: Wifi,
  water: Droplets,
  rent: KeyRound,
  gym: Dumbbell,
  subscription: Bell,
  vacation: Sun,
  dining: UtensilsCrossed,
  coffee: Coffee,
  transit: Bus,
  fuel: Fuel,
  health: HeartPulse,
  entertainment: Film,
  gift: Gift,
  kids: Baby,
  pets: PawPrint,
  phone: Smartphone,
  utilities: Zap,
  beauty: Scissors,
  salary: Wallet,
  freelance: Laptop,
  savings: PiggyBank,
  other: MoreHorizontal,
  tag: Tag,
};

/** Selectable icon keys for the "new category" form. */
export const ICON_CHOICES = Object.keys(CATEGORY_ICONS).filter((key) => key !== "tag");

export function categoryIcon(key: string): LucideIcon {
  return CATEGORY_ICONS[key] ?? Tag;
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
