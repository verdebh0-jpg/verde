"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "./LocaleProvider";
import { ALERT_MS, STATUSES } from "@/lib/config";
import { addDays, fmtTime } from "@/lib/dates";

type Order = {
  id: number;
  deliveryDate: string;
  dayNumber: number;
  status: string;
  customerName: string;
  phone: string;
  house: string;
  flat: string;
  road: string;
  block: string;
  regionAr: string;
  regionEn: string;
  packageAr: string;
  packageEn: string;
  optionAr: string;
  optionEn: string;
  mealsPerDay: number;
  days: number;
  addons: { id: number; nameAr: string; nameEn: string }[];
  unwanted: string;
  allergy: string;
  slotId: number;
  slotGroupAr: string;
  slotGroupEn: string;
  slotStart: string;
  slotEnd: string;
};
type Pending = { id: number; customerName: string; slotStart: string; slotEnd: string; status: string };
type Toast = { key: string; p: Pending };

const COLORS: Record<string, string> = {
  not_ready: "bg-red-100 text-red-800",
  preparing: "bg-amber-100 text-amber-800",
  ready: "bg-sky text-verde",
  out_for_delivery: "bg-emerald-200 text-emerald-900",
};

export default function OrdersBoard({ initialDate }: { initialDate: string }) {
  const { t, p, locale } = useLocale();
  const [today, setToday] = useState(initialDate);
  const [date, setDate] = useState(initialDate);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [view, setView] = useState<"individual" | "batch">("individual");
  const [soundOn, setSoundOn] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [msg, setMsg] = useState("");
  const lastAlert = useRef<Map<number, number>>(new Map());
  const audio = useRef<AudioContext | null>(null);
  const pendingRef = useRef<Pending[]>([]);

  const load = useCallback(async () => {
    const r = await fetch(`/api/orders?date=${date}`, { cache: "no-store" });
    if (!r.ok) return;
    const d = await r.json();
    setOrders(d.orders);
    setPending(d.pending);
    setToday(d.today);
  }, [date]);

  useEffect(() => {
    load();
    const i = setInterval(load, 10000);
    return () => clearInterval(i);
  }, [load]);

  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  const beep = useCallback(() => {
    const ctx = audio.current;
    if (!ctx) return;
    [0, 0.28, 0.56].forEach((d) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      o.connect(g);
      g.connect(ctx.destination);
      const t0 = ctx.currentTime + d;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.4, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);
      o.start(t0);
      o.stop(t0 + 0.22);
    });
  }, []);

  // Alert every 3 minutes for each order not yet "out for delivery"
  useEffect(() => {
    const i = setInterval(() => {
      const now = Date.now();
      const list = pendingRef.current;
      const ids = new Set(list.map((x) => x.id));
      const ring: Pending[] = [];
      for (const o of list) {
        const last = lastAlert.current.get(o.id);
        if (last === undefined) {
          lastAlert.current.set(o.id, now);
        } else if (now - last >= ALERT_MS) {
          ring.push(o);
          lastAlert.current.set(o.id, now);
        }
      }
      for (const k of [...lastAlert.current.keys()]) if (!ids.has(k)) lastAlert.current.delete(k);
      setToasts((prev) => {
        const ringIds = new Set(ring.map((x) => x.id));
        return [
          ...ring.map((x) => ({ key: `${x.id}-${now}`, p: x })),
          ...prev.filter((x) => ids.has(x.p.id) && !ringIds.has(x.p.id)),
        ].slice(0, 40);
      });
      if (ring.length) beep();
    }, 1000);
    return () => clearInterval(i);
  }, [beep]);

  // drop toasts for orders that are no longer pending
  useEffect(() => {
    const ids = new Set(pending.map((x) => x.id));
    setToasts((prev) => prev.filter((x) => ids.has(x.p.id)));
  }, [pending]);

  async function enableSound() {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audio.current = new AC();
    await audio.current.resume();
    setSoundOn(true);
    beep();
  }

  async function advance(o: Order) {
    const next = STATUSES[STATUSES.indexOf(o.status as (typeof STATUSES)[number]) + 1];
    if (!next) return;
    const r = await fetch(`/api/orders/${o.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setMsg(t("err_" + (d.error ?? "server_error")));
    }
    load();
  }

  async function advanceAll(list: Order[]) {
    await Promise.all(list.filter((o) => o.status !== "out_for_delivery").map(advance));
  }

  const groups = useMemo(() => {
    const m = new Map<string, { key: string; ar: string; en: string; start: string; end: string; orders: Order[] }>();
    for (const o of orders) {
      const key = `${o.slotStart}-${o.slotEnd}`;
      const g = m.get(key) ?? { key, ar: o.slotGroupAr, en: o.slotGroupEn, start: o.slotStart, end: o.slotEnd, orders: [] };
      g.orders.push(o);
      m.set(key, g);
    }
    return [...m.values()].sort((a, b) => a.start.localeCompare(b.start));
  }, [orders]);

  const ringing = new Set(toasts.map((x) => x.p.id));
  const addr = (o: Order) =>
    `${t("houseBuilding")} ${o.house}${o.flat ? `, ${t("flat")} ${o.flat}` : ""}, ${t("road")} ${o.road}, ${t("block")} ${o.block} — ${p(o.regionAr, o.regionEn)}`;
  const addonText = (o: Order) => o.addons.map((a) => p(a.nameAr, a.nameEn)).join(", ");
  const status = (s: string) => (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${COLORS[s] ?? ""}`}>{t("st_" + s)}</span>
  );

  return (
    <div className="space-y-5">
      {/* Alerts */}
      {toasts.length > 0 && (
        <div className="fixed inset-x-3 top-3 z-[60] mx-auto max-h-[60vh] max-w-md space-y-2 overflow-auto">
          {toasts.map((x) => (
            <div key={x.key} className="flex items-start gap-3 rounded-2xl border-2 border-red-500 bg-white p-3 shadow-xl">
              <span className="text-2xl">⏰</span>
              <div className="flex-1 text-sm">
                <p className="font-bold text-red-700">{t("alertTitle")}</p>
                <p>
                  #{x.p.id} · {x.p.customerName} · <span dir="ltr">{fmtTime(x.p.slotStart, locale)} – {fmtTime(x.p.slotEnd, locale)}</span>
                </p>
                <p className="text-slate-500">{t("st_" + x.p.status)}</p>
              </div>
              <button className="text-slate-400 hover:text-slate-700" onClick={() => setToasts((s) => s.filter((y) => y.key !== x.key))}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="card flex flex-wrap items-center gap-3">
        <button className="btn btn-outline !px-3 !py-1.5" onClick={() => setDate(addDays(date, -1))}>
          {locale === "ar" ? "›" : "‹"}
        </button>
        <input type="date" className="input !w-auto" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        <button className="btn btn-outline !px-3 !py-1.5" onClick={() => setDate(addDays(date, 1))}>
          {locale === "ar" ? "‹" : "›"}
        </button>
        <button className="btn btn-sky !py-1.5" onClick={() => setDate(today)}>
          {t("today")}
        </button>
        <div className="mx-2 h-6 w-px bg-slate-200" />
        <div className="flex overflow-hidden rounded-full border border-verde/30 text-sm font-semibold">
          {(["individual", "batch"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className={`px-4 py-1.5 ${view === v ? "bg-verde text-white" : "text-verde"}`}>
              {t("view_" + v)}
            </button>
          ))}
        </div>
        <div className="ms-auto flex items-center gap-3">
          <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-bold text-red-700">
            {t("pendingToday")}: {pending.length}
          </span>
          <button className={`btn !py-1.5 text-sm ${soundOn ? "btn-sky" : "btn-primary"}`} onClick={enableSound}>
            🔔 {soundOn ? t("soundOn") : t("enableSound")}
          </button>
        </div>
      </div>
      {msg && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{msg}</p>}
      <p className="text-xs text-sage">{t("alertHint")}</p>

      {!groups.length && <div className="card py-10 text-center text-slate-400">{t("noOrders")}</div>}

      {groups.map((g) => {
        const meals = g.orders.reduce((s, o) => s + o.mealsPerDay, 0);
        const agg = new Map<string, number>();
        const addAgg = new Map<string, number>();
        for (const o of g.orders) {
          const k = `${p(o.packageAr, o.packageEn)} — ${p(o.optionAr, o.optionEn)}`;
          agg.set(k, (agg.get(k) ?? 0) + 1);
          for (const a of o.addons) {
            const ak = p(a.nameAr, a.nameEn);
            addAgg.set(ak, (addAgg.get(ak) ?? 0) + 1);
          }
        }
        return (
          <section key={g.key} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-verde px-5 py-3 text-white">
              <div>
                <p className="text-sm text-sky">{p(g.ar, g.en)}</p>
                <h2 className="font-display text-2xl font-bold" dir="ltr">
                  {fmtTime(g.start, locale)} – {fmtTime(g.end, locale)}
                </h2>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span>
                  {g.orders.length} {t("ordersCount")} · {meals} {t("mealsCount")}
                </span>
                <button className="btn btn-sky !py-1.5 text-sm" onClick={() => advanceAll(g.orders)}>
                  {t("advanceAll")}
                </button>
              </div>
            </div>

            {view === "batch" && (
              <div className="card grid gap-5 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 font-bold text-verde">{t("mealsSummary")}</h3>
                  <ul className="space-y-1 text-sm">
                    {[...agg.entries()].map(([k, n]) => (
                      <li key={k} className="flex justify-between border-b py-1">
                        <span>{k}</span>
                        <b>× {n}</b>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 font-bold text-verde">{t("addonsTitle")}</h3>
                  <ul className="space-y-1 text-sm">
                    {[...addAgg.entries()].map(([k, n]) => (
                      <li key={k} className="flex justify-between border-b py-1">
                        <span>{k}</span>
                        <b>× {n}</b>
                      </li>
                    ))}
                    {!addAgg.size && <li className="text-slate-400">—</li>}
                  </ul>
                </div>
                <div className="overflow-x-auto md:col-span-2">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-sage">
                        {["#", "name", "mealPlan", "addonsTitle", "unwanted", "allergy", "status"].map((h) => (
                          <th key={h} className="px-2 py-1 text-start">
                            {h === "#" ? "#" : t(h)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {g.orders.map((o) => (
                        <tr key={o.id} className={`border-b ${ringing.has(o.id) ? "bg-red-50" : ""}`}>
                          <td className="px-2 py-1">{o.id}</td>
                          <td className="px-2 py-1 font-semibold">{o.customerName}</td>
                          <td className="px-2 py-1">
                            {p(o.optionAr, o.optionEn)}
                          </td>
                          <td className="px-2 py-1">{addonText(o) || "—"}</td>
                          <td className="px-2 py-1">{o.unwanted || "—"}</td>
                          <td className="px-2 py-1">{o.allergy || "—"}</td>
                          <td className="px-2 py-1">{status(o.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {view === "individual" && (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {g.orders.map((o) => {
                  const done = o.status === "out_for_delivery";
                  const next = STATUSES[STATUSES.indexOf(o.status as (typeof STATUSES)[number]) + 1];
                  return (
                    <article key={o.id} className={`card space-y-2 border-2 ${ringing.has(o.id) ? "ringing" : ""}`}>
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-verde">
                          #{o.id} · {o.customerName}
                        </h3>
                        {status(o.status)}
                      </div>
                      <p className="text-sm font-semibold">
                        {p(o.packageAr, o.packageEn)} — {p(o.optionAr, o.optionEn)}
                      </p>
                      <p className="text-xs text-sage">
                        {t("day")} {o.dayNumber}/{o.days}
                      </p>
                      <p className="text-sm">
                        <b>{t("addonsTitle")}:</b> {addonText(o) || "—"}
                      </p>
                      <p className="text-sm">
                        <b>{t("unwanted")}:</b> {o.unwanted || "—"}
                      </p>
                      <p className="text-sm">
                        <b>{t("allergy")}:</b> {o.allergy || "—"}
                      </p>
                      <p className="text-sm">
                        <b>{t("deliveryAddress")}:</b> {addr(o)}
                      </p>
                      <p className="text-sm" dir="ltr">
                        📞 {o.phone}
                      </p>
                      {done ? (
                        <p className="rounded-xl bg-emerald-50 p-2 text-center text-sm font-semibold text-emerald-800">🔒 {t("lockedNote")}</p>
                      ) : (
                        <button className="btn btn-primary w-full !py-2" onClick={() => advance(o)}>
                          {t("markAs")}: {t("st_" + next)}
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
