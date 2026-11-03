import { and, asc, eq, gte, isNull, lte, or } from "drizzle-orm";
import { db } from "@/db";
import {
  addons,
  carouselImages,
  customMealOptions, // 👈 1. استيراد جدول الخيارات المخصصة
  deliverySlots,
  packageOptions,
  packages,
  paymentMethods,
  popups,
  regions,
  settings,
} from "@/db/schema";
import { SETTING_DEFAULTS } from "./settingsFields";
import { todayBH } from "./dates";

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await db.select().from(settings);
  const out = { ...SETTING_DEFAULTS };
  for (const r of rows) out[r.key] = r.value;
  return out;
}

export async function getCatalog() {
  const [pk, opts, ad, sl, rg, pm, st, cm] = await Promise.all([
    db.select().from(packages).where(eq(packages.active, true)).orderBy(asc(packages.sortOrder), asc(packages.id)),
    db.select().from(packageOptions).where(eq(packageOptions.active, true)).orderBy(asc(packageOptions.sortOrder), asc(packageOptions.id)),
    db.select().from(addons).where(eq(addons.active, true)).orderBy(asc(addons.sortOrder), asc(addons.id)),
    db.select().from(deliverySlots).where(eq(deliverySlots.active, true)).orderBy(asc(deliverySlots.startTime), asc(deliverySlots.id)),
    db.select().from(regions).where(eq(regions.active, true)).orderBy(asc(regions.sortOrder), asc(regions.id)),
    db.select().from(paymentMethods).where(eq(paymentMethods.active, true)).orderBy(asc(paymentMethods.sortOrder), asc(paymentMethods.id)),
    getSettings(),
    db.select().from(customMealOptions).where(eq(customMealOptions.active, true)).orderBy(asc(customMealOptions.sortOrder), asc(customMealOptions.id)), // 👈 2. جلب الخيارات المخصصة الفعالة
  ]);

  return {
    packages: pk.map((p) => ({ ...p, options: opts.filter((o) => o.packageId === p.id) })),
    addons: ad,
    slots: sl,
    regions: rg,
    methods: pm,
    settings: st,
    customMeals: cm, // 👈 3. إضافتها كحقل داخل الكتالوج لاستخدامه في استمارة التسجيل
  };
}

export type Catalog = Awaited<ReturnType<typeof getCatalog>>;

export async function getCarousel() {
  return db
    .select()
    .from(carouselImages)
    .where(eq(carouselImages.active, true))
    .orderBy(asc(carouselImages.sortOrder), asc(carouselImages.id));
}

export async function getActivePopups() {
  const today = todayBH();
  return db
    .select()
    .from(popups)
    .where(
      and(
        eq(popups.active, true),
        or(isNull(popups.startDate), lte(popups.startDate, today)),
        or(isNull(popups.endDate), gte(popups.endDate, today)),
      ),
    )
    .orderBy(asc(popups.id));
}