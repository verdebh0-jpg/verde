import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  addons,
  customMealOptions,
  customers,
  deliverySlots,
  discountCodes,
  orders,
  packageOptions,
  packages,
  paymentMethods,
  payments,
    preferredProteins,
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

  const subscriptionType = b.subscriptionType === "custom" ? "custom" : "packages";
  const days = Math.round(Number(b.days));
  if (!(days >= MIN_DAYS && days <= MAX_DAYS)) return bad("invalid_input");

  let opt: any = null;
  let pkg: any = null;
  let customDetails: any = null;
  let pricing: any = null;

  // التحقق بناءً على نوع الاشتراك
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

  if (!slot || !region) return bad("invalid_input");
  if (!method) return bad("invalid_method");

  const house = str(b.house), road = str(b.road), block = str(b.block), flat = str(b.flat);
  if (!house || !road || !block) return bad("address_required");

  const disc = await findDiscount(str(b.discountCode));
  if (str(b.discountCode) && !disc) return bad("invalid_code");
   let selectedProteins: any[] = [];
let selectedCarbs: any[] = [];
  if (subscriptionType === "packages") {
    [opt] = await db
      .select()
      .from(packageOptions)
      .where(and(eq(packageOptions.id, Number(b.optionId)), eq(packageOptions.active, true)));
    if (!opt) return bad("invalid_input");
    [pkg] = await db
      .select()
      .from(packages)
      .where(and(eq(packages.id, opt.packageId), eq(packages.active, true)));
    if (!pkg) return bad("invalid_input");

    const addonIds: number[] = Array.isArray(b.addonIds) ? b.addonIds.map(Number).filter(Number.isFinite) : [];
    const chosen = addonIds.length
      ? await db.select().from(addons).where(and(inArray(addons.id, addonIds), eq(addons.active, true)))
      : [];

    pricing = computePricing({
      price5: opt.price5,
      days,
      addons: chosen,
      regionFee: region.fee,
      discount: disc ? { type: disc.type, value: disc.value } : null,
    });
  } else {
    // حساب أسعار "طلبات من اختيارك"
    customDetails = b.customDetails;
    if (
      !customDetails ||
      !Array.isArray(customDetails.proteinIds) ||
      customDetails.proteinIds.length === 0 ||
      !Array.isArray(customDetails.carbIds) ||
      customDetails.carbIds.length === 0
    ) {
      return bad("invalid_input");
    }

    // جلب جدول preferredproteins بدلاً من customMealOptions للبروتينات
    const preferredProts = await db.select().from(preferredProteins).where(eq(preferredProteins.active, true));
    const customOpts = await db.select().from(customMealOptions).where(eq(customMealOptions.active, true));

    const rawProteinIds: number[] = customDetails.proteinIds.map(Number).filter(Number.isFinite);
    const rawCarbIds: number[] = customDetails.carbIds.map(Number).filter(Number.isFinite);

    if (rawProteinIds.length === 0 || rawCarbIds.length === 0) return bad("invalid_input");

    const proteinCounts: Record<number, number> = {};
    rawProteinIds.forEach((id) => {
      proteinCounts[id] = (proteinCounts[id] || 0) + 1;
    });

    const selectedProtsWithQty = Object.entries(proteinCounts).map(([idStr, qty]) => {
      const pObj = preferredProts.find((p) => p.id === Number(idStr));
      return { pObj, qty };
    }).filter((x) => x.pObj !== undefined);

    if (selectedProtsWithQty.length === 0) return bad("invalid_input");

    selectedCarbs = customOpts.filter((o) => rawCarbIds.includes(o.id));
    const packagingOpt = customOpts.find((o) => o.id === Number(customDetails.packagingId));
    const sideAddons = customOpts.filter((o) => Array.isArray(customDetails.sideAddonIds) && customDetails.sideAddonIds.includes(o.id));

    let totalProteinsExtraPrice = 0;
    selectedProtsWithQty.forEach(({ pObj, qty }) => {
      if (!pObj) return;
      if (pObj.freePolicy === "one_time_free") {
        if (qty > 1) {
          totalProteinsExtraPrice += (qty - 1) * Number(pObj.extraPrice || 0);
        }
      } else if (pObj.freePolicy === "always_free") {
        totalProteinsExtraPrice += 0;
      }
    });

    const baseMealRate = 1.500;
    const carbExtra = selectedCarbs.reduce((sum, c) => sum + Number(c.price || 0), 0);
    const packagingExtra = packagingOpt ? Number(packagingOpt.price || 0) : 0;

    const dailyMealsCount = Number(customDetails.dailyMeals || 3);
    const singleMealBasePrice = baseMealRate + carbExtra + packagingExtra;
    const mealsBaseTotal = (singleMealBasePrice * dailyMealsCount * days) + (totalProteinsExtraPrice * days);

    const sidesDailyPrice = sideAddons.reduce((sum, s) => sum + Number(s.price), 0);
    const sidesTotal = sidesDailyPrice * days;

    const subtotal = mealsBaseTotal + sidesTotal;
    let discountAmount = 0;
    if (disc) {
      if (disc.type === "percent") discountAmount = (subtotal * disc.value) / 100;
      else if (disc.type === "fixed") discountAmount = disc.value;
    }

    const total = Math.max(0, subtotal - discountAmount + region.fee);

    pricing = {
      subtotal,
      discount: discountAmount,
      deliveryFee: region.fee,
      total,
      addonsTotal: sidesTotal,
    };
  }

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

      const subValues = subscriptionType === "packages" ? {
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
        addons: [],
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
      } : {
        customerId,
        packageId: null,
        optionId: null,
        packageAr: "طلبات من اختيارك (مخصص)",
        packageEn: "Custom Built Meal",
        optionAr: `بروتين مخصص - ${customDetails.dailyMeals} وجبات يومياً`,
        optionEn: `Custom Protein - ${customDetails.dailyMeals} meals daily`,
        protein: selectedProtsWithQty.map(({ pObj, qty }) => `${pObj?.nameAr} (${qty})`).join('، '),
        carbs: selectedCarbs.map(c => c.nameAr).join('، '),
        mealsPerDay: dailyMealsCount,
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
        addons: [],
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
      };

      const [sub] = await tx
        .insert(subscriptions)
        .values(subValues as any)
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