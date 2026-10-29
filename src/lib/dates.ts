import { TZ } from "./config";

export function todayBH(): string {
  return dateKeyBH(new Date());
}

export function dateKeyBH(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function addDays(d: string, n: number): string {
  const dt = new Date(d + "T00:00:00Z");
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

export function diffDays(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}

export function fmtTime(hhmm: string, locale: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const ar = locale === "ar";
  const suffix = h >= 12 ? (ar ? "م" : "PM") : ar ? "ص" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function fmtMoney(n: number): string {
  return (Math.round(n * 1000) / 1000).toFixed(3);
}
