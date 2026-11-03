import { asc } from "drizzle-orm";
import { db } from "@/db";
import { customMealOptions } from "@/db/schema";
import CrudManager from "@/components/CrudManager";
import { requireStaffPage } from "@/lib/auth";
import { getI18n } from "@/lib/locale";
import { RESOURCE_FIELDS } from "@/lib/resourceFields";

export default async function CustomMealsAdminPage() {
  await requireStaffPage("settings");
  const { t } = await getI18n();

  const options = await db
    .select()
    .from(customMealOptions)
    .orderBy(asc(customMealOptions.sortOrder), asc(customMealOptions.id));

  return (
    <>
      <h1 className="font-display text-4xl font-bold text-verde">طلبات من اختيارك</h1>
      <CrudManager
        resource="custom-meals"
        title="طلبات من اختيارك"
        fields={RESOURCE_FIELDS["custom-meals"]}
        initial={options}
        defaults={{ active: true, price: "0.000", sortOrder: 0 }}
      />
    </>
  );
}