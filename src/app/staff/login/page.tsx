import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import LangToggle from "@/components/LangToggle";
import Logo from "@/components/Logo";
import { getStaff } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import { getI18n } from "@/lib/locale";

export default async function StaffLogin() {
  const s = await getStaff();
  if (s) redirect(s.role === "kitchen" ? "/kitchen" : "/admin");
  const [{ t }, settings] = await Promise.all([getI18n(), getSettings()]);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-verde px-4 py-10">
      <Logo src={settings.logo} light className="!text-6xl" />
      <h1 className="font-display text-3xl font-bold text-white">{t("staffLogin")}</h1>
      <LoginForm kind="staff" />
      <LangToggle light />
    </main>
  );
}
