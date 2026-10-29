import Link from "next/link";
import { getCustomer } from "@/lib/auth";
import { getI18n } from "@/lib/locale";
import { getSettings } from "@/lib/data";
import Logo from "./Logo";
import LangToggle from "./LangToggle";
import LogoutButton from "./LogoutButton";

export default async function SiteHeader() {
  const [{ t }, customer, settings] = await Promise.all([getI18n(), getCustomer(), getSettings()]);
  return (
    <header className="sticky top-0 z-30 border-b border-verde/10 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" aria-label="Verde">
          <Logo src={settings.logo} />
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-verde">
          <Link href="/#plans" className="hidden px-3 py-2 hover:underline sm:inline">
            {t("plans")}
          </Link>
          {customer ? (
            <>
              <Link href="/dashboard" className="px-3 py-2 hover:underline">
                {t("dashboard")}
              </Link>
              <LogoutButton kind="customer" className="btn btn-outline !py-1.5 text-sm" />
            </>
          ) : (
            <>
              <Link href="/login" className="px-3 py-2 hover:underline">
                {t("login")}
              </Link>
              <Link href="/register" className="btn btn-primary !py-1.5 text-sm">
                {t("register")}
              </Link>
            </>
          )}
          <LangToggle />
        </nav>
      </div>
    </header>
  );
}
