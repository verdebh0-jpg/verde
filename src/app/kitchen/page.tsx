import OrdersBoard from "@/components/OrdersBoard";
import LangToggle from "@/components/LangToggle";
import LogoutButton from "@/components/LogoutButton";
import Logo from "@/components/Logo";
import Link from "next/link";
import { requireStaffPage } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import { getI18n } from "@/lib/locale";
import { todayBH } from "@/lib/dates";

export default async function KitchenPage() {
  const s = await requireStaffPage("orders");
  const [{ t }, settings] = await Promise.all([getI18n(), getSettings()]);
  return (
    <div className="min-h-screen bg-blush/40">
      <header className="bg-verde">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-4">
            <Logo src={settings.logo} light />
            <span className="font-display text-2xl font-bold text-sky">{t("kitchenDashboard")}</span>
          </div>
          <div className="flex items-center gap-2">
            {s.role !== "kitchen" && (
              <Link href="/admin" className="btn btn-sky !py-1.5 text-sm">
                {t("adminDashboard")}
              </Link>
            )}
            <LangToggle light />
            <LogoutButton kind="staff" className="btn border border-white/40 !py-1.5 text-sm text-white hover:bg-white/10" />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-4 lg:p-8">
        <OrdersBoard initialDate={todayBH()} />
      </main>
    </div>
  );
}
