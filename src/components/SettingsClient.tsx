"use client";

import { useState } from "react";
import { useLocale } from "./LocaleProvider";
import ImageUploader from "./ImageUploader";
import { SETTING_FIELDS } from "@/lib/settingsFields";

export default function SettingsClient({ initial }: { initial: Record<string, string> }) {
  const { t, l } = useLocale();
  const [v, setV] = useState(initial);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const r = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(v),
    });
    setBusy(false);
    setMsg(r.ok ? t("saved") : t("err_server_error"));
  }

  return (
    <section className="card space-y-5">
      <h2 className="font-display text-2xl font-bold text-verde">{t("siteContent")}</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {SETTING_FIELDS.map((f) => (
          <label key={f.key} className={`block ${f.type !== "text" ? "md:col-span-2" : ""}`}>
            <span className="label">{l(f.label)}</span>
            {f.type === "image" ? (
              <ImageUploader value={v[f.key] ?? ""} onChange={(u) => setV({ ...v, [f.key]: u })} />
            ) : f.type === "textarea" ? (
              <textarea className="input" rows={2} value={v[f.key] ?? ""} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} />
            ) : (
              <input className="input" value={v[f.key] ?? ""} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} />
            )}
          </label>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <button className="btn btn-primary" onClick={save} disabled={busy}>
          {busy ? t("saving") : t("save")}
        </button>
        {msg && <span className="text-sm font-semibold text-verde">{msg}</span>}
      </div>
    </section>
  );
}
