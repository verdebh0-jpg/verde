import { eq } from "drizzle-orm";
import { db } from "@/db";
import { staff } from "@/db/schema";
import { json, setSession, verifyPassword } from "@/lib/auth";
import { ensureSeed } from "@/lib/seed";

export async function POST(req: Request) {
  await ensureSeed();
  const b = await req.json().catch(() => null);
  const username = String(b?.username ?? "").trim().toLowerCase();
  const pw = String(b?.password ?? "");
  if (!username || !pw) return json({ error: "invalid_credentials" }, 400);
  const [s] = await db.select().from(staff).where(eq(staff.username, username));
  if (!s || !s.active || !verifyPassword(pw, s.passwordHash))
    return json({ error: "invalid_credentials" }, 401);
  await setSession("staff", s.id);
  return json({ ok: true, role: s.role });
}
