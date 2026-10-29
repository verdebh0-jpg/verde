import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { staff } from "@/db/schema";
import StaffClient from "@/components/StaffClient";
import { requireStaffPage } from "@/lib/auth";
import { getI18n } from "@/lib/locale";

export default async function StaffPage() {
  const me = await requireStaffPage();
  if (me.role !== "owner") redirect("/admin");
  const { t } = await getI18n();
  const rows = await db
    .select({
      id: staff.id,
      username: staff.username,
      name: staff.name,
      role: staff.role,
      permissions: staff.permissions,
      isProtected: staff.isProtected,
      active: staff.active,
    })
    .from(staff)
    .orderBy(asc(staff.id));
  return (
    <>
      <h1 className="font-display text-4xl font-bold text-verde">{t("nav_staff")}</h1>
      <StaffClient initial={rows} meId={me.id} />
    </>
  );
}
