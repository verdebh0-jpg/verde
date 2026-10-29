import { asc, desc } from "drizzle-orm";
import { db } from "@/db";
import { customers, subscriptions } from "@/db/schema";
import CustomersClient from "@/components/CustomersClient";
import { requireStaffPage } from "@/lib/auth";
import { getI18n } from "@/lib/locale";
import { todayBH } from "@/lib/dates";

export default async function CustomersPage() {
  await requireStaffPage("customers");
  const { t } = await getI18n();
  const [cs, subs] = await Promise.all([
    db.select().from(customers).orderBy(desc(customers.createdAt)),
    db
      .select({
        customerId: subscriptions.customerId,
        startDate: subscriptions.startDate,
        endDate: subscriptions.endDate,
        days: subscriptions.days,
      })
      .from(subscriptions)
      .orderBy(asc(subscriptions.endDate)),
  ]);
  const latest = new Map<number, (typeof subs)[number]>();
  const count = new Map<number, number>();
  for (const s of subs) {
    latest.set(s.customerId, s); // ascending → last wins = latest end date
    count.set(s.customerId, (count.get(s.customerId) ?? 0) + 1);
  }
  const list = cs.map((c) => {
    const l = latest.get(c.id);
    return {
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      createdAt: c.createdAt.toISOString(),
      startDate: l?.startDate ?? null,
      endDate: l?.endDate ?? null,
      days: l?.days ?? null,
      subs: count.get(c.id) ?? 0,
    };
  });
  return (
    <>
      <h1 className="font-display text-4xl font-bold text-verde">{t("nav_customers")}</h1>
      <CustomersClient customers={list} today={todayBH()} />
    </>
  );
}
