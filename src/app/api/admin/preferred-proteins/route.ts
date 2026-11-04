import { NextResponse } from "next/server";
import { db } from "@/db";
import { preferredProteins } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const options = await db.select().from(preferredProteins).orderBy(preferredProteins.sortOrder);
  return NextResponse.json(options);
}

export async function POST(req: Request) {
  const b = await req.json();
  const [created] = await db.insert(preferredProteins).values({
    nameKey: b.nameKey,
    labelAr: b.labelAr,
    labelEn: b.labelEn,
    freePolicy: b.freePolicy || "one_time_free",
    extraPrice: Number(b.extraPrice || 0),
    sortOrder: Number(b.sortOrder || 0),
    active: b.active ?? true,
  }).returning();
  return NextResponse.json({ ok: true, created });
}

export async function PUT(req: Request) {
  const b = await req.json();
  if (!b.id) return NextResponse.json({ error: "id_required" }, { status: 400 });
  
  const [updated] = await db.update(preferredProteins)
    .set({
      nameKey: b.nameKey,
      labelAr: b.labelAr,
      labelEn: b.labelEn,
      freePolicy: b.freePolicy,
      extraPrice: Number(b.extraPrice || 0),
      sortOrder: Number(b.sortOrder || 0),
      active: b.active ?? true,
    })
    .where(eq(preferredProteins.id, Number(b.id)))
    .returning();
    
  return NextResponse.json({ ok: true, updated });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id_required" }, { status: 400 });

  await db.delete(preferredProteins).where(eq(preferredProteins.id, Number(id)));
  return NextResponse.json({ ok: true });
}