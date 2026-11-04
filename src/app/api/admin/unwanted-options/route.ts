import { NextResponse } from "next/server";
import { db } from "@/db";
import { unwantedOptions } from "@/db/schema";
import { eq } from "drizzle-orm";

// جلب جميع الخيارات للوحة التحكم
export async function GET() {
  const options = await db.select().from(unwantedOptions).orderBy(unwantedOptions.sortOrder);
  return NextResponse.json(options);
}

// إضافة خيار جديد
export async function POST(req: Request) {
  const b = await req.json();
  const [created] = await db.insert(unwantedOptions).values({
    nameKey: b.nameKey,
    labelAr: b.labelAr,
    labelEn: b.labelEn,
    sortOrder: Number(b.sortOrder || 0),
    active: b.active ?? true,
  }).returning();
  return NextResponse.json({ ok: true, created });
}

// تعديل خيار موجود
export async function PUT(req: Request) {
  const b = await req.json();
  if (!b.id) return NextResponse.json({ error: "id_required" }, { status: 400 });
  
  const [updated] = await db.update(unwantedOptions)
    .set({
      nameKey: b.nameKey,
      labelAr: b.labelAr,
      labelEn: b.labelEn,
      sortOrder: Number(b.sortOrder || 0),
      active: b.active ?? true,
    })
    .where(eq(unwantedOptions.id, Number(b.id)))
    .returning();
    
  return NextResponse.json({ ok: true, updated });
}

// حذف خيار
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id_required" }, { status: 400 });

  await db.delete(unwantedOptions).where(eq(unwantedOptions.id, Number(id)));
  return NextResponse.json({ ok: true });
}