import { cookies } from "next/headers";
import { makeHelpers, type Locale } from "./i18n";

export async function getI18n() {
  const jar = await cookies();
  const locale: Locale = jar.get("lang")?.value === "en" ? "en" : "ar";
  return { locale, dir: locale === "ar" ? "rtl" : "ltr", ...makeHelpers(locale) };
}
