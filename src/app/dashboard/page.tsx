import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { payments, subscriptions } from "@/db/schema";
import SiteHeader from "@/components/SiteHeader";
import RenewPopup from "@/components/RenewPopup";
import Popups from "@/components/Popups";
import { getCustomer } from "@/lib/auth";
import { getActivePopups } from "@/lib/data";
import { getI18n } from "@/lib/locale";
import { diffDays, fmtMoney, fmtTime, todayBH } from "@/lib/dates";
import { WHATSAPP_LINK, WHATSAPP_NUMBER } from "@/lib/config";

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const sp = await searchParams;
  const customer = await getCustomer();
  if (!customer) redirect("/login");
  const { locale, t, p } = await getI18n();
  const today = todayBH();

  const [subs, pays, popups] = await Promise.all([
    db.select().from(subscriptions).where(eq(subscriptions.customerId, customer.id)).orderBy(desc(subscriptions.endDate)),
    db.select().from(payments).where(eq(payments.customerId, customer.id)).orderBy(desc(payments.createdAt)),
    getActivePopups(),
  ]);

  const latest = subs[0];
  const current = subs.find((s) => s.startDate <= today && s.endDate >= today) ?? subs.find((s) => s.startDate > today);
  const daysLeft = latest ? diffDays(today, latest.endDate) : null;
  const expired = latest && daysLeft! < 0;
  const past = subs.filter((s) => s.id !== current?.id);
  const addons = (s: typeof latest) => s?.addons.map((a) => p(a.nameAr, a.nameEn)).join("، ") || "—";

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-10">
        {sp.welcome && (
          <div className="rounded-3xl bg-leaf/40 p-5 text-center font-semibold text-verde">🎉 {t("welcomeMsg")}</div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-4xl font-bold text-verde">
            {t("hello")} {customer.name}
          </h1>
          <div className="flex gap-2">
            <Link href="/register?renew=same" className="btn btn-primary">{t("renewSame")}</Link>
            <Link href="/register?renew=other" className="btn btn-sky">{t("renewOther")}</Link>
          </div>
        </div>

        {expired && (
          <div className="rounded-3xl bg-red-50 p-5 font-semibold text-red-700">{t("subscriptionExpired")}</div>
        )}

        <section className="card space-y-4">
          <h2 className="font-display text-2xl font-bold text-verde">{t("currentSubscription")}</h2>
          {current ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xl font-bold text-verde">{p(current.packageAr, current.packageEn)}</p>
                <p className="text-sage">{p(current.optionAr, current.optionEn)}</p>
                <p className="text-sm">{t("protein")} {current.protein} · {t("carbs")} {current.carbs}</p>
                <p className="text-sm"><b>{t("addonsTitle")}:</b> {addons(current)}</p>
                <p className="text-sm"><b>{t("deliveryTime")}:</b> <span dir="ltr">{fmtTime(current.slotStart, locale)} – {fmtTime(current.slotEnd, locale)}</span></p>
                <p className="text-sm">
                  <b>{t("deliveryAddress")}:</b> {t("houseBuilding")} {current.house}{current.flat ? `, ${t("flat")} ${current.flat}` : ""}, {t("road")} {current.road}, {t("block")} {current.block} — {p(current.regionAr, current.regionEn)}
                </p>
              </div>
              <div className="space-y-2 rounded-2xl bg-blush p-5">
                <p className="text-sm text-sage">{t("startDate")}</p>
                <p className="font-display text-2xl font-bold text-verde" dir="ltr">{current.startDate}</p>
                <p className="text-sm text-sage">{t("endDate")}</p>
                <p className="font-display text-2xl font-bold text-verde" dir="ltr">{current.endDate}</p>
                <p className="text-sm">
                  {current.days} {t("days")} ·{" "}
                  {current.startDate > today ? t("sub_upcoming") : `${Math.max(diffDays(today, current.endDate), 0)} ${t("daysLeft")}`}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-slate-500">{t("noActiveSubscription")}</p>
          )}
        </section>

        <section className="card overflow-x-auto">
          <h2 className="mb-3 font-display text-2xl font-bold text-verde">{t("paymentHistory")}</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-sage">
                {[t("date"), t("payment"), t("reference"), t("total")].map((h) => (
                  <th key={h} className="px-2 py-2 text-start">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pays.map((x) => (
                <tr key={x.id} className="border-b">
                  <td className="px-2 py-2" dir="ltr">{x.createdAt.toISOString().slice(0, 10)}</td>
                  <td className="px-2 py-2">{t("m_" + x.method)}{x.cardLast4 ? ` ••${x.cardLast4}` : ""}</td>
                  <td className="px-2 py-2" dir="ltr">{x.reference}</td>
                  <td className="px-2 py-2 font-bold">{fmtMoney(x.amount)} {t("bd")}</td>
                </tr>
              ))}
              {!pays.length && <tr><td colSpan={4} className="py-4 text-center text-slate-400">{t("noData")}</td></tr>}
            </tbody>
          </table>
        </section>

        <section className="card overflow-x-auto">
          <h2 className="mb-3 font-display text-2xl font-bold text-verde">{t("previousSubscriptions")}</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-sage">
                {[t("mealPlan"), t("subscriptionPeriod"), t("days"), t("total")].map((h) => (
                  <th key={h} className="px-2 py-2 text-start">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {past.map((s) => (
                <tr key={s.id} className="border-b">
                  <td className="px-2 py-2">{p(s.packageAr, s.packageEn)}<br /><span className="text-xs text-sage">{p(s.optionAr, s.optionEn)}</span></td>
                  <td className="px-2 py-2" dir="ltr">{s.startDate} → {s.endDate}</td>
                  <td className="px-2 py-2">{s.days}</td>
                  <td className="px-2 py-2 font-bold">{fmtMoney(s.total)} {t("bd")}</td>
                </tr>
              ))}
              {!past.length && <tr><td colSpan={4} className="py-4 text-center text-slate-400">{t("noData")}</td></tr>}
            </tbody>
          </table>
        </section>

        <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="btn w-full bg-[#25D366] !py-3 text-white hover:brightness-95 sm:w-auto">
          💬 {t("whatsapp")} · <span dir="ltr">{WHATSAPP_NUMBER}</span>
        </a>
      </main>
      {latest && daysLeft! >= 0 && daysLeft! <= 2 && <RenewPopup endDate={latest.endDate} daysLeft={daysLeft!} />}
      <Popups popups={popups} />
    </>
  );
}
