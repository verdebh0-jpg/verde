"use client";

import { useState } from "react";
import { useLocale } from "./LocaleProvider";
import { PERMISSIONS } from "@/lib/config";

type S = {
  id: number;
  username: string;
  name: string;
  role: string;
  permissions: string[];
  isProtected: boolean;
  active: boolean;
};

type Modal =
  | { kind: "new" }
  | { kind: "perms"; s: S }
  | { kind: "password"; s: S }
  | null;

export default function StaffClient({ initial, meId }: { initial: S[]; meId: number }) {
  const { t } = useLocale();
  const [rows, setRows] = useState<S[]>(initial);
  const [modal, setModal] = useState<Modal>(null);
  const [form, setForm] = useState({ username: "", name: "", password: "", currentPassword: "", role: "admin", permissions: [] as string[] });
  const [msg, setMsg] = useState("");

  async function reload() {
    const r = await fetch("/api/admin/staff", { cache: "no-store" });
    if (r.ok) setRows(await r.json());
  }

  async function call(url: string, method: string, body?: unknown) {
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setMsg(t("err_" + (d.error ?? "server_error")));
      return false;
    }
    setMsg("");
    return true;
  }

  const togglePerm = (p: string) =>
    setForm((f) => ({ ...f, permissions: f.permissions.includes(p) ? f.permissions.filter((x) => x !== p) : [...f.permissions, p] }));

  async function submit() {
    if (!modal) return;
    let ok = false;
    if (modal.kind === "new")
      ok = await call("/api/admin/staff", "POST", { username: form.username, name: form.name, password: form.password, role: form.role, permissions: form.permissions });
    if (modal.kind === "perms") ok = await call(`/api/admin/staff/${modal.s.id}`, "PUT", { name: form.name, permissions: form.permissions });
    if (modal.kind === "password")
      ok = await call(`/api/admin/staff/${modal.s.id}`, "PUT", { password: form.password, currentPassword: form.currentPassword });
    if (ok) {
      setModal(null);
      reload();
    }
  }

  const open = (m: Modal, s?: S) => {
    setMsg("");
    setForm({ username: "", name: s?.name ?? "", password: "", currentPassword: "", role: "admin", permissions: s?.permissions ?? [] });
    setModal(m);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <p className="text-sm text-sage">{t("staffNote")}</p>
        <button className="btn btn-primary !py-2" onClick={() => open({ kind: "new" })}>+ {t("add")}</button>
      </div>
      {msg && !modal && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{msg}</p>}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-sage">
              {[t("username"), t("name"), t("role"), t("permissions"), t("active"), ""].map((h, i) => (
                <th key={i} className="px-2 py-2 text-start">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-b align-top">
                <td className="px-2 py-2 font-semibold" dir="ltr">{s.username} {s.isProtected && "🔒"}</td>
                <td className="px-2 py-2">{s.name}</td>
                <td className="px-2 py-2">{t("role_" + s.role)}</td>
                <td className="px-2 py-2 text-xs text-sage">
                  {s.role === "owner" ? t("allPermissions") : s.role === "kitchen" ? t("perm_orders") : s.permissions.map((p) => t("perm_" + p)).join("، ") || "—"}
                </td>
                <td className="px-2 py-2">
                  {s.isProtected ? "✓" : (
                    <button
                      className={`rounded-full px-3 py-1 text-xs font-bold ${s.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}
                      onClick={async () => { await call(`/api/admin/staff/${s.id}`, "PUT", { active: !s.active }); reload(); }}
                    >
                      {s.active ? t("on") : t("off")}
                    </button>
                  )}
                </td>
                <td className="space-x-3 whitespace-nowrap px-2 py-2 text-end rtl:space-x-reverse">
                  {s.isProtected ? (
                    s.id === meId && <button className="font-semibold text-verde hover:underline" onClick={() => open({ kind: "password", s }, s)}>{t("changeMyPassword")}</button>
                  ) : (
                    <>
                      {s.role === "admin" && <button className="font-semibold text-verde hover:underline" onClick={() => open({ kind: "perms", s }, s)}>{t("permissions")}</button>}
                      <button className="font-semibold text-verde hover:underline" onClick={() => open({ kind: "password", s }, s)}>{t("changePassword")}</button>
                      {s.username !== "kitchen" && (
                        <button
                          className="font-semibold text-red-600 hover:underline"
                          onClick={async () => { if (confirm(t("confirmDelete")) && (await call(`/api/admin/staff/${s.id}`, "DELETE"))) reload(); }}
                        >
                          {t("delete")}
                        </button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-auto rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="font-display text-2xl font-bold text-verde">
              {modal.kind === "new" ? t("add") : modal.kind === "perms" ? t("permissions") : t("changePassword")}
              {modal.kind !== "new" && ` — ${modal.s.username}`}
            </h3>
            {modal.kind === "new" && (
              <>
                <label className="block"><span className="label">{t("username")}</span>
                  <input className="input" dir="ltr" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></label>
                <label className="block"><span className="label">{t("role")}</span>
                  <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    <option value="admin">{t("role_admin")}</option>
                    <option value="kitchen">{t("role_kitchen")}</option>
                  </select></label>
              </>
            )}
            {(modal.kind === "new" || modal.kind === "perms") && (
              <label className="block"><span className="label">{t("name")}</span>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            )}
            {(modal.kind === "new" || modal.kind === "password") && (
              <>
                {modal.kind === "password" && modal.s.isProtected && (
                  <label className="block"><span className="label">{t("currentPassword")}</span>
                    <input className="input" dir="ltr" type="password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} /></label>
                )}
                <label className="block"><span className="label">{modal.kind === "new" ? t("password") : t("newPassword")} (6+)</span>
                  <input className="input" dir="ltr" type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
              </>
            )}
            {((modal.kind === "new" && form.role === "admin") || modal.kind === "perms") && (
              <div>
                <span className="label">{t("permissions")}</span>
                <div className="grid gap-2 sm:grid-cols-2">
                  {PERMISSIONS.map((p) => (
                    <label key={p} className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm">
                      <input type="checkbox" className="h-4 w-4 accent-[#335443]" checked={form.permissions.includes(p)} onChange={() => togglePerm(p)} />
                      {t("perm_" + p)}
                    </label>
                  ))}
                </div>
              </div>
            )}
            {msg && <p className="text-sm font-semibold text-red-600">{msg}</p>}
            <div className="flex justify-end gap-3">
              <button className="btn btn-outline" onClick={() => setModal(null)}>{t("cancel")}</button>
              <button className="btn btn-primary" onClick={submit}>{t("save")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
