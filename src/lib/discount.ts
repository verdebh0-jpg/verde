import { and, eq, gte, isNull, lte, or } from "drizzle-orm";
import { db } from "@/db";
import { discountCodes } from "@/db/schema";
import { todayBH } from "./dates";

export async function findDiscount(code: string) {
  const c = code.trim().toUpperCase();
  if (!c) return null;
  const today = todayBH();
  const [d] = await db
    .select()
    .from(discountCodes)
    .where(
      and(
        eq(discountCodes.code, c),
        eq(discountCodes.active, true),
        or(isNull(discountCodes.startDate), lte(discountCodes.startDate, today)),
        or(isNull(discountCodes.endDate), gte(discountCodes.endDate, today)),
      ),
    );
  return d ?? null;
}
