import { count } from "drizzle-orm";
import { db } from "@/db";
import {
  addons,
  carouselImages,
  deliverySlots,
  packageOptions,
  packages,
  paymentMethods,
  regions,
  settings,
  staff,
} from "@/db/schema";
import { hashPassword } from "./auth";
import { SETTING_DEFAULTS } from "./settingsFields";

let seeded: Promise<void> | null = null;

export function ensureSeed(): Promise<void> {
  if (!seeded) {
    seeded = run().catch((e) => {
      seeded = null;
      throw e;
    });
  }
  return seeded;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function isEmpty(table: any) {
  const [r] = await db.select({ n: count() }).from(table);
  return Number(r.n) === 0;
}

async function run() {
  // Staff: owner + kitchen (created only if missing; never overwritten)
  const existing = await db.select({ u: staff.username }).from(staff);
  const names = new Set(existing.map((e) => e.u));
  if (!names.has("mahmod")) {
    await db.insert(staff).values({
      username: "mahmod",
      name: "Mahmod",
      passwordHash: hashPassword("Verde@123"),
      role: "owner",
      isProtected: true,
    });
  }
  if (!names.has("kitchen")) {
    await db.insert(staff).values({
      username: "kitchen",
      name: "Kitchen",
      passwordHash: hashPassword("12345678"),
      role: "kitchen",
    });
  }

  // Settings defaults
  await db
    .insert(settings)
    .values(Object.entries(SETTING_DEFAULTS).map(([key, value]) => ({ key, value })))
    .onConflictDoNothing();

  if (await isEmpty(packages)) {
    const defs = [
      { ar: "خطة زيادة الوزن", en: "Gain Weight Meal Plan", p: 150, c: 150, prices: [95, 75, 50], descAr: "بروتين 150 / كارب 150", descEn: "Protein 150 / Carbs 150" },
      { ar: "خطة المحافظة على الوزن", en: "Maintain Meal Plan", p: 120, c: 150, prices: [90, 70, 42], descAr: "بروتين 120 / كارب 150", descEn: "Protein 120 / Carbs 150" },
      { ar: "خطة خسارة الوزن", en: "Lose Weight Meal Plan", p: 100, c: 100, prices: [85, 65, 40], descAr: "بروتين 100 / كارب 100", descEn: "Protein 100 / Carbs 100" },
    ];
    for (let i = 0; i < defs.length; i++) {
      const d = defs[i];
      const [pkg] = await db
        .insert(packages)
        .values({ nameAr: d.ar, nameEn: d.en, protein: d.p, carbs: d.c, descAr: d.descAr, descEn: d.descEn, sortOrder: i })
        .returning({ id: packages.id });
      const labels = [
        ["3 وجبات + سلطة", "3 meals + salad", 3],
        ["وجبتان + سلطة", "2 meals + salad", 2],
        ["وجبة + سلطة", "1 meal + salad", 1],
      ] as const;
      await db.insert(packageOptions).values(
        labels.map((l, j) => ({
          packageId: pkg.id,
          labelAr: l[0],
          labelEn: l[1],
          mealsPerDay: l[2],
          price5: d.prices[j],
          sortOrder: j,
        })),
      );
    }
  }

  if (await isEmpty(addons)) {
    await db.insert(addons).values([
      { nameAr: "بروتين إضافي", nameEn: "Extra protein", price: 1, pricingType: "per_day", sortOrder: 0 },
      { nameAr: "كارب إضافي", nameEn: "Extra carbs", price: 0.5, pricingType: "per_day", sortOrder: 1 },
      { nameAr: "سناك", nameEn: "Snack", price: 0.8, pricingType: "per_day", sortOrder: 2 },
    ]);
  }

  if (await isEmpty(deliverySlots)) {
    const p1 = ["الفترة الأولى (الظهر)", "Period 1 (Noon)"];
    const p2 = ["الفترة الثانية (المساء)", "Period 2 (Evening)"];
    const rows: [string[], string, string][] = [
      [p1, "12:30", "13:30"],
      [p1, "13:30", "14:30"],
      [p1, "14:30", "15:00"],
      [p2, "16:30", "17:30"],
      [p2, "17:30", "18:30"],
      [p2, "18:30", "19:30"],
    ];
    await db.insert(deliverySlots).values(
      rows.map((r, i) => ({ groupAr: r[0][0], groupEn: r[0][1], startTime: r[1], endTime: r[2], sortOrder: i })),
    );
  }

  if (await isEmpty(regions)) {
    const list: [string, string][] = [
      ["المنامة", "Manama"], ["المحرق", "Muharraq"], ["الرفاع", "Riffa"], ["مدينة عيسى", "Isa Town"],
      ["مدينة حمد", "Hamad Town"], ["سترة", "Sitra"], ["البديع", "Budaiya"], ["سار", "Saar"],
      ["الجفير", "Juffair"], ["السيف", "Seef"], ["العدلية", "Adliya"], ["جزر أمواج", "Amwaj Islands"],
      ["البسيتين", "Busaiteen"], ["جدحفص", "Jidhafs"], ["سند", "Sanad"], ["الزلاق", "Zallaq"],
      ["ديار المحرق", "Diyar Al Muharraq"], ["توبلي", "Tubli"], ["سلماباد", "Salmabad"], ["عالي", "Aali"],
    ];
    await db.insert(regions).values(list.map((r, i) => ({ nameAr: r[0], nameEn: r[1], sortOrder: i })));
  }

  if (await isEmpty(paymentMethods)) {
    await db.insert(paymentMethods).values([
      { key: "benefitpay", nameAr: "بنفت بي", nameEn: "BenefitPay", sortOrder: 0 },
      { key: "card", nameAr: "البطاقة البنكية", nameEn: "Bank Card", sortOrder: 1 },
      { key: "cash", nameAr: "الدفع النقدي عند التسليم", nameEn: "Cash on Delivery", sortOrder: 2 },
    ]);
  }

  if (await isEmpty(carouselImages)) {
    const caps: [string, string][] = [
      ["سلطة دجاج طازجة", "Fresh chicken salad"],
      ["دجاج مع الخضار", "Chicken with vegetables"],
      ["وجبة صحية جاهزة", "Healthy meal box"],
      ["أطباق متوسطية", "Mediterranean bowls"],
      ["وعاء الدجاج والخضار", "Chicken & veggie bowl"],
      ["سلطة ملوّنة مع الأرز", "Colorful rice salad bowl"],
    ];
    await db.insert(carouselImages).values(
      caps.map((c, i) => ({ image: `/dishes/d${i + 1}.jpg`, captionAr: c[0], captionEn: c[1], sortOrder: i })),
    );
  }
}
