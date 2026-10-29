"use client";

import { useState } from "react";
import { useLocale } from "./LocaleProvider";

type C = {
  id: number;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  startDate: string | null;
  endDate: string | null;
  days: number | null;
  subs: number;
};

export default function CustomersClient({ customers, today }: { customers: C[]; today: string }) {
  const { t } = useLocale();
  const [q, setQ] = useState("");
  const [target, setTarget] = useState<C | null>(null);
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");

  const list = customers.filter((c) =>
    `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(q.trim().toLowerCase()),
  );

  async function save() {
    if (!target) return;
    const r = await fetch(`/api/admin/customers/${target.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    if (r.ok) {
      setMsg(t("passwordChanged"));
      setTarget(null);
      setPw("");
    } else {
      const d = await r.json().catch(() => ({}));
      setMsg(t("err_" + (d.error ?? "server_error")));
    }
  }

  return (
    <div className="space-y-4">
      <input className="input max-w-md" placeholder={t("search")} value={q} onChange={(e) => setQ(e.target.value)} />
      {msg && <p className="rounded-xl bg-sky/40 p-3 text-sm font-semibold text-verde">{msg}</p>}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-sage">
              {[t("name"), t("phone"), t("email"), t("registeredAt"), t("subscriptionPeriod"), t("status"), ""].map((h, i) => (
                <th key={i} className="px-2 py-2 text-start">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((c) => {
              const state = !c.endDate ? "none" : c.endDate < today ? "expired" : c.startDate! > today ? "upcoming" : "active";
              return (
                <tr key={c.id} className="border-b">
                  <td className="px-2 py-2 font-semibold">{c.name}</td>
                  <td className="px-2 py-2" dir="ltr">{c.phone}</td>
                  <td className="px-2 py-2" dir="ltr">{c.email}</td>
                  <td className="px-2 py-2" dir="ltr">{c.createdAt.slice(0, 10)}</td>
                  <td className="px-2 py-2" dir="ltr">{c.endDate ? `${c.startDate} → ${c.endDate}` : "—"}</td>
                  <td className="px-2 py-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${state === "active" ? "bg-emerald-100 text-emerald-800" : state === "upcoming" ? "bg-sky text-verde" : "bg-slate-200 text-slate-600"}`}>
                      {t("sub_" + state)}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-end">
                    <button className="font-semibold text-verde hover:underline" onClick={() => { setTarget(c); setPw(""); setMsg(""); }}>
                      {t("changePassword")}
                    </button>
                  </td>
                </tr>
              );
            })}
            {!list.length && <tr><td colSpan={7} className="py-6 text-center text-slate-400">{t("noData")}</td></tr>}
          </tbody>
        </table>
      </div>

      {target && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm space-y-4 rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="font-display text-2xl font-bold text-verde">{t("changePassword")}</h3>
            <p className="text-sm text-sage">{target.name} · {target.email}</p>
            <input className="input" dir="ltr" type="text" placeholder={t("newPassword")} value={pw} onChange={(e) => setPw(e.target.value)} />
            <div className="flex justify-end gap-3">
              <button className="btn btn-outline" onClick={() => setTarget(null)}>{t("cancel")}</button>
              <button className="btn btn-primary" disabled={pw.length < 6} onClick={save}>{t("save")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
