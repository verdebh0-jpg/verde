"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { useLocale } from "./LocaleProvider";

type Popup = {
  id: number;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  image: string;
};

export default function Popups({ popups }: { popups: Popup[] }) {
  const { p, t } = useLocale();
  const [queue, setQueue] = useState<Popup[]>([]);

  useEffect(() => {
    const seen: number[] = JSON.parse(sessionStorage.getItem("popups_seen") ?? "[]");
    setQueue(popups.filter((x) => !seen.includes(x.id)));
  }, [popups]);

  const cur = queue[0];
  if (!cur) return null;

  function close() {
    const seen: number[] = JSON.parse(sessionStorage.getItem("popups_seen") ?? "[]");
    sessionStorage.setItem("popups_seen", JSON.stringify([...seen, cur.id]));
    setQueue((q) => q.slice(1));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={close}>
      <div
        className="relative max-h-[90vh] w-full max-w-md overflow-auto rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          aria-label={t("close")}
          className="absolute end-3 top-3 z-10 rounded-full bg-white/90 px-3 py-1 text-lg text-verde shadow"
        >
          ✕
        </button>
        {cur.image && <img src={cur.image} alt="" className="w-full object-cover" />}
        <div className="space-y-2 p-5">
          {(cur.titleAr || cur.titleEn) && (
            <h3 className="font-display text-2xl font-bold text-verde">{p(cur.titleAr, cur.titleEn)}</h3>
          )}
          {(cur.bodyAr || cur.bodyEn) && (
            <p className="whitespace-pre-line text-slate-700">{p(cur.bodyAr, cur.bodyEn)}</p>
          )}
        </div>
      </div>
    </div>
  );
}
