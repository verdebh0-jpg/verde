import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { hashPassword, json, staffForApi } from "@/lib/auth";

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const s = await staffForApi("customers");
  if (!s) return json({ error: "unauthorized" }, 401);
  const { id } = await ctx.params;
  const b = await req.json().catch(() => null);
  const pw = String(b?.password ?? "");
  if (pw.length < 6) return json({ error: "weak_password" }, 400);
  await db.update(customers).set({ passwordHash: hashPassword(pw) }).where(eq(customers.id, Number(id)));
  return json({ ok: true });
}
