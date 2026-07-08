export type CurrencyKey = "JOD" | "SAR" | "AED" | "KWD" | "QAR" | "BHD" | "OMR";

export const CURRENCIES: { key: CurrencyKey; label: string; short: string }[] = [
  { key: "JOD", label: "دينار أردني", short: "د.أ" },
  { key: "SAR", label: "ريال سعودي", short: "ر.س" },
  { key: "AED", label: "درهم إماراتي", short: "د.إ" },
  { key: "KWD", label: "دينار كويتي", short: "د.ك" },
  { key: "QAR", label: "ريال قطري", short: "ر.ق" },
  { key: "BHD", label: "دينار بحريني", short: "د.ب" },
  { key: "OMR", label: "ريال عماني", short: "ر.ع" },
];

export const CURRENCY_MAP = Object.fromEntries(CURRENCIES.map((c) => [c.key, c])) as Record<
  CurrencyKey,
  (typeof CURRENCIES)[number]
>;

export function currencyShort(key: string | null | undefined): string {
  return CURRENCY_MAP[(key as CurrencyKey) || "JOD"]?.short ?? "د.أ";
}
