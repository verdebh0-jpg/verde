import { redirect } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import LoginForm from "@/components/LoginForm";
import { getCustomer } from "@/lib/auth";
import { getI18n } from "@/lib/locale";

export default async function LoginPage() {
  if (await getCustomer()) redirect("/dashboard");
  const { t } = await getI18n();
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="mb-6 text-center font-display text-4xl font-bold text-verde">{t("customerLogin")}</h1>
        <LoginForm kind="customer" />
      </main>
    </>
  );
}
