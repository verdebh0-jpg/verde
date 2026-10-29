import { asc } from "drizzle-orm";
import { db } from "@/db";
import { carouselImages, paymentMethods } from "@/db/schema";
import CrudManager from "@/components/CrudManager";
import SettingsClient from "@/components/SettingsClient";
import { requireStaffPage } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import { getI18n } from "@/lib/locale";
import { RESOURCE_FIELDS } from "@/lib/resourceFields";

export default async function SettingsPage() {
  await requireStaffPage("settings");
  const { t } = await getI18n();
  const [settings, carousel, methods] = await Promise.all([
    getSettings(),
    db.select().from(carouselImages).orderBy(asc(carouselImages.sortOrder), asc(carouselImages.id)),
    db.select().from(paymentMethods).orderBy(asc(paymentMethods.sortOrder), asc(paymentMethods.id)),
  ]);
  return (
    <>
      <h1 className="font-display text-4xl font-bold text-verde">{t("nav_settings")}</h1>
      <SettingsClient initial={settings} />
      <CrudManager resource="carousel" title={t("carouselImages")} fields={RESOURCE_FIELDS.carousel} initial={carousel} />
      <CrudManager
        resource="payment-methods"
        title={t("paymentMethods")}
        fields={RESOURCE_FIELDS["payment-methods"]}
        initial={methods}
        canAdd={false}
        canDelete={false}
      />
    </>
  );
}
