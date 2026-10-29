"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale } from "./LocaleProvider";

export default function LoginForm({ kind }: { kind: "customer" | "staff" }) {
  const { t } = useLocale();
  const router = useRouter();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const r = await fetch(kind === "staff" ? "/api/auth/staff-login" : "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(kind === "staff" ? { username: id, password: pw } : { identifier: id, password: pw }),
    });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setErr(t("err_" + (d.error ?? "server_error")));
    sessionStorage.removeItem("renew_shown");
    router.push(kind === "staff" ? (d.role === "kitchen" ? "/kitchen" : "/admin") : "/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card mx-auto w-full max-w-md space-y-4">
      <label className="block">
        <span className="label">{kind === "staff" ? t("username") : t("emailOrPhone")}</span>
        <input className="input" dir="ltr" autoComplete="username" value={id} onChange={(e) => setId(e.target.value)} />
      </label>
      <label className="block">
        <span className="label">{t("password")}</span>
        <input className="input" dir="ltr" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} />
      </label>
      {err && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{err}</p>}
      <button className="btn btn-primary w-full" disabled={busy}>
        {busy ? t("saving") : t("login")}
      </button>
      {kind === "customer" && (
        <p className="text-center text-sm text-sage">
          {t("noAccount")}{" "}
          <Link href="/register" className="font-semibold text-verde underline">
            {t("register")}
          </Link>
        </p>
      )}
    </form>
  );
}
