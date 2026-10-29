import { asc } from "drizzle-orm";
import { db } from "@/db";
import { popups } from "@/db/schema";
import CrudManager from "@/components/CrudManager";
import { requireStaffPage } from "@/lib/auth";
import { getI18n } from "@/lib/locale";
import { RESOURCE_FIELDS } from "@/lib/resourceFields";

export default async function PopupsPage() {
  await requireStaffPage("popups");
  const { t } = await getI18n();
  const rows = await db.select().from(popups).orderBy(asc(popups.id));
  return (
    <>
      <h1 className="font-display text-4xl font-bold text-verde">{t("nav_popups")}</h1>
      <CrudManager resource="popups" title={t("nav_popups")} fields={RESOURCE_FIELDS.popups} initial={rows} />
    </>
  );
}
