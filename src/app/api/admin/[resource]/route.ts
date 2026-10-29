import { json, staffForApi } from "@/lib/auth";
import { db } from "@/db";
import { RESOURCE_FIELDS, coerce } from "@/lib/resourceFields";
import { NO_CREATE, RESOURCES } from "@/lib/resources.server";

type Ctx = { params: Promise<{ resource: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { resource } = await ctx.params;
  const r = RESOURCES[resource];
  if (!r) return json({ error: "not_found" }, 404);
  const s = await staffForApi(r.perm);
  if (!s) return json({ error: "unauthorized" }, 401);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await (db.select().from(r.table) as any).orderBy(...r.order);
  return json(rows);
}

export async function POST(req: Request, ctx: Ctx) {
  const { resource } = await ctx.params;
  const r = RESOURCES[resource];
  if (!r || NO_CREATE.has(resource)) return json({ error: "not_found" }, 404);
  const s = await staffForApi(r.perm);
  if (!s) return json({ error: "unauthorized" }, 401);
  const body = await req.json().catch(() => null);
  if (!body) return json({ error: "invalid_input" }, 400);
  const fields = RESOURCE_FIELDS[resource];
  const values = coerce(fields, body);
  for (const f of fields) {
    if (f.required && (values[f.key] === undefined || values[f.key] === "" || values[f.key] === 0))
      return json({ error: "required_missing" }, 400);
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [row] = await (db.insert(r.table).values(values) as any).returning();
    return json(row);
  } catch (e) {
    console.error(e);
    return json({ error: "save_failed" }, 400);
  }
}
