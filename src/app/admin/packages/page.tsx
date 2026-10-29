import { asc } from "drizzle-orm";
import { db } from "@/db";
import { packageOptions, packages } from "@/db/schema";
import CrudManager from "@/components/CrudManager";
import { requireStaffPage } from "@/lib/auth";
import { getI18n } from "@/lib/locale";
import { RESOURCE_FIELDS } from "@/lib/resourceFields";

export default async function PackagesPage() {
  await requireStaffPage("packages");
  const { t, p } = await getI18n();
  const [pk, opts] = await Promise.all([
    db.select().from(packages).orderBy(asc(packages.sortOrder), asc(packages.id)),
    db.select().from(packageOptions).orderBy(asc(packageOptions.packageId), asc(packageOptions.sortOrder), asc(packageOptions.id)),
  ]);
  return (
    <>
      <h1 className="font-display text-4xl font-bold text-verde">{t("nav_packages")}</h1>
      <CrudManager resource="packages" title={t("nav_packages")} fields={RESOURCE_FIELDS.packages} initial={pk} />
      <CrudManager
        resource="package-options"
        title={t("packageOptions")}
        fields={RESOURCE_FIELDS["package-options"]}
        initial={opts}
        selectOptions={{ packageId: pk.map((x) => ({ value: x.id, label: p(x.nameAr, x.nameEn) })) }}
        defaults={{ mealsPerDay: 1, price5: "" }}
      />
    </>
  );
}
