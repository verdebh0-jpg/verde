import { db } from "@/db";
import { uploads } from "@/db/schema";
import { json, staffForApi } from "@/lib/auth";

export async function POST(req: Request) {
  const s = await staffForApi();
  if (!s) return json({ error: "unauthorized" }, 401);
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return json({ error: "no_file" }, 400);
  if (!file.type.startsWith("image/")) return json({ error: "not_image" }, 400);
  if (file.size > 4 * 1024 * 1024) return json({ error: "too_large" }, 413);
  const data = Buffer.from(await file.arrayBuffer()).toString("base64");
  const [row] = await db
    .insert(uploads)
    .values({ mime: file.type, data })
    .returning({ id: uploads.id });
  return json({ url: `/api/uploads/${row.id}` });
}
