import { asc } from "drizzle-orm";
import { db } from "@/db";
import { staff } from "@/db/schema";
import { getStaff, hashPassword, json } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getStaff();
  if (!me || me.role !== "owner") return json({ error: "unauthorized" }, 401);
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
  return json(rows);
}

export async function POST(req: Request) {
  const me = await getStaff();
  if (!me || me.role !== "owner") return json({ error: "unauthorized" }, 401);
  const b = await req.json().catch(() => null);
  const username = String(b?.username ?? "").trim().toLowerCase();
  const password = String(b?.password ?? "");
  const role = b?.role === "kitchen" ? "kitchen" : "admin";
  const perms = (Array.isArray(b?.permissions) ? b.permissions : []).filter((p: string) =>
    (PERMISSIONS as readonly string[]).includes(p),
  );
  if (!/^[a-z0-9_.-]{3,30}$/.test(username) || password.length < 6)
    return json({ error: "invalid_input" }, 400);
  try {
    await db.insert(staff).values({
      username,
      name: String(b?.name ?? "").trim(),
      passwordHash: hashPassword(password),
      role,
      permissions: role === "admin" ? perms : [],
    });
  } catch {
    return json({ error: "username_exists" }, 409);
  }
  return json({ ok: true });
}
