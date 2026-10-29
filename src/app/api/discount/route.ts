import { json } from "@/lib/auth";
import { findDiscount } from "@/lib/discount";

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const d = await findDiscount(String(b?.code ?? ""));
  if (!d) return json({ error: "invalid_code" }, 404);
  return json({ code: d.code, type: d.type, value: d.value });
}
