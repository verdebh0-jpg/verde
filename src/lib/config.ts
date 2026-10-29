export const WHATSAPP_NUMBER = "66937877";
export const WHATSAPP_LINK = "https://wa.me/97366937877";
export const TZ = "Asia/Bahrain";
export const MIN_DAYS = 5;
export const MAX_DAYS = 30;
export const ALERT_MS = 3 * 60 * 1000;

export const STATUSES = [
  "not_ready",
  "preparing",
  "ready",
  "out_for_delivery",
] as const;
export type OrderStatus = (typeof STATUSES)[number];

export const PERMISSIONS = [
  "orders",
  "reports",
  "packages",
  "addons",
  "delivery_times",
  "regions",
  "discounts",
  "popups",
  "customers",
  "settings",
] as const;
export type Permission = (typeof PERMISSIONS)[number];
