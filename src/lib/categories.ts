import { Truck, GraduationCap, Bus, Search, Briefcase, HandHelping, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type CategoryKey = "delivery" | "teaching" | "transport" | "search" | "work" | "help" | "other";

export const CATEGORIES: {
  key: CategoryKey;
  label: string;
  icon: LucideIcon;
  colorVar: string;
}[] = [
  { key: "delivery", label: "توصيل", icon: Truck, colorVar: "var(--cat-delivery)" },
  { key: "teaching", label: "تعليم", icon: GraduationCap, colorVar: "var(--cat-teaching)" },
  { key: "transport", label: "نقل", icon: Bus, colorVar: "var(--cat-transport)" },
  { key: "search", label: "بحث", icon: Search, colorVar: "var(--cat-search)" },
  { key: "work", label: "عمل", icon: Briefcase, colorVar: "var(--cat-work)" },
  { key: "help", label: "مساعدة", icon: HandHelping, colorVar: "var(--cat-help)" },
  { key: "other", label: "أخرى", icon: Sparkles, colorVar: "var(--cat-other)" },
];

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.key, c])) as Record<
  CategoryKey,
  (typeof CATEGORIES)[number]
>;
