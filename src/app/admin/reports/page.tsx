import ReportsClient from "@/components/ReportsClient";
import { requireStaffPage } from "@/lib/auth";
import { getI18n } from "@/lib/locale";
import { todayBH } from "@/lib/dates";

export default async function ReportsPage() {
  await requireStaffPage("reports");
  const { t } = await getI18n();
  return (
    <>
      <h1 className="font-display text-4xl font-bold text-verde">{t("nav_reports")}</h1>
      <ReportsClient today={todayBH()} />
    </>
  );
}
