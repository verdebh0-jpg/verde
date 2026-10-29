import Link from "next/link";
import { and, count, eq, gte, lte, ne } from "drizzle-orm";
import { db } from "@/db";
import { customers, orders, payments, subscriptions } from "@/db/schema";
import { requireStaffPage } from "@/lib/auth";
import { getI18n } from "@/lib/locale";
import { fmtMoney, todayBH } from "@/lib/dates";

export default async function AdminHome() {
  const s = await requireStaffPage();
  const { t } = await getI18n();
  const today = todayBH();
  const monthStart = new Date(`${today.slice(0, 8)}01T00:00:00+03:00`);
  const dayStart = new Date(`${today}T00:00:00+03:00`);

  const [[cust], [active], [todayOrders], [pending], pays] = await Promise.all([
    db.select({ n: count() }).from(customers),
    db
      .select({ n: count() })
      .from(subscriptions)
      .where(and(lte(subscriptions.startDate, today), gte(subscriptions.endDate, today))),
    db.select({ n: count() }).from(orders).where(eq(orders.deliveryDate, today)),
    db
      .select({ n: count() })
      .from(orders)
      .where(and(eq(orders.deliveryDate, today), ne(orders.status, "out_for_delivery"))),
    db.select({ amount: payments.amount, createdAt: payments.createdAt }).from(payments).where(gte(payments.createdAt, monthStart)),
  ]);
  const salesMonth = pays.reduce((a, b) => a + b.amount, 0);
  const salesToday = pays.filter((p) => p.createdAt >= dayStart).reduce((a, b) => a + b.amount, 0);

  const cards = [
    [t("customers"), String(cust.n)],
    [t("activeSubscriptions"), String(active.n)],
    [t("ordersToday"), String(todayOrders.n)],
    [t("pendingToday"), String(pending.n)],
    [t("salesToday"), `${fmtMoney(salesToday)} ${t("bd")}`],
    [t("salesMonth"), `${fmtMoney(salesMonth)} ${t("bd")}`],
  ];

  return (
    <>
      <h1 className="font-display text-4xl font-bold text-verde">
        {t("hello")} {s.name || s.username}
      </h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([k, v]) => (
          <div key={k} className="card">
            <p className="text-sm text-sage">{k}</p>
            <p className="font-display text-4xl font-bold text-verde">{v}</p>
          </div>
        ))}
      </div>
      <Link href="/kitchen" className="btn btn-sky">
        🍳 {t("kitchenDashboard")}
      </Link>
    </>
  );
}
