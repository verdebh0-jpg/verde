import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { json, setSession, verifyPassword } from "@/lib/auth";
import { ensureSeed } from "@/lib/seed";

export async function POST(req: Request) {
  await ensureSeed();
  const b = await req.json().catch(() => null);
  const id = String(b?.identifier ?? "").trim().toLowerCase();
  const pw = String(b?.password ?? "");
  if (!id || !pw) return json({ error: "invalid_credentials" }, 400);
  const [c] = await db
    .select()
    .from(customers)
    .where(or(eq(customers.email, id), eq(customers.phone, id)));
  if (!c || !verifyPassword(pw, c.passwordHash)) return json({ error: "invalid_credentials" }, 401);
  await setSession("customer", c.id);
  return json({ ok: true });
}
