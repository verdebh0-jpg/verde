import { eq } from "drizzle-orm";
import { db } from "@/db";
import { staff } from "@/db/schema";
import { getStaff, hashPassword, json, verifyPassword } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/config";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  const me = await getStaff();
  if (!me) return json({ error: "unauthorized" }, 401);
  const { id } = await ctx.params;
  const [target] = await db.select().from(staff).where(eq(staff.id, Number(id)));
  if (!target) return json({ error: "not_found" }, 404);
  const b = await req.json().catch(() => null);
  if (!b) return json({ error: "invalid_input" }, 400);

  // The protected owner account can only be touched by itself (password only).
  if (target.isProtected) {
    if (me.id !== target.id) return json({ error: "protected" }, 403);
    const pw = String(b.password ?? "");
    if (pw.length < 6) return json({ error: "weak_password" }, 400);
    if (!verifyPassword(String(b.currentPassword ?? ""), target.passwordHash))
      return json({ error: "wrong_current_password" }, 403);
    await db.update(staff).set({ passwordHash: hashPassword(pw) }).where(eq(staff.id, target.id));
    return json({ ok: true });
  }

  if (me.role !== "owner") return json({ error: "unauthorized" }, 403);
  const set: Partial<typeof staff.$inferInsert> = {};
  if (typeof b.name === "string") set.name = b.name.trim();
  if (typeof b.active === "boolean") set.active = b.active;
  if (Array.isArray(b.permissions) && target.role === "admin")
    set.permissions = b.permissions.filter((p: string) => (PERMISSIONS as readonly string[]).includes(p));
  if (b.password) {
    if (String(b.password).length < 6) return json({ error: "weak_password" }, 400);
    set.passwordHash = hashPassword(String(b.password));
  }
  if (Object.keys(set).length) await db.update(staff).set(set).where(eq(staff.id, target.id));
  return json({ ok: true });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const me = await getStaff();
  if (!me || me.role !== "owner") return json({ error: "unauthorized" }, 401);
  const { id } = await ctx.params;
  const [target] = await db.select().from(staff).where(eq(staff.id, Number(id)));
  if (!target) return json({ error: "not_found" }, 404);
  if (target.isProtected || target.username === "kitchen" || target.id === me.id)
    return json({ error: "protected" }, 403);
  await db.delete(staff).where(eq(staff.id, target.id));
  return json({ ok: true });
}
