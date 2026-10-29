"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { makeHelpers, type Helpers, type Locale } from "@/lib/i18n";

type Ctx = Helpers & { locale: Locale };

const LocaleCtx = createContext<Ctx>({ locale: "ar", ...makeHelpers("ar") });

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value = useMemo(() => ({ locale, ...makeHelpers(locale) }), [locale]);
  return <LocaleCtx.Provider value={value}>{children}</LocaleCtx.Provider>;
}

export function useLocale() {
  return useContext(LocaleCtx);
}
