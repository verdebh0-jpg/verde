import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  addons,
  customers,
  deliverySlots,
  discountCodes,
  orders,
  packageOptions,
  packages,
  paymentMethods,
  payments,
  regions,
  subscriptions,
} from "@/db/schema";
import { getCustomer, hashPassword, json, setSession } from "@/lib/auth";
import { MAX_DAYS, MIN_DAYS } from "@/lib/config";
import { addDays, todayBH } from "@/lib/dates";
import { findDiscount } from "@/lib/discount";
import { chargePayment } from "@/lib/payments";
import { computePricing } from "@/lib/pricing";
import { ensureSeed } from "@/lib/seed";

const bad = (error: string, status = 400) => json({ error }, status);

export async function POST(req: Request) {
  await ensureSeed();
  const b = await req.json().catch(() => null);
  if (!b || typeof b !== "object") return bad("invalid_input");
  const str = (v: unknown) => (typeof v === "string" ? v.trim().slice(0, 300) : "");

  const existing = await getCustomer();
  const today = todayBH();

  const days = Math.round(Number(b.days));
  if (!(days >= MIN_DAYS && days <= MAX_DAYS)) return bad("invalid_input");

  const [opt] = await db
    .select()
    .from(packageOptions)
    .where(and(eq(packageOptions.id, Number(b.optionId)), eq(packageOptions.active, true)));
  if (!opt) return bad("invalid_input");
  const [pkg] = await db
    .select()
    .from(packages)
    .where(and(eq(packages.id, opt.packageId), eq(packages.active, true)));
  const [slot] = await db
    .select()
    .from(deliverySlots)
    .where(and(eq(deliverySlots.id, Number(b.slotId)), eq(deliverySlots.active, true)));
  const [region] = await db
    .select()
    .from(regions)
    .where(and(eq(regions.id, Number(b.regionId)), eq(regions.active, true)));
  const [method] = await db
    .select()
    .from(paymentMethods)
    .where(and(eq(paymentMethods.key, str(b.paymentMethod)), eq(paymentMethods.active, true)));
  if (!pkg || !slot || !region) return bad("invalid_input");
  if (!method) return bad("invalid_method");

  const addonIds: number[] = Array.isArray(b.addonIds) ? b.addonIds.map(Number).filter(Number.isFinite) : [];
  const chosen = addonIds.length
    ? await db.select().from(addons).where(and(inArray(addons.id, addonIds), eq(addons.active, true)))
    : [];

  const house = str(b.house), road = str(b.road), block = str(b.block), flat = str(b.flat);
  if (!house || !road || !block) return bad("address_required");

  let name = existing?.name ?? "";
  let email = "", phone = "", password = "";
  if (!existing) {
    name = str(b.name);
    email = str(b.email).toLowerCase();
    phone = str(b.phone);
    password = typeof b.password === "string" ? b.password : "";
    if (!name || !phone || !/^\S+@\S+\.\S+$/.test(email)) return bad("invalid_input");
    if (password.length < 6) return bad("weak_password");
    const [dup] = await db.select({ id: customers.id }).from(customers).where(eq(customers.email, email));
    if (dup) return bad("email_exists", 409);
  }

  const disc = await findDiscount(str(b.discountCode));
  if (str(b.discountCode) && !disc) return bad("invalid_code");

  const pricing = computePricing({
    price5: opt.price5,
    days,
    addons: chosen,
    regionFee: region.fee,
    discount: disc ? { type: disc.type, value: disc.value } : null,
  });

  // start date: at least tomorrow, and after any existing subscription
  let minStart = addDays(today, 1);
  if (existing) {
    const [last] = await db
      .select({ endDate: subscriptions.endDate })
      .from(subscriptions)
      .where(eq(subscriptions.customerId, existing.id))
      .orderBy(desc(subscriptions.endDate))
      .limit(1);
    if (last && addDays(last.endDate, 1) > minStart) minStart = addDays(last.endDate, 1);
  }
  const reqStart = str(b.startDate);
  const startDate = /^\d{4}-\d{2}-\d{2}$/.test(reqStart) && reqStart >= minStart ? reqStart : minStart;
  const endDate = addDays(startDate, days - 1);

  // ---- payment must succeed before the account/subscription is created ----
  const pay = await chargePayment({
    method: method.key,
    amount: pricing.total,
    card: b.card,
    benefitPhone: str(b.benefitPhone),
  });
  if (!pay.ok) return bad(pay.error, 402);

  const profile = {
    weight: str(b.weight),
    height: str(b.height),
    unwanted: str(b.unwanted),
    allergy: str(b.allergy),
    house,
    flat,
    road,
    block,
    regionId: region.id,
  };

  try {
    const result = await db.transaction(async (tx) => {
      let customerId = existing?.id ?? 0;
      if (!existing) {
        const [c] = await tx
          .insert(customers)
          .values({ name, email, phone, passwordHash: hashPassword(password), ...profile })
          .returning({ id: customers.id });
        customerId = c.id;
      } else {
        await tx.update(customers).set(profile).where(eq(customers.id, existing.id));
      }
      const [sub] = await tx
        .insert(subscriptions)
        .values({
          customerId,
          packageId: pkg.id,
          optionId: opt.id,
          packageAr: pkg.nameAr,
          packageEn: pkg.nameEn,
          optionAr: opt.labelAr,
          optionEn: opt.labelEn,
          protein: pkg.protein,
          carbs: pkg.carbs,
          mealsPerDay: opt.mealsPerDay,
          days,
          startDate,
          endDate,
          regionId: region.id,
          regionAr: region.nameAr,
          regionEn: region.nameEn,
          house,
          flat,
          road,
          block,
          slotId: slot.id,
          slotGroupAr: slot.groupAr,
          slotGroupEn: slot.groupEn,
          slotStart: slot.startTime,
          slotEnd: slot.endTime,
          addons: chosen.map((a) => ({ id: a.id, nameAr: a.nameAr, nameEn: a.nameEn, price: a.price, pricingType: a.pricingType })),
          unwanted: profile.unwanted,
          allergy: profile.allergy,
          weight: profile.weight,
          height: profile.height,
          subtotal: pricing.subtotal,
          discount: pricing.discount,
          discountCode: disc?.code ?? "",
          deliveryFee: pricing.deliveryFee,
          total: pricing.total,
          paymentMethod: method.key,
        })
        .returning({ id: subscriptions.id });
      await tx.insert(payments).values({
        customerId,
        subscriptionId: sub.id,
        method: method.key,
        amount: pricing.total,
        status: pay.status,
        reference: pay.reference,
        cardLast4: pay.last4,
      });
      await tx.insert(orders).values(
        Array.from({ length: days }, (_, i) => ({
          subscriptionId: sub.id,
          customerId,
          deliveryDate: addDays(startDate, i),
          dayNumber: i + 1,
        })),
      );
      if (disc) {
        await tx
          .update(discountCodes)
          .set({ usageCount: sql`${discountCodes.usageCount} + 1` })
          .where(eq(discountCodes.id, disc.id));
      }
      return { customerId, subId: sub.id };
    });
    if (!existing) await setSession("customer", result.customerId);
    return json({ ok: true, subscriptionId: result.subId, reference: pay.reference });
  } catch (e) {
    console.error("subscribe failed", e);
    return bad("server_error", 500);
  }
}
