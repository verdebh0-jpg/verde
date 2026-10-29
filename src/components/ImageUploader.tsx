"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import { useLocale } from "./LocaleProvider";

async function compress(file: File): Promise<Blob> {
  if (file.size < 1.5 * 1024 * 1024 || file.type === "image/svg+xml") return file;
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res) => c.toBlob((b) => res(b ?? file), "image/jpeg", 0.85));
}

export default function ImageUploader({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const { t } = useLocale();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setErr("");
    try {
      const blob = await compress(file);
      const fd = new FormData();
      fd.append("file", blob, file.name);
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      onChange(d.url);
    } catch (e) {
      setErr(t("uploadFailed") + (e instanceof Error ? ` (${e.message})` : ""));
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {value ? (
        <img src={value} alt="" className="h-16 w-24 rounded-lg border object-cover" />
      ) : (
        <div className="flex h-16 w-24 items-center justify-center rounded-lg border border-dashed text-xs text-slate-400">
          {t("noImage")}
        </div>
      )}
      <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
      <button type="button" className="btn btn-outline !py-1.5 text-sm" disabled={busy} onClick={() => ref.current?.click()}>
        {busy ? t("uploading") : t("uploadImage")}
      </button>
      {value && (
        <button type="button" className="text-sm text-red-600 hover:underline" onClick={() => onChange("")}>
          {t("removeImage")}
        </button>
      )}
      {err && <span className="text-sm text-red-600">{err}</span>}
    </div>
  );
}
