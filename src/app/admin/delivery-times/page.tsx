import { asc } from "drizzle-orm";
import { db } from "@/db";
import { deliverySlots } from "@/db/schema";
import CrudManager from "@/components/CrudManager";
import { requireStaffPage } from "@/lib/auth";
import { getI18n } from "@/lib/locale";
import { RESOURCE_FIELDS } from "@/lib/resourceFields";

export default async function DeliveryTimesPage() {
  await requireStaffPage("delivery_times");
  const { t } = await getI18n();
  const rows = await db.select().from(deliverySlots).orderBy(asc(deliverySlots.startTime), asc(deliverySlots.id));
  return (
    <>
      <h1 className="font-display text-4xl font-bold text-verde">{t("nav_delivery_times")}</h1>
      <p className="text-sm text-sage">{t("slotsNote")}</p>
      <CrudManager resource="delivery-slots" title={t("nav_delivery_times")} fields={RESOURCE_FIELDS["delivery-slots"]} initial={rows} defaults={{ startTime: "12:30", endTime: "13:30" }} />
    </>
  );
}
