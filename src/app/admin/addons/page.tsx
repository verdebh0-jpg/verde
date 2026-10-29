import { asc } from "drizzle-orm";
import { db } from "@/db";
import { addons } from "@/db/schema";
import CrudManager from "@/components/CrudManager";
import { requireStaffPage } from "@/lib/auth";
import { getI18n } from "@/lib/locale";
import { RESOURCE_FIELDS } from "@/lib/resourceFields";

export default async function AddonsPage() {
  await requireStaffPage("addons");
  const { t } = await getI18n();
  const rows = await db.select().from(addons).orderBy(asc(addons.sortOrder), asc(addons.id));
  return (
    <>
      <h1 className="font-display text-4xl font-bold text-verde">{t("nav_addons")}</h1>
      <CrudManager resource="addons" title={t("nav_addons")} fields={RESOURCE_FIELDS.addons} initial={rows} />
    </>
  );
}
