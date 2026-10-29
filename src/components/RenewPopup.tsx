"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "./LocaleProvider";

/** Shown automatically on login during the last 2 days of a subscription. */
export default function RenewPopup({ endDate, daysLeft }: { endDate: string; daysLeft: number }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem("renew_shown")) setOpen(true);
  }, []);

  if (!open) return null;
  const close = () => {
    sessionStorage.setItem("renew_shown", "1");
    setOpen(false);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md space-y-4 rounded-3xl bg-white p-6 text-center shadow-2xl">
        <div className="text-5xl">⏳</div>
        <h3 className="font-display text-3xl font-bold text-verde">{t("renewTitle")}</h3>
        <p className="text-slate-700">
          {t("renewBody")} <b dir="ltr">{endDate}</b>
          {daysLeft === 0 ? ` (${t("endsToday")})` : ` (${daysLeft} ${t("daysLeft")})`}
        </p>
        <div className="flex flex-col gap-2">
          <Link href="/register?renew=same" className="btn btn-primary" onClick={close}>
            {t("renewSame")}
          </Link>
          <Link href="/register?renew=other" className="btn btn-sky" onClick={close}>
            {t("renewOther")}
          </Link>
          <button className="btn btn-outline" onClick={close}>
            {t("later")}
          </button>
        </div>
      </div>
    </div>
  );
}
