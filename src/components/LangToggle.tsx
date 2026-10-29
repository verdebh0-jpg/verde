"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "./LocaleProvider";

export default function LangToggle({ light = false }: { light?: boolean }) {
  const { locale } = useLocale();
  const router = useRouter();
  function toggle() {
    const next = locale === "ar" ? "en" : "ar";
    document.cookie = `lang=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }
  return (
    <button
      onClick={toggle}
      aria-label="Switch language"
      className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
        light
          ? "border-white/40 text-white hover:bg-white/10"
          : "border-verde/30 text-verde hover:bg-verde hover:text-white"
      }`}
    >
      {locale === "ar" ? "English" : "العربية"}
    </button>
  );
}
