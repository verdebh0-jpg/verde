import { asc } from "drizzle-orm";
import { db } from "@/db";
import { proteinPrices } from "@/db/schema";
import CrudManager from "@/components/CrudManager";
import { requireStaffPage } from "@/lib/auth";
import { getI18n } from "@/lib/locale";
import { RESOURCE_FIELDS } from "@/lib/resourceFields";

export default async function ProteinPricesAdminPage() {
  await requireStaffPage("settings");
  const { t } = await getI18n();

  const prices = await db
    .select()
    .from(proteinPrices)
    .orderBy(asc(proteinPrices.sortOrder), asc(proteinPrices.id));

  return (
    <>
      <h1 className="font-display text-4xl font-bold text-verde">أسعار أوزان البروتين</h1>
      <CrudManager
        resource="protein-prices"
        title="أسعار أوزان البروتين"
        fields={RESOURCE_FIELDS["protein-prices"]}
        initial={prices}
        defaults={{ active: true, price: "1.500", sortOrder: 0 }}
      />
    </>
  );
}