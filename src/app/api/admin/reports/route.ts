import { and, asc, eq, gte, lt } from "drizzle-orm";
import { db } from "@/db";
import { customers, payments, subscriptions } from "@/db/schema";
import { json, staffForApi } from "@/lib/auth";
import { addDays, dateKeyBH, todayBH } from "@/lib/dates";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const s = await staffForApi("reports");
  if (!s) return json({ error: "unauthorized" }, 401);
  const url = new URL(req.url);
  const ok = (v: string | null) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
  const to = ok(url.searchParams.get("to")) ?? todayBH();
  const from = ok(url.searchParams.get("from")) ?? addDays(to, -29);

  const rows = await db
    .select({
      p: payments,
      s: subscriptions,
      c: { name: customers.name, phone: customers.phone },
    })
    .from(payments)
    .innerJoin(subscriptions, eq(payments.subscriptionId, subscriptions.id))
    .innerJoin(customers, eq(payments.customerId, customers.id))
    .where(
      and(
        gte(payments.createdAt, new Date(`${from}T00:00:00+03:00`)),
        lt(payments.createdAt, new Date(`${addDays(to, 1)}T00:00:00+03:00`)),
      ),
    )
    .orderBy(asc(payments.createdAt));

  return json({
    from,
    to,
    rows: rows.map((r) => ({
      id: r.p.id,
      date: dateKeyBH(r.p.createdAt),
      customer: r.c.name,
      phone: r.c.phone,
      packageAr: r.s.packageAr,
      packageEn: r.s.packageEn,
      optionAr: r.s.optionAr,
      optionEn: r.s.optionEn,
      days: r.s.days,
      method: r.p.method,
      status: r.p.status,
      reference: r.p.reference,
      subtotal: r.s.subtotal,
      discount: r.s.discount,
      code: r.s.discountCode,
      deliveryFee: r.s.deliveryFee,
      total: r.p.amount,
    })),
  });
}
