import { db } from "@/db";
import { settings } from "@/db/schema";
import { json, staffForApi } from "@/lib/auth";
import { SETTING_FIELDS } from "@/lib/settingsFields";

export async function PUT(req: Request) {
  const s = await staffForApi("settings");
  if (!s) return json({ error: "unauthorized" }, 401);
  const b = await req.json().catch(() => null);
  if (!b || typeof b !== "object") return json({ error: "invalid_input" }, 400);
  const rows = SETTING_FIELDS.filter((f) => f.key in b).map((f) => ({
    key: f.key,
    value: String(b[f.key] ?? ""),
  }));
  for (const r of rows) {
    await db
      .insert(settings)
      .values(r)
      .onConflictDoUpdate({ target: settings.key, set: { value: r.value } });
  }
  return json({ ok: true });
}
