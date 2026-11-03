"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "./LocaleProvider";
import type { Catalog } from "@/lib/data";
import { computePricing } from "@/lib/pricing";
import { fmtMoney, fmtTime } from "@/lib/dates";
const FOOD_ITEMS_OPTIONS = [
  // البروتينات (Proteins)
  { id: "chicken", nameAr: "دجاج", nameEn: "Chicken", category: "protein" },
  { id: "beef", nameAr: "لحم بقري", nameEn: "Beef", category: "protein" },
  { id: "salmon", nameAr: "سالمون", nameEn: "Salmon", category: "protein" },
  { id: "shrimp", nameAr: "روبيان", nameEn: "Shrimp", category: "protein" },
  { id: "tuna", nameAr: "تونا", nameEn: "Tuna", category: "protein" },
  { id: "white_fish", nameAr: "سمك أبيض", nameEn: "White Fish", category: "protein" },
  { id: "turkey", nameAr: "ديك رومي", nameEn: "Turkey", category: "protein" },
  { id: "egg", nameAr: "بيض", nameEn: "Egg", category: "protein" },
  { id: "halloumi", nameAr: "حلومي", nameEn: "Halloumi", category: "protein" },

  // الكاربوهيدرات (Carbs)
  { id: "rice", nameAr: "أرز", nameEn: "Rice", category: "carb" },
  { id: "potatoes", nameAr: "بطاطس", nameEn: "Potatoes", category: "carb" },
  { id: "sweet_potatoes", nameAr: "بطاطس حلوة", nameEn: "Sweet Potatoes", category: "carb" },
  { id: "pasta", nameAr: "باستا", nameEn: "Pasta", category: "carb" },
  { id: "bread", nameAr: "خبز", nameEn: "Bread", category: "carb" },
  { id: "tortilla_bread", nameAr: "خبز تورتيلا", nameEn: "Tortilla Bread", category: "carb" },
];
type Profile = {
  name: string;
  weight: string;
  height: string;
  unwanted: string;
  allergy: string;
  house: string;
  flat: string;
  road: string;
  block: string;
  regionId: number | null;
};

