import { clearSession, json } from "@/lib/auth";

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  await clearSession(b?.kind === "staff" ? "staff" : "customer");
  return json({ ok: true });
}
