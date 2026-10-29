import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { json, staffForApi } from "@/lib/auth";
import { STATUSES } from "@/lib/config";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const s = await staffForApi("orders");
  if (!s) return json({ error: "unauthorized" }, 401);
  const { id } = await ctx.params;
  const b = await req.json().catch(() => null);
  const next = String(b?.status ?? "");
  const nextIdx = (STATUSES as readonly string[]).indexOf(next);
  if (nextIdx < 0) return json({ error: "invalid_status" }, 400);
  const [o] = await db.select().from(orders).where(eq(orders.id, Number(id)));
  if (!o) return json({ error: "not_found" }, 404);
  const curIdx = (STATUSES as readonly string[]).indexOf(o.status);
  if (o.status === "out_for_delivery") return json({ error: "locked" }, 409);
  if (nextIdx <= curIdx) return json({ error: "forward_only" }, 409);
  await db.update(orders).set({ status: next, updatedAt: new Date() }).where(eq(orders.id, o.id));
  return json({ ok: true });
}
