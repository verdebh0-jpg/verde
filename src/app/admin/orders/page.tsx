import OrdersBoard from "@/components/OrdersBoard";
import { requireStaffPage } from "@/lib/auth";
import { getI18n } from "@/lib/locale";
import { todayBH } from "@/lib/dates";

export default async function AdminOrders() {
  await requireStaffPage("orders");
  const { t } = await getI18n();
  return (
    <>
      <h1 className="font-display text-4xl font-bold text-verde">{t("nav_orders")}</h1>
      <OrdersBoard initialDate={todayBH()} />
    </>
  );
}
