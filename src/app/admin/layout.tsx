import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import LangToggle from "@/components/LangToggle";
import LogoutButton from "@/components/LogoutButton";
import Logo from "@/components/Logo";
import { getStaff, hasPerm } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import { getI18n } from "@/lib/locale";

const NAV = [
  { href: "/admin", key: "overview", icon: "🏠", perm: null },
  { href: "/admin/orders", key: "orders", icon: "📦", perm: "orders" },
  { href: "/admin/reports", key: "reports", icon: "📊", perm: "reports" },
  { href: "/admin/packages", key: "packages", icon: "🥗", perm: "packages" },
  { href: "/admin/addons", key: "addons", icon: "➕", perm: "addons" },
  { href: "/admin/delivery-times", key: "delivery_times", icon: "🕒", perm: "delivery_times" },
  { href: "/admin/regions", key: "regions", icon: "📍", perm: "regions" },
  { href: "/admin/discounts", key: "discounts", icon: "🏷️", perm: "discounts" },
  { href: "/admin/popups", key: "popups", icon: "🪟", perm: "popups" },
  { href: "/admin/customers", key: "customers", icon: "👥", perm: "customers" },
  { href: "/admin/staff", key: "staff", icon: "🛡️", perm: "owner" },
  { href: "/admin/settings", key: "settings", icon: "⚙️", perm: "settings" },
] as const;

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const s = await getStaff();
  if (!s) redirect("/staff/login");
  if (s.role === "kitchen") redirect("/kitchen");
  const [{ t }, settings] = await Promise.all([getI18n(), getSettings()]);
  const items = NAV.filter((n) => (n.perm === null ? true : n.perm === "owner" ? s.role === "owner" : hasPerm(s, n.perm))).map(
    (n) => ({ href: n.href, icon: n.icon, label: t("nav_" + n.key) }),
  );
  return (
    <div className="min-h-screen bg-blush/40 lg:flex">
      <aside className="bg-verde text-white lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4">
          <Logo src={settings.logo} light />
          <span className="font-display text-sm text-sky lg:hidden">{t("adminDashboard")}</span>
        </div>
        <AdminNav items={items} />
        <div className="hidden space-y-3 p-4 lg:block">
          <p className="text-xs text-white/70">
            {s.name || s.username} · {t("role_" + s.role)}
          </p>
          <div className="flex gap-2">
            <LangToggle light />
            <LogoutButton kind="staff" className="btn border border-white/40 !py-1.5 text-sm text-white hover:bg-white/10" />
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 space-y-6 p-4 lg:p-8">
        <div className="flex justify-end gap-2 lg:hidden">
          <LangToggle />
          <LogoutButton kind="staff" className="btn btn-outline !py-1.5 text-sm" />
        </div>
        {children}
      </main>
    </div>
  );
}
