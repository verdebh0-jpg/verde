import { asc } from "drizzle-orm";
import { db } from "@/db";
import { discountCodes } from "@/db/schema";
import CrudManager from "@/components/CrudManager";
import { requireStaffPage } from "@/lib/auth";
import { getI18n } from "@/lib/locale";
import { RESOURCE_FIELDS } from "@/lib/resourceFields";

export default async function DiscountsPage() {
  await requireStaffPage("discounts");
  const { t } = await getI18n();
  const rows = await db.select().from(discountCodes).orderBy(asc(discountCodes.id));
  return (
    <>
      <h1 className="font-display text-4xl font-bold text-verde">{t("nav_discounts")}</h1>
      <CrudManager resource="discounts" title={t("nav_discounts")} fields={RESOURCE_FIELDS.discounts} initial={rows} defaults={{ usageCount: 0 }} />
    </>
  );
}
