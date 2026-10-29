"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "./LocaleProvider";

export default function LogoutButton({
  kind,
  className = "btn btn-outline",
}: {
  kind: "customer" | "staff";
  className?: string;
}) {
  const { t } = useLocale();
  const router = useRouter();
  async function out() {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind }),
    });
    sessionStorage.clear();
    router.push(kind === "staff" ? "/staff/login" : "/");
    router.refresh();
  }
  return (
    <button onClick={out} className={className}>
      {t("logout")}
    </button>
  );
}
