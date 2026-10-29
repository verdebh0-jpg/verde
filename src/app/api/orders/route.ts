import { and, asc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { customers, orders, subscriptions } from "@/db/schema";
import { json, staffForApi } from "@/lib/auth";
import { todayBH } from "@/lib/dates";

export const dynamic = "force-dynamic";

function baseQuery() {
  return db
    .select({
      o: orders,
      s: subscriptions,
      c: { name: customers.name, phone: customers.phone },
    })
    .from(orders)
    .innerJoin(subscriptions, eq(orders.subscriptionId, subscriptions.id))
    .innerJoin(customers, eq(orders.customerId, customers.id));
}

type Row = Awaited<ReturnType<typeof baseQuery>>[number];

function shape(r: Row) {
  return {
    id: r.o.id,
    deliveryDate: r.o.deliveryDate,
    dayNumber: r.o.dayNumber,
    status: r.o.status,
    customerName: r.c.name,
    phone: r.c.phone,
    house: r.s.house,
    flat: r.s.flat,
    road: r.s.road,
    block: r.s.block,
    regionAr: r.s.regionAr,
    regionEn: r.s.regionEn,
    packageAr: r.s.packageAr,
    packageEn: r.s.packageEn,
    optionAr: r.s.optionAr,
    optionEn: r.s.optionEn,
    mealsPerDay: r.s.mealsPerDay,
    days: r.s.days,
    addons: r.s.addons,
    unwanted: r.s.unwanted,
    allergy: r.s.allergy,
    slotId: r.s.slotId,
    slotGroupAr: r.s.slotGroupAr,
    slotGroupEn: r.s.slotGroupEn,
    slotStart: r.s.slotStart,
    slotEnd: r.s.slotEnd,
  };
}

export async function GET(req: Request) {
  const s = await staffForApi("orders");
  if (!s) return json({ error: "unauthorized" }, 401);
  const url = new URL(req.url);
  const q = url.searchParams.get("date") ?? "";
  const today = todayBH();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(q) ? q : today;

  const [rows, pend] = await Promise.all([
    baseQuery()
      .where(eq(orders.deliveryDate, date))
      .orderBy(asc(subscriptions.slotStart), asc(orders.id)),
    baseQuery()
      .where(and(eq(orders.deliveryDate, today), ne(orders.status, "out_for_delivery")))
      .orderBy(asc(subscriptions.slotStart), asc(orders.id)),
  ]);

  return json({
    today,
    orders: rows.map(shape),
    pending: pend.map(shape).map((o) => ({
      id: o.id,
      customerName: o.customerName,
      slotStart: o.slotStart,
      slotEnd: o.slotEnd,
      status: o.status,
    })),
  });
}
