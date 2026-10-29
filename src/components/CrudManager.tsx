"use client";

/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useLocale } from "./LocaleProvider";
import ImageUploader from "./ImageUploader";
import { fmtTime } from "@/lib/dates";
import type { Field, Opt } from "@/lib/resourceFields";

type Row = Record<string, any>;

export default function CrudManager({
  resource,
  title,
  fields,
  initial,
  canAdd = true,
  canDelete = true,
  defaults = {},
  selectOptions = {},
}: {
  resource: string;
  title: string;
  fields: Field[];
  initial: Row[];
  canAdd?: boolean;
  canDelete?: boolean;
  defaults?: Row;
  selectOptions?: Record<string, Opt[]>;
}) {
  const { t, l, locale } = useLocale();
  const [rows, setRows] = useState<Row[]>(initial);
  const [draft, setDraft] = useState<Row | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const opts = (f: Field): Opt[] => selectOptions[f.key] ?? f.options ?? [];
  const listFields = fields.filter((f) => f.list);

  async function reload() {
    const r = await fetch(`/api/admin/${resource}`, { cache: "no-store" });
    if (r.ok) setRows(await r.json());
  }

  function openNew() {
    const base: Row = {};
    for (const f of fields) {
      base[f.key] =
        f.type === "bool" ? true : f.type === "number" || f.type === "numselect" ? "" : "";
      if (f.type === "select" && opts(f)[0]) base[f.key] = opts(f)[0].value;
      if (f.type === "numselect" && opts(f)[0]) base[f.key] = opts(f)[0].value;
    }
    setErr("");
    setDraft({ ...base, ...defaults });
  }

  async function save() {
    if (!draft) return;
    setBusy(true);
    setErr("");
    const isNew = draft.id === undefined;
    const body: Row = {};
    for (const f of fields) body[f.key] = draft[f.key];
    const r = await fetch(isNew ? `/api/admin/${resource}` : `/api/admin/${resource}/${draft.id}`, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setErr(t("err_" + (d.error ?? "save_failed")));
      return;
    }
    setDraft(null);
    reload();
  }

  async function remove(row: Row) {
    if (!confirm(t("confirmDelete"))) return;
    await fetch(`/api/admin/${resource}/${row.id}`, { method: "DELETE" });
    reload();
  }

  async function toggle(row: Row, key: string) {
    await fetch(`/api/admin/${resource}/${row.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: !row[key] }),
    });
    reload();
  }

  function cell(f: Field, row: Row) {
    const v = row[f.key];
    if (f.type === "bool")
      return (
        <button
          onClick={() => toggle(row, f.key)}
          className={`rounded-full px-3 py-1 text-xs font-bold ${v ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}
        >
          {v ? t("on") : t("off")}
        </button>
      );
    if (f.type === "image") return v ? <img src={v} alt="" className="h-10 w-14 rounded object-cover" /> : "—";
    if (f.type === "select" || f.type === "numselect") {
      const o = opts(f).find((x) => String(x.value) === String(v));
      return o?.label ?? String(v ?? "—");
    }
    if (f.type === "time") return <span dir="ltr">{fmtTime(String(v), locale)}</span>;
    return v === null || v === undefined || v === "" ? "—" : String(v);
  }

  return (
    <section className="card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-2xl font-bold text-verde">{title}</h2>
        {canAdd && (
          <button className="btn btn-primary !py-2" onClick={openNew}>
            + {t("add")}
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-start text-sm">
          <thead>
            <tr className="border-b text-sage">
              {listFields.map((f) => (
                <th key={f.key} className="px-2 py-2 text-start font-semibold">
                  {l(f.label)}
                </th>
              ))}
              <th className="px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b last:border-0">
                {listFields.map((f) => (
                  <td key={f.key} className="px-2 py-2 align-middle">
                    {cell(f, row)}
                  </td>
                ))}
                <td className="whitespace-nowrap px-2 py-2 text-end">
                  <button
                    className="me-3 font-semibold text-verde hover:underline"
                    onClick={() => {
                      setErr("");
                      setDraft({ ...row });
                    }}
                  >
                    {t("edit")}
                  </button>
                  {canDelete && (
                    <button className="font-semibold text-red-600 hover:underline" onClick={() => remove(row)}>
                      {t("delete")}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={listFields.length + 1} className="py-6 text-center text-slate-400">
                  {t("noData")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 font-display text-2xl font-bold text-verde">
              {draft.id === undefined ? t("add") : t("edit")} — {title}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((f) => {
                const v = draft[f.key] ?? "";
                const set = (val: unknown) => setDraft({ ...draft, [f.key]: val });
                const wide = f.type === "textarea" || f.type === "image";
                return (
                  <label key={f.key} className={`block ${wide ? "sm:col-span-2" : ""}`}>
                    <span className="label">
                      {l(f.label)}
                      {f.required && " *"}
                    </span>
                    {f.type === "textarea" ? (
                      <textarea className="input min-h-20" value={v} onChange={(e) => set(e.target.value)} />
                    ) : f.type === "bool" ? (
                      <input type="checkbox" className="h-5 w-5 accent-[#335443]" checked={Boolean(draft[f.key])} onChange={(e) => set(e.target.checked)} />
                    ) : f.type === "image" ? (
                      <ImageUploader value={v} onChange={set} />
                    ) : f.type === "select" || f.type === "numselect" ? (
                      <select className="input" value={v} onChange={(e) => set(e.target.value)}>
                        {opts(f).map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className="input"
                        type={f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "time" ? "time" : "text"}
                        step={f.type === "number" ? "any" : undefined}
                        value={v}
                        onChange={(e) => set(e.target.value)}
                      />
                    )}
                  </label>
                );
              })}
            </div>
            {err && <p className="mt-3 text-sm font-semibold text-red-600">{err}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button className="btn btn-outline" onClick={() => setDraft(null)}>
                {t("cancel")}
              </button>
              <button className="btn btn-primary" disabled={busy} onClick={save}>
                {busy ? t("saving") : t("save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
