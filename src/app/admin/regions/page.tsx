import { asc } from "drizzle-orm";
import { db } from "@/db";
import { regions } from "@/db/schema";
import CrudManager from "@/components/CrudManager";
import { requireStaffPage } from "@/lib/auth";
import { getI18n } from "@/lib/locale";
import { RESOURCE_FIELDS } from "@/lib/resourceFields";

export default async function RegionsPage() {
  await requireStaffPage("regions");
  const { t } = await getI18n();
  const rows = await db.select().from(regions).orderBy(asc(regions.sortOrder), asc(regions.id));
  return (
    <>
      <h1 className="font-display text-4xl font-bold text-verde">{t("nav_regions")}</h1>
      <CrudManager resource="regions" title={t("nav_regions")} fields={RESOURCE_FIELDS.regions} initial={rows} defaults={{ fee: 0 }} />
    </>
  );
}
