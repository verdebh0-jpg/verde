"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "./LocaleProvider";
import { addDays, fmtMoney } from "@/lib/dates";

type Row = {
  id: number;
  date: string;
  customer: string;
  phone: string;
  packageAr: string;
  packageEn: string;
  optionAr: string;
  optionEn: string;
  days: number;
  method: string;
  status: string;
  reference: string;
  subtotal: number;
  discount: number;
  code: string;
  deliveryFee: number;
  total: number;
};

type Group = "day" | "week" | "month";

function keyOf(date: string, g: Group) {
  if (g === "day") return date;
  if (g === "month") return date.slice(0, 7);
  const wd = (new Date(date + "T00:00:00Z").getUTCDay() + 6) % 7;
  return addDays(date, -wd);
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export default function ReportsClient({ today }: { today: string }) {
  const { t, p, locale } = useLocale();
  const [from, setFrom] = useState(addDays(today, -6));
  const [to, setTo] = useState(today);
  const [group, setGroup] = useState<Group>("day");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/admin/reports?from=${from}&to=${to}`, { cache: "no-store" });
    if (r.ok) setRows((await r.json()).rows);
    setLoading(false);
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const preset = (k: "day" | "week" | "month") => {
    setGroup(k === "day" ? "day" : k);
    setTo(today);
    setFrom(k === "day" ? today : k === "week" ? addDays(today, -6) : today.slice(0, 8) + "01");
    if (k === "week" || k === "month") setGroup("day");
  };

  const summary = useMemo(() => {
    const m = new Map<string, { key: string; count: number; subtotal: number; discount: number; delivery: number; total: number; benefitpay: number; card: number; cash: number }>();
    for (const r of rows) {
      const k = keyOf(r.date, group);
      const g = m.get(k) ?? { key: k, count: 0, subtotal: 0, discount: 0, delivery: 0, total: 0, benefitpay: 0, card: 0, cash: 0 };
      g.count++;
      g.subtotal += r.subtotal;
      g.discount += r.discount;
      g.delivery += r.deliveryFee;
      g.total += r.total;
      if (r.method === "benefitpay" || r.method === "card" || r.method === "cash") g[r.method] += r.total;
      m.set(k, g);
    }
    return [...m.values()].sort((a, b) => a.key.localeCompare(b.key));
  }, [rows, group]);

  const totals = summary.reduce(
    (s, g) => ({ count: s.count + g.count, subtotal: s.subtotal + g.subtotal, discount: s.discount + g.discount, delivery: s.delivery + g.delivery, total: s.total + g.total }),
    { count: 0, subtotal: 0, discount: 0, delivery: 0, total: 0 },
  );

  const summaryExport = () =>
    summary.map((g) => ({
      [t(group === "day" ? "day" : group === "week" ? "weekStart" : "month")]: g.key,
      [t("subscriptionsCount")]: g.count,
      [t("subtotal")]: Number(fmtMoney(g.subtotal)),
      [t("discount")]: Number(fmtMoney(g.discount)),
      [t("deliveryFee")]: Number(fmtMoney(g.delivery)),
      [t("total")]: Number(fmtMoney(g.total)),
      BenefitPay: Number(fmtMoney(g.benefitpay)),
      [t("m_card")]: Number(fmtMoney(g.card)),
      [t("m_cash")]: Number(fmtMoney(g.cash)),
    }));

  const detailExport = () =>
    rows.map((r) => ({
      [t("date")]: r.date,
      [t("customer")]: r.customer,
      [t("phone")]: r.phone,
      [t("mealPlan")]: `${p(r.packageAr, r.packageEn)} — ${p(r.optionAr, r.optionEn)}`,
      [t("days")]: r.days,
      [t("payment")]: t("m_" + (r.method === "benefitpay" ? "benefitpay" : r.method)),
      [t("discountCode")]: r.code,
      [t("subtotal")]: Number(fmtMoney(r.subtotal)),
      [t("discount")]: Number(fmtMoney(r.discount)),
      [t("deliveryFee")]: Number(fmtMoney(r.deliveryFee)),
      [t("total")]: Number(fmtMoney(r.total)),
      Ref: r.reference,
    }));

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryExport()), "Summary");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailExport()), "Details");
    XLSX.writeFile(wb, `verde-sales-${from}_${to}.xlsx`);
  }

  function table(data: Record<string, string | number>[]) {
    if (!data.length) return "";
    const keys = Object.keys(data[0]);
    return `<table><thead><tr>${keys.map((k) => `<th>${esc(k)}</th>`).join("")}</tr></thead><tbody>${data
      .map((r) => `<tr>${keys.map((k) => `<td>${esc(String(r[k]))}</td>`).join("")}</tr>`)
      .join("")}</tbody></table>`;
  }

  function exportPdf() {
    const w = window.open("", "_blank");
    if (!w) return;
    const dir = locale === "ar" ? "rtl" : "ltr";
    w.document.write(`<!doctype html><html dir="${dir}" lang="${locale}"><head><meta charset="utf-8"><title>Verde — ${t("reports")}</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&family=Jost:wght@400;600&display=swap" rel="stylesheet">
<style>body{font-family:Cairo,Jost,sans-serif;color:#1f2d26;padding:24px}h1{color:#335443;margin:0}h2{color:#335443;margin-top:28px}
table{width:100%;border-collapse:collapse;font-size:11px;margin-top:8px}th{background:#335443;color:#fff}th,td{border:1px solid #ccc;padding:5px;text-align:start}
tr:nth-child(even) td{background:#f8edf1}.meta{color:#828677;font-size:12px}</style></head><body>
<h1>verde — ${esc(t("reports"))}</h1><p class="meta">${from} → ${to} · ${esc(t("total"))}: ${fmtMoney(totals.total)} ${esc(t("bd"))} · ${totals.count} ${esc(t("subscriptionsCount"))}</p>
<h2>${esc(t("summary"))}</h2>${table(summaryExport())}<h2>${esc(t("details"))}</h2>${table(detailExport())}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 700);
  }

  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-end gap-3">
        <div className="flex gap-2">
          <button className="btn btn-sky !py-1.5 text-sm" onClick={() => preset("day")}>{t("todayReport")}</button>
          <button className="btn btn-sky !py-1.5 text-sm" onClick={() => preset("week")}>{t("weekReport")}</button>
          <button className="btn btn-sky !py-1.5 text-sm" onClick={() => preset("month")}>{t("monthReport")}</button>
        </div>
        <label>
          <span className="label">{t("from")}</span>
          <input type="date" className="input" value={from} onChange={(e) => e.target.value && setFrom(e.target.value)} />
        </label>
        <label>
          <span className="label">{t("to")}</span>
          <input type="date" className="input" value={to} onChange={(e) => e.target.value && setTo(e.target.value)} />
        </label>
        <label>
          <span className="label">{t("groupBy")}</span>
          <select className="input" value={group} onChange={(e) => setGroup(e.target.value as Group)}>
            <option value="day">{t("daily")}</option>
            <option value="week">{t("weekly")}</option>
            <option value="month">{t("monthly")}</option>
          </select>
        </label>
        <div className="ms-auto flex gap-2">
          <button className="btn btn-primary !py-2" onClick={exportExcel} disabled={!rows.length}>⬇ Excel</button>
          <button className="btn btn-primary !py-2" onClick={exportPdf} disabled={!rows.length}>⬇ PDF</button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          [t("total"), `${fmtMoney(totals.total)} ${t("bd")}`],
          [t("subscriptionsCount"), String(totals.count)],
          [t("discount"), `${fmtMoney(totals.discount)} ${t("bd")}`],
          [t("deliveryFee"), `${fmtMoney(totals.delivery)} ${t("bd")}`],
        ].map(([k, v]) => (
          <div key={k} className="card">
            <p className="text-sm text-sage">{k}</p>
            <p className="font-display text-3xl font-bold text-verde">{v}</p>
          </div>
        ))}
      </div>

      <section className="card overflow-x-auto">
        <h2 className="mb-3 font-display text-2xl font-bold text-verde">{t("summary")} {loading && "…"}</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-sage">
              {[group === "day" ? t("day") : group === "week" ? t("weekStart") : t("month"), t("subscriptionsCount"), t("subtotal"), t("discount"), t("deliveryFee"), "BenefitPay", t("m_card"), t("m_cash"), t("total")].map((h) => (
                <th key={h} className="px-2 py-2 text-start">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {summary.map((g) => (
              <tr key={g.key} className="border-b">
                <td className="px-2 py-2 font-semibold" dir="ltr">{g.key}</td>
                <td className="px-2 py-2">{g.count}</td>
                <td className="px-2 py-2">{fmtMoney(g.subtotal)}</td>
                <td className="px-2 py-2">{fmtMoney(g.discount)}</td>
                <td className="px-2 py-2">{fmtMoney(g.delivery)}</td>
                <td className="px-2 py-2">{fmtMoney(g.benefitpay)}</td>
                <td className="px-2 py-2">{fmtMoney(g.card)}</td>
                <td className="px-2 py-2">{fmtMoney(g.cash)}</td>
                <td className="px-2 py-2 font-bold text-verde">{fmtMoney(g.total)}</td>
              </tr>
            ))}
            {!summary.length && (
              <tr><td colSpan={9} className="py-6 text-center text-slate-400">{t("noData")}</td></tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="card overflow-x-auto">
        <h2 className="mb-3 font-display text-2xl font-bold text-verde">{t("details")}</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-sage">
              {[t("date"), t("customer"), t("mealPlan"), t("days"), t("payment"), t("discountCode"), t("total")].map((h) => (
                <th key={h} className="px-2 py-2 text-start">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="px-2 py-2" dir="ltr">{r.date}</td>
                <td className="px-2 py-2">{r.customer}<br /><span className="text-xs text-sage" dir="ltr">{r.phone}</span></td>
                <td className="px-2 py-2">{p(r.packageAr, r.packageEn)}<br /><span className="text-xs text-sage">{p(r.optionAr, r.optionEn)}</span></td>
                <td className="px-2 py-2">{r.days}</td>
                <td className="px-2 py-2">{t("m_" + r.method)}</td>
                <td className="px-2 py-2">{r.code || "—"}</td>
                <td className="px-2 py-2 font-bold">{fmtMoney(r.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
