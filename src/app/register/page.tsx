import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import SiteHeader from "@/components/SiteHeader";
import RegisterForm from "@/components/RegisterForm";
import { getCustomer } from "@/lib/auth";
import { getCatalog } from "@/lib/data";
import { getI18n } from "@/lib/locale";
import { addDays, todayBH } from "@/lib/dates";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; renew?: string }>;
}) {
  const sp = await searchParams;
  const [{ t }, catalog, customer] = await Promise.all([getI18n(), getCatalog(), getCustomer()]);

  let minStart = addDays(todayBH(), 1);
  let initial: {
    optionId?: number;
    slotId?: number;
    regionId?: number;
    addonIds?: number[];
    days?: number;
  } = {};

  if (customer) {
    const [last] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.customerId, customer.id))
      .orderBy(desc(subscriptions.endDate))
      .limit(1);
    if (last) {
      if (addDays(last.endDate, 1) > minStart) minStart = addDays(last.endDate, 1);
      if (sp.renew === "same") {
        const optOk = catalog.packages.some((pk) => pk.options.some((o) => o.id === last.optionId));
        initial = {
          optionId: optOk ? last.optionId : undefined,
          slotId: catalog.slots.some((s) => s.id === last.slotId) ? last.slotId : undefined,
          regionId: catalog.regions.some((r) => r.id === last.regionId) ? last.regionId : undefined,
          addonIds: last.addons.map((a) => a.id).filter((id) => catalog.addons.some((a) => a.id === id)),
          days: last.days,
        };
      }
    }
  }
  if (!initial.optionId && sp.plan) {
    const pk = catalog.packages.find((x) => String(x.id) === sp.plan);
    if (pk?.options[0]) initial.optionId = pk.options[0].id;
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="mb-6 font-display text-4xl font-bold text-verde">
          {customer ? t("renewSubscription") : t("register")}
        </h1>
        <RegisterForm
          key={`${sp.renew ?? ""}-${sp.plan ?? ""}`}
          catalog={catalog}
          customer={
            customer
              ? {
                  name: customer.name,
                  weight: customer.weight,
                  height: customer.height,
                  unwanted: customer.unwanted,
                  allergy: customer.allergy,
                  house: customer.house,
                  flat: customer.flat,
                  road: customer.road,
                  block: customer.block,
                  regionId: customer.regionId,
                }
              : null
          }
          initial={initial}
          minStart={minStart}
        />
      </main>
    </>
  );
}
