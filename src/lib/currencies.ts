// Only Bahraini Dinar is supported.
export const BHD_SHORT = "د.ب";
export const BHD_LABEL = "دينار بحريني";

export function currencyShort(_key?: string | null): string {
  return BHD_SHORT;
}
