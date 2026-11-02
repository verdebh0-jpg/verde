"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "./LocaleProvider";
import type { Catalog } from "@/lib/data";
import { computePricing } from "@/lib/pricing";
import { fmtMoney, fmtTime } from "@/lib/dates";

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

  const [optionId, setOptionId] = useState<number | null>(initial?.optionId ?? null);
  const [days, setDays] = useState(initial?.days ?? 30); // 👈 تعديل القيمة الافتراضية لتكون 30 يوم
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog.slots, locale]);

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
    if (!opt) return setErr(t("err_choose_plan"));
    if (!slotId) return setErr(t("err_choose_slot"));
    if (!regionId) return setErr(t("err_choose_region"));
    if (!f.house || !f.road || !f.block) return setErr(t("err_address_required"));
    if (!customer && (!f.name || !f.email || !f.phone || f.password.length < 6))
      return setErr(t("err_account_required"));
    if (!method) return setErr(t("err_invalid_method"));
    setBusy(true);
    const r = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...f,
        optionId,
        days,
        startDate,
        addonIds,
        slotId,
        regionId: Number(regionId),
        discountCode: disc?.code ?? "",
        paymentMethod: method,
        card,
        benefitPhone: bp,
      }),
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
                {/* 👈 تم تحديث خيارات الأيام لتصبح تنازلياً: 30، 28، 24، 20، 7، 6، 5 */}
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

        <Section n={3} title={t("yourInfo")}>
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
            <label>
              <span className="label">{t("unwanted")}</span>
              <textarea className="input" rows={2} value={f.unwanted} onChange={(e) => setField("unwanted", e.target.value)} />
            </label>
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

        <Section n={4} title={t("deliveryAddress")}>
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

        <Section n={5} title={t("deliveryTime")}>
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

        <Section n={6} title={t("payment")}>
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

      {/* Summary */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="card space-y-3">
          <h2 className="font-display text-2xl font-bold text-verde">{t("summary")}</h2>
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