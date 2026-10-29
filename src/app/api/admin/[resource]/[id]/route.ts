import { eq } from "drizzle-orm";
import { db } from "@/db";
import { packageOptions } from "@/db/schema";
import { json, staffForApi } from "@/lib/auth";
import { RESOURCE_FIELDS, coerce } from "@/lib/resourceFields";
import { NO_DELETE, RESOURCES } from "@/lib/resources.server";

type Ctx = { params: Promise<{ resource: string; id: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  const { resource, id } = await ctx.params;
  const r = RESOURCES[resource];
  if (!r) return json({ error: "not_found" }, 404);
  const s = await staffForApi(r.perm);
  if (!s) return json({ error: "unauthorized" }, 401);
  const body = await req.json().catch(() => null);
  if (!body) return json({ error: "invalid_input" }, 400);
  const values = coerce(RESOURCE_FIELDS[resource], body);
  if (Object.keys(values).length === 0) return json({ error: "invalid_input" }, 400);
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [row] = await (db.update(r.table).set(values).where(eq(r.table.id, Number(id))) as any).returning();
    return json(row ?? {});
  } catch (e) {
    console.error(e);
    return json({ error: "save_failed" }, 400);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { resource, id } = await ctx.params;
  const r = RESOURCES[resource];
  if (!r || NO_DELETE.has(resource)) return json({ error: "not_found" }, 404);
  const s = await staffForApi(r.perm);
  if (!s) return json({ error: "unauthorized" }, 401);
  const n = Number(id);
  if (resource === "packages") await db.delete(packageOptions).where(eq(packageOptions.packageId, n));
  await db.delete(r.table).where(eq(r.table.id, n));
  return json({ ok: true });
}