export default function RegisterForm({
  catalog,
  customer,
  initial,
  minStart,
}: {
  catalog: Catalog;
  customer: Profile | null;
  initial?: { optionId?: number; slotId?: number; regionId?: number; addonIds?: number[]; days?: number };
  minStart: string;
}) {
  const { t, l, p, locale } = useLocale();
  const router = useRouter();
   const [selectedUnwanted, setSelectedUnwanted] = useState<string[]>([]);
  const toggleUnwanted = (label: string) => {
    setSelectedUnwanted((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };
  // نوع الاشتراك: باقات جاهزة أو طلبات من اختيارك
  const [subscriptionType, setSubscriptionType] = useState<"packages" | "custom">("packages");

  // حالة الباقات العادية
  const [optionId, setOptionId] = useState<number | null>(initial?.optionId ?? null);
  const [days, setDays] = useState(initial?.days ?? 30);

  // حالة "طلبات من اختيارك" (الـ 6 خطوات)
  const [customProteinGrams, setCustomProteinGrams] = useState<string>("150g");
  const [customDailyMeals, setCustomDailyMeals] = useState<number>(3);
  const [customDays, setCustomDays] = useState<number>(30); // 30, 28, 24, 20
  const [selectedProteinId, setSelectedProteinId] = useState<number | null>(null);
  const [selectedCarbId, setSelectedCarbId] = useState<number | null>(null);
  const [selectedPackagingId, setSelectedPackagingId] = useState<number | null>(null);
  const [customAddonIds, setCustomAddonIds] = useState<number[]>([]);

  // البيانات العامة
  const [startDate, setStartDate] = useState(minStart);
  const [addonIds, setAddonIds] = useState<number[]>(initial?.addonIds ?? []);
  const [slotId, setSlotId] = useState<number | null>(initial?.slotId ?? null);
  const [regionId, setRegionId] = useState<string>(String(initial?.regionId ?? customer?.regionId ?? ""));
  const [f, setF] = useState({
    name: customer?.name ?? "",
    email: "",
    phone: "",
    password: "",
    unwanted: customer?.unwanted ?? "",
    allergy: customer?.allergy ?? "",
    weight: customer?.weight ?? "",
    height: customer?.height ?? "",
    house: customer?.house ?? "",
    flat: customer?.flat ?? "",
    road: customer?.road ?? "",
    block: customer?.block ?? "",
  });

  const [code, setCode] = useState("");
  const [disc, setDisc] = useState<{ code: string; type: string; value: number } | null>(null);
  const [codeMsg, setCodeMsg] = useState("");
  const [method, setMethod] = useState(catalog.methods[0]?.key ?? "");
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "", holder: "" });
  const [bp, setBp] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const setField = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));

  // خيارات جدول custom_meal_options مقسمة حسب الفئات
  const customMealsList = catalog.customMeals || [];
  const proteinOptions = useMemo(() => customMealsList.filter((m) => m.category === "protein"), [customMealsList]);
  const carbOptions = useMemo(() => customMealsList.filter((m) => m.category === "carb"), [customMealsList]);
  const packagingOptions = useMemo(() => customMealsList.filter((m) => m.category === "packaging"), [customMealsList]);
  const sideAddonsList = useMemo(() => customMealsList.filter((m) => m.category === "side"), [customMealsList]);

 // حساب أسعار "طلبات من اختيارك" بناءً على الجدول التفصيلي للوزن وعدد الوجبات يومياً
  const customPricing = useMemo(() => {
    if (subscriptionType !== "custom") return null;

    // تحديد سعر القاعدة بناءً على الوزن وعدد الوجبات في اليوم
    let baseMealRate = 1.500; // قيمة افتراضية احتياطية

    if (customProteinGrams === "100g") {
      if (customDailyMeals === 1) baseMealRate = 2.000;
      else if (customDailyMeals === 2) baseMealRate = 1.625;
      else if (customDailyMeals === 3) baseMealRate = 1.416;
      else if (customDailyMeals === 4) baseMealRate = 1.350;
      else if (customDailyMeals === 5) baseMealRate = 1.300;
      else if (customDailyMeals >= 6) baseMealRate = 1.250;
    } else if (customProteinGrams === "150g") {
      if (customDailyMeals === 1) baseMealRate = 2.500;
      else if (customDailyMeals === 2) baseMealRate = 1.875;
      else if (customDailyMeals === 3) baseMealRate = 1.583;
      else if (customDailyMeals === 4) baseMealRate = 1.500;
      else if (customDailyMeals === 5) baseMealRate = 1.450;
      else if (customDailyMeals >= 6) baseMealRate = 1.400;
    } else if (customProteinGrams === "200g") {
      if (customDailyMeals === 1) baseMealRate = 2.900;
      else if (customDailyMeals === 2) baseMealRate = 2.125;
      else if (customDailyMeals === 3) baseMealRate = 1.740;
      else if (customDailyMeals === 4) baseMealRate = 1.650;
      else if (customDailyMeals === 5) baseMealRate = 1.600;
      else if (customDailyMeals >= 6) baseMealRate = 1.550;
    }

    const proteinExtra = selectedProteinId ? Number(customMealsList.find((m) => m.id === selectedProteinId)?.price || 0) : 0;
    const carbExtra = selectedCarbId ? Number(customMealsList.find((m) => m.id === selectedCarbId)?.price || 0) : 0;
    const packagingExtra = selectedPackagingId ? Number(customMealsList.find((m) => m.id === selectedPackagingId)?.price || 0) : 0;

    const singleMealPrice = baseMealRate + proteinExtra + carbExtra + packagingExtra;
    const dailyTotal = singleMealPrice * customDailyMeals;
    const mealsBaseTotal = dailyTotal * customDays;

    // حساب الإضافات الجانبية ضرب الأيام
    const chosenSides = sideAddonsList.filter((s) => customAddonIds.includes(s.id));
    const sidesDailyPrice = chosenSides.reduce((sum, s) => sum + Number(s.price), 0);
    const sidesTotal = sidesDailyPrice * customDays;

    const regionFee = catalog.regions.find((r) => String(r.id) === regionId)?.fee ?? 0;
    const subtotal = mealsBaseTotal + sidesTotal + regionFee;

    let discountAmount = 0;
    if (disc) {
      if (disc.type === "percent") discountAmount = (subtotal * disc.value) / 100;
      else if (disc.type === "fixed") discountAmount = disc.value;
    }

    const total = Math.max(0, subtotal - discountAmount);

    return {
      singleMealPrice,
      dailyTotal,
      mealsBaseTotal,
      sidesTotal,
      regionFee,
      discountAmount,
      total,
    };
  }, [subscriptionType, customProteinGrams, customDailyMeals, customMealsList, selectedProteinId, selectedCarbId, selectedPackagingId, customDays, customAddonIds, sideAddonsList, regionId, disc, catalog.regions]);

  // حساب الباقات الجاهزة
  const allOptions = useMemo(
    () => catalog.packages.flatMap((pk) => pk.options.map((o) => ({ ...o, pkg: pk }))),
    [catalog],
  );
  const opt = allOptions.find((o) => o.id === optionId) ?? null;
  const region = catalog.regions.find((r) => String(r.id) === regionId) ?? null;
  const chosenAddons = catalog.addons.filter((a) => addonIds.includes(a.id));
  const pricing = opt
    ? computePricing({ price5: opt.price5, days, addons: chosenAddons, regionFee: region?.fee ?? 0, discount: disc })
    : null;

  const slotGroups = useMemo(() => {
    const m = new Map<string, typeof catalog.slots>();
    for (const s of catalog.slots) {
      const k = p(s.groupAr, s.groupEn) || "—";
      m.set(k, [...(m.get(k) ?? []), s]);
    }
    return [...m.entries()];
  }, [catalog.slots, locale, p]);

  async function applyCode() {
    setCodeMsg("");
    if (!code.trim()) {
      setDisc(null);
      return;
    }
    const r = await fetch("/api/discount", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (r.ok) {
      setDisc(await r.json());
      setCodeMsg(t("codeApplied"));
    } else {
      setDisc(null);
      setCodeMsg(t("err_invalid_code"));
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (subscriptionType === "packages" && !opt) return setErr(t("err_choose_plan"));
    if (subscriptionType === "custom" && (!selectedProteinId || !selectedCarbId))
      return setErr("يرجى اختيار نوع البروتين ونوع الكارب لتفصيل وجبتك");
    if (!slotId) return setErr(t("err_choose_slot"));
    if (!regionId) return setErr(t("err_choose_region"));
    if (!f.house || !f.road || !f.block) return setErr(t("err_address_required"));
    if (!customer && (!f.name || !f.email || !f.phone || f.password.length < 6))
      return setErr(t("err_account_required"));
    if (!method) return setErr(t("err_invalid_method"));

    setBusy(true);
    const payload = {
      ...f,
       unwanted: selectedUnwanted.join(", "),
      subscriptionType,
      optionId: subscriptionType === "packages" ? optionId : null,
      days: subscriptionType === "packages" ? days : customDays,
      customDetails: subscriptionType === "custom" ? {
        proteinGrams: customProteinGrams,
        dailyMeals: customDailyMeals,
        proteinId: selectedProteinId,
        carbId: selectedCarbId,
        packagingId: selectedPackagingId,
        sideAddonIds: customAddonIds,
      } : null,
      startDate,
      addonIds: subscriptionType === "packages" ? addonIds : [],
      slotId,
      regionId: Number(regionId),
      discountCode: disc?.code ?? "",
      paymentMethod: method,
      card,
      benefitPhone: bp,
    };

    const r = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setErr(t("err_" + (d.error ?? "server_error")));
    sessionStorage.removeItem("renew_shown");
    router.push("/dashboard?welcome=1");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <div className="rounded-3xl bg-blush p-5 text-center text-verde">
          <p className="font-semibold">{catalog.settings?.form_intro_ar || t("formIntroAr")}</p>
          <p className="text-sm text-sage" dir="ltr">
            {catalog.settings?.form_intro_en || t("formIntroEn")}
          </p>
        </div>

        {/* زر التبديل بين نوع الاشتراك */}
        <div className="flex rounded-2xl bg-white p-1.5 shadow-sm border border-slate-200">
          <button
            type="button"
            onClick={() => setSubscriptionType("packages")}
            className={`flex-1 rounded-xl py-3 text-center text-sm font-bold transition ${
              subscriptionType === "packages" ? "bg-verde text-white shadow-sm" : "text-slate-600 hover:text-verde"
            }`}
          >
            🥗 الباقات الجاهزة
          </button>
          <button
            type="button"
            onClick={() => setSubscriptionType("custom")}
            className={`flex-1 rounded-xl py-3 text-center text-sm font-bold transition ${
              subscriptionType === "custom" ? "bg-verde text-white shadow-sm" : "text-slate-600 hover:text-verde"
            }`}
          >
            🍽️ طلبات من اختيارك (تفصيل الوجبة)
          </button>
        </div>

        {/* 1. قسم الباقات الجاهزة */}
        {subscriptionType === "packages" && (
          <>
            <Section n={1} title={t("mealPlan")}>
              <div className="grid gap-4 md:grid-cols-3">
                {catalog.packages.map((pk) => {
                  const selected = opt?.pkg.id === pk.id;
                  return (
                    <div key={pk.id} className={`rounded-2xl border-2 p-4 transition ${selected ? "border-verde bg-verde/5" : "border-slate-200"}`}>
                      <h3 className="font-display text-xl font-bold text-verde">{p(pk.nameAr, pk.nameEn)}</h3>
                      <p className="mb-3 text-xs text-sage">
                        {t("protein")} {pk.protein} · {t("carbs")} {pk.carbs}
                      </p>
                      <div className="space-y-2">
                        {pk.options.map((o) => (
                          <button
                            type="button"
                            key={o.id}
                            onClick={() => setOptionId(o.id)}
                            className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm transition ${
                              optionId === o.id ? "border-verde bg-verde text-white" : "border-slate-200 hover:border-verde"
                            }`}
                          >
                            <span>{p(o.labelAr, o.labelEn)}</span>
                            <span className="font-bold">{fmtMoney(o.price5)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="label">{t("duration")}</span>
                  <select className="input" value={days} onChange={(e) => setDays(Number(e.target.value))}>
                    {[30, 28, 24, 20, 7, 6, 5].map((d) => (
                      <option key={d} value={d}>
                        {d} {t("days")}
                        {d === 30 ? ` (${t("month")})` : d === 5 ? ` (${t("week")})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="label">{t("startDate")}</span>
                  <input type="date" className="input" min={minStart} value={startDate} onChange={(e) => setStartDate(e.target.value || minStart)} />
                </div>
              </div>
            </Section>

            <Section n={2} title={t("addonsTitle")}>
              {catalog.addons.length === 0 && <p className="text-sm text-slate-400">{t("noAddons")}</p>}
              <div className="grid gap-3 sm:grid-cols-2">
                {catalog.addons.map((a) => (
                  <label key={a.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 has-[:checked]:border-verde has-[:checked]:bg-verde/5">
                    <span className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="h-5 w-5 accent-[#335443]"
                        checked={addonIds.includes(a.id)}
                        onChange={(e) => setAddonIds((s) => (e.target.checked ? [...s, a.id] : s.filter((x) => x !== a.id)))}
                      />
                      {p(a.nameAr, a.nameEn)}
                    </span>
                    <span className="text-sm text-sage">
                      {fmtMoney(a.price)} {t("bd")} / {a.pricingType === "once" ? t("once") : t("perDay")}
                    </span>
                  </label>
                ))}
              </div>
            </Section>
          </>
        )}

        {/* 2. قسم طلبات من اختيارك (الـ 6 خطوات التفاعلية المنظمة) */}
        {subscriptionType === "custom" && (
          <Section n={1} title="طلبات من اختيارك (تفصيل وجبتك الكاملة)">
            <div className="space-y-6">
              
              {/* الخطوة 1: غرامات البروتين */}
              <div className="rounded-2xl border border-slate-200 p-4 bg-white space-y-3">
                <h3 className="font-bold text-verde flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-verde text-white text-xs flex items-center justify-center">1</span>
                  اختر كمية غرامات البروتين للوجبة:
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {(catalog.proteinPrices || [{ weightKey: "100g", price: 1.200 }, { weightKey: "150g", price: 1.500 }, { weightKey: "200g", price: 1.800 }]).map((item) => (
                    <button
                      key={item.weightKey}
                      type="button"
                      onClick={() => setCustomProteinGrams(item.weightKey)}
                      className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                        customProteinGrams === item.weightKey ? "bg-verde text-white border-verde font-bold" : "border-slate-200 hover:border-verde"
                      }`}
                    >
                      <span className="text-base">{item.weightKey}</span>
                      <span className={`text-xs mt-1 ${customProteinGrams === item.weightKey ? "text-white/80" : "text-sage"}`}>
                        {fmtMoney(Number(item.price))} د.ب
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* الخطوة 2: عدد الوجبات يومياً */}
              <div className="rounded-2xl border border-slate-200 p-4 bg-white space-y-3">
                <h3 className="font-bold text-verde flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-verde text-white text-xs flex items-center justify-center">2</span>
                  اختر عدد الوجبات اليومية:
                </h3>
                <div className="grid grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCustomDailyMeals(num)}
                      className={`py-2.5 rounded-xl border font-bold text-sm transition ${
                        customDailyMeals === num ? "bg-verde text-white border-verde" : "border-slate-200 hover:border-verde"
                      }`}
                    >
                      {num} {num === 1 ? "وجبة" : "وجبات"}
                    </button>
                  ))}
                </div>
              </div>

              {/* الخطوة 3: عدد أيام الاشتراك التنازلية (30, 28, 24, 20) */}
              <div className="rounded-2xl border border-slate-200 p-4 bg-white space-y-3">
                <h3 className="font-bold text-verde flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-verde text-white text-xs flex items-center justify-center">3</span>
                  اختر مدة أيام الاشتراك:
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {[30, 28, 24, 20].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setCustomDays(d)}
                      className={`py-3 rounded-xl border font-bold text-sm transition ${
                        customDays === d ? "bg-verde text-white border-verde" : "border-slate-200 hover:border-verde"
                      }`}
                    >
                      {d} يوماً
                    </button>
                  ))}
                </div>
              </div>

              {/* الخطوة 4: نوع البروتين */}
              <div className="rounded-2xl border border-slate-200 p-4 bg-white space-y-3">
                <h3 className="font-bold text-verde flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-verde text-white text-xs flex items-center justify-center">4</span>
                  اختر نوع البروتين الرئيسي:
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {proteinOptions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedProteinId(item.id)}
                      className={`p-3 rounded-xl border text-right transition flex justify-between items-center ${
                        selectedProteinId === item.id ? "bg-verde/10 border-verde text-verde font-bold" : "border-slate-200 hover:border-verde"
                      }`}
                    >
                      <span>{p(item.nameAr, item.nameEn)}</span>
                      {Number(item.price) > 0 && <span className="text-xs text-sage">+{fmtMoney(Number(item.price))}</span>}
                    </button>
                  ))}
                  {!proteinOptions.length && <p className="text-sm text-slate-400 col-span-full">لا توجد خيارات بروتين مضافة بعد من لوحة التحكم</p>}
                </div>
              </div>

              {/* الخطوة 5: نوع الكارب */}
              <div className="rounded-2xl border border-slate-200 p-4 bg-white space-y-3">
                <h3 className="font-bold text-verde flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-verde text-white text-xs flex items-center justify-center">5</span>
                  اختر نوع الكاربوهيدرات:
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {carbOptions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedCarbId(item.id)}
                      className={`p-3 rounded-xl border text-right transition flex justify-between items-center ${
                        selectedCarbId === item.id ? "bg-verde/10 border-verde text-verde font-bold" : "border-slate-200 hover:border-verde"
                      }`}
                    >
                      <span>{p(item.nameAr, item.nameEn)}</span>
                      {Number(item.price) > 0 && <span className="text-xs text-sage">+{fmtMoney(Number(item.price))}</span>}
                    </button>
                  ))}
                  {!carbOptions.length && <p className="text-sm text-slate-400 col-span-full">لا توجد خيارات كارب مضافة بعد من لوحة التحكم</p>}
                </div>
              </div>

              {/* الخطوة 6: التغليف والإضافات الجانبية */}
              <div className="rounded-2xl border border-slate-200 p-4 bg-white space-y-4">
                <h3 className="font-bold text-verde flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-verde text-white text-xs flex items-center justify-center">6</span>
                  التغليف والإضافات الجانبية:
                </h3>

                {/* خيارات التغليف */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-sage">نوع التغليف (Packaging):</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {packagingOptions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedPackagingId(item.id)}
                        className={`p-3 rounded-xl border text-right transition flex justify-between items-center ${
                          selectedPackagingId === item.id ? "bg-verde/10 border-verde text-verde font-bold" : "border-slate-200 hover:border-verde"
                        }`}
                      >
                        <span>{p(item.nameAr, item.nameEn)}</span>
                        <span className="text-xs text-sage">
                          {Number(item.price) > 0 ? `+${fmtMoney(Number(item.price))} د.ب/وجبة` : "مجاني"}
                        </span>
                      </button>
                    ))}
                    {!packagingOptions.length && <p className="text-sm text-slate-400 col-span-full">لا توجد خيارات تغليف مضافة بعد</p>}
                  </div>
                </div>

                {/* الإضافات الجانبية بحساب اليوم */}
                {sideAddonsList.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-xs font-semibold text-sage">إضافات جانبية (يتم حساب سعرها ضرب عدد أيام الاشتراك):</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {sideAddonsList.map((item) => (
                        <label key={item.id} className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-3 has-[:checked]:border-verde has-[:checked]:bg-verde/5">
                          <span className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-[#335443]"
                              checked={customAddonIds.includes(item.id)}
                              onChange={(e) => setCustomAddonIds((s) => (e.target.checked ? [...s, item.id] : s.filter((x) => x !== item.id)))}
                            />
                            {p(item.nameAr, item.nameEn)}
                          </span>
                          <span className="text-xs text-sage">+{fmtMoney(Number(item.price))} د.ب/يوم</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* تاريخ بدء الاشتراك */}
              <div className="pt-2">
                <span className="label">{t("startDate")}</span>
                <input type="date" className="input" min={minStart} value={startDate} onChange={(e) => setStartDate(e.target.value || minStart)} />
              </div>

            </div>
          </Section>
        )}

        {/* 3. البيانات الشخصية */}
        <Section n={subscriptionType === "packages" ? 3 : 2} title={t("yourInfo")}>
          {!customer && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="label">{t("name")} *</span>
                <input className="input" value={f.name} onChange={(e) => setField("name", e.target.value)} />
              </label>
              <label>
                <span className="label">{t("phone")} *</span>
                <input className="input" dir="ltr" inputMode="tel" value={f.phone} onChange={(e) => setField("phone", e.target.value)} />
              </label>
              <label>
                <span className="label">{t("email")} *</span>
                <input className="input" dir="ltr" type="email" value={f.email} onChange={(e) => setField("email", e.target.value)} />
              </label>
              <label>
                <span className="label">{t("password")} * (6+)</span>
                <input className="input" dir="ltr" type="password" value={f.password} onChange={(e) => setField("password", e.target.value)} />
              </label>
            </div>
          )}
          {customer && (
            <p className="text-sm text-sage">
              {t("name")}: <b className="text-verde">{customer.name}</b>
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-2">
  <span className="label font-semibold text-verde">
    {t("unwanted")} (اختياري - يمكنك التحديد أو تركه فارغاً):
  </span>
  <div className="flex flex-wrap gap-2.5 pt-1">
    {FOOD_ITEMS_OPTIONS.map((item) => {
      const labelText = p(item.nameAr, item.nameEn);
      const isSelected = selectedUnwanted.includes(labelText);
      return (
        <button
          key={item.id}
          type="button"
          onClick={() => toggleUnwanted(labelText)}
          className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all ${
            isSelected
              ? "border-verde bg-verde text-white shadow-sm"
              : "border-slate-200 bg-white text-slate-700 hover:border-verde/50"
          }`}
        >
          <span className={`h-4 w-4 rounded-md border flex items-center justify-center text-xs transition ${
            isSelected ? "bg-white text-verde border-white font-bold" : "border-slate-300"
          }`}>
            {isSelected ? "✓" : ""}
          </span>
          {labelText}
        </button>
      );
    })}
  </div>
</div>
            <label>
              <span className="label">{t("allergy")}</span>
              <textarea className="input" rows={2} value={f.allergy} onChange={(e) => setField("allergy", e.target.value)} />
            </label>
            <label>
              <span className="label">{t("weight")} (kg)</span>
              <input className="input" dir="ltr" inputMode="decimal" value={f.weight} onChange={(e) => setField("weight", e.target.value)} />
            </label>
            <label>
              <span className="label">{t("height")} (cm)</span>
              <input className="input" dir="ltr" inputMode="decimal" value={f.height} onChange={(e) => setField("height", e.target.value)} />
            </label>
          </div>
        </Section>

        {/* 4. عنوان التوصيل */}
        <Section n={subscriptionType === "packages" ? 4 : 3} title={t("deliveryAddress")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="label">{t("region")} *</span>
              <select className="input" value={regionId} onChange={(e) => setRegionId(e.target.value)}>
                <option value="">{t("selectRegion")}</option>
                {catalog.regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {p(r.nameAr, r.nameEn)}
                    {r.fee > 0 ? ` (+${fmtMoney(r.fee)} ${t("bd")})` : ""}
                  </option>
                ))}
              </select>
            </label>
            {(
              [
                ["house", "houseBuilding", true],
                ["flat", "flat", false],
                ["road", "road", true],
                ["block", "block", true],
              ] as const
            ).map(([k, label, req]) => (
              <label key={k}>
                <span className="label">
                  {t(label)} {req && "*"}
                </span>
                <input className="input" value={f[k]} onChange={(e) => setField(k, e.target.value)} />
              </label>
            ))}
          </div>
        </Section>

        {/* 5. وقت التوصيل */}
        <Section n={subscriptionType === "packages" ? 5 : 4} title={t("deliveryTime")}>
          <div className="space-y-4">
            {slotGroups.map(([group, slots]) => (
              <div key={group}>
                <p className="mb-2 text-sm font-semibold text-sage">{group}</p>
                <div className="flex flex-wrap gap-2">
                  {slots.map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => setSlotId(s.id)}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        slotId === s.id ? "border-verde bg-verde text-white" : "border-slate-300 hover:border-verde"
                      }`}
                    >
                      <span dir="ltr">
                        {fmtTime(s.startTime, locale)} – {fmtTime(s.endTime, locale)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {!catalog.slots.length && <p className="text-sm text-slate-400">{t("noData")}</p>}
          </div>
        </Section>

        {/* 6. وطرق الدفع */}
        <Section n={subscriptionType === "packages" ? 6 : 5} title={t("payment")}>
          <div className="grid gap-3 sm:grid-cols-3">
            {catalog.methods.map((m) => (
              <button
                type="button"
                key={m.key}
                onClick={() => setMethod(m.key)}
                className={`rounded-2xl border-2 px-4 py-3 text-sm font-semibold transition ${
                  method === m.key ? "border-verde bg-verde/5 text-verde" : "border-slate-200"
                }`}
              >
                {p(m.nameAr, m.nameEn)}
              </button>
            ))}
          </div>
          {!catalog.methods.length && <p className="text-sm text-red-600">{t("noPaymentMethods")}</p>}
          {method === "card" && (
            <div className="grid gap-4 sm:grid-cols-2" dir="ltr">
              <label className="sm:col-span-2">
                <span className="label">{t("cardHolder")}</span>
                <input className="input" autoComplete="cc-name" value={card.holder} onChange={(e) => setCard({ ...card, holder: e.target.value })} />
              </label>
              <label className="sm:col-span-2">
                <span className="label">{t("cardNumber")}</span>
                <input className="input" inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242" value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} />
              </label>
              <label>
                <span className="label">{t("expiry")} (MM/YY)</span>
                <input className="input" autoComplete="cc-exp" placeholder="12/29" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })} />
              </label>
              <label>
                <span className="label">CVV</span>
                <input className="input" inputMode="numeric" autoComplete="cc-csc" value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value })} />
              </label>
            </div>
          )}
          {method === "benefitpay" && (
            <label className="block">
              <span className="label">{t("benefitPhone")}</span>
              <input className="input" dir="ltr" inputMode="tel" value={bp} onChange={(e) => setBp(e.target.value)} />
            </label>
          )}
          {method === "cash" && <p className="rounded-xl bg-sky/30 p-3 text-sm text-verde">{t("cashNote")}</p>}
        </Section>

        <p className="text-center font-semibold text-verde">
          {t("happyAr")} <span className="text-sage" dir="ltr">· {t("happyEn")}</span>
        </p>
      </div>

      {/* شريط ملخص الطلب والإجمالي */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="card space-y-3">
          <h2 className="font-display text-2xl font-bold text-verde">{t("summary")}</h2>

          {/* ملخص الباقات العادية */}
          {subscriptionType === "packages" && (
            <>
              {opt ? (
                <div className="space-y-1 text-sm">
                  <p className="font-bold">{p(opt.pkg.nameAr, opt.pkg.nameEn)}</p>
                  <p className="text-sage">
                    {p(opt.labelAr, opt.labelEn)} · {days} {t("days")}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-400">{t("err_choose_plan")}</p>
              )}
              {pricing && (
                <dl className="space-y-1.5 text-sm">
                  <Row k={t("planCost")} v={pricing.base} />
                  {pricing.addonsTotal > 0 && <Row k={t("addonsTitle")} v={pricing.addonsTotal} />}
                  {pricing.discount > 0 && <Row k={`${t("discount")} (${disc?.code})`} v={-pricing.discount} />}
                  {pricing.deliveryFee > 0 && <Row k={t("deliveryFee")} v={pricing.deliveryFee} />}
                  <div className="flex items-center justify-between border-t pt-3 text-lg font-bold text-verde">
                    <dt>{t("total")}</dt>
                    <dd>
                      {fmtMoney(pricing.total)} {t("bd")}
                    </dd>
                  </div>
                </dl>
              )}
            </>
          )}

          {/* ملخص "طلبات من اختيارك" */}
          {subscriptionType === "custom" && customPricing && (
            <div className="space-y-3">
              <div className="rounded-xl bg-verde/5 p-3 text-xs space-y-1 text-verde">
                <p className="font-bold text-sm">وجبة مخصصة ({customProteinGrams})</p>
                <p>عدد الوجبات: {customDailyMeals} يومياً · لمدة {customDays} يوماً</p>
              </div>
              <dl className="space-y-1.5 text-sm">
                <Row k="مجموع الوجبات الأساسية" v={customPricing.mealsBaseTotal} />
                {customPricing.sidesTotal > 0 && <Row k="الإضافات الجانبية" v={customPricing.sidesTotal} />}
                {customPricing.discountAmount > 0 && <Row k={`${t("discount")} (${disc?.code})`} v={-customPricing.discountAmount} />}
                {customPricing.regionFee > 0 && <Row k={t("deliveryFee")} v={customPricing.regionFee} />}
                <div className="flex items-center justify-between border-t pt-3 text-lg font-bold text-verde">
                  <dt>{t("total")}</dt>
                  <dd>
                    {fmtMoney(customPricing.total)} {t("bd")}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          <div className="flex gap-2">
            <input className="input" dir="ltr" placeholder={t("discountCode")} value={code} onChange={(e) => setCode(e.target.value)} />
            <button type="button" className="btn btn-sky !px-4" onClick={applyCode}>
              {t("apply")}
            </button>
          </div>
          {codeMsg && <p className={`text-sm ${disc ? "text-emerald-700" : "text-red-600"}`}>{codeMsg}</p>}
          {err && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{err}</p>}
          <button className="btn btn-primary w-full !py-3 text-lg" disabled={busy || !catalog.methods.length}>
            {busy ? t("processing") : method === "cash" ? t("confirmSubscription") : t("payAndSubscribe")}
          </button>
        </div>
      </aside>
    </form>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="card space-y-4">
      <h2 className="flex items-center gap-3 font-display text-2xl font-bold text-verde">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky text-base">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ k, v }: { k: string; v: number }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-sage">{k}</dt>
      <dd dir="ltr">{v < 0 ? "-" : ""}{fmtMoney(Math.abs(v))}</dd>
    </div>
  );
}