import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customers, staff } from "@/db/schema";

const SECRET = process.env.SESSION_SECRET || "verde-change-this-secret-in-production";
const MAX_AGE = 60 * 60 * 24 * 7;

export function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(pw: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(pw, salt, 64);
  const orig = Buffer.from(hash, "hex");
  return orig.length === test.length && crypto.timingSafeEqual(orig, test);
}

type Kind = "customer" | "staff";
const cookieName = (k: Kind) => (k === "customer" ? "verde_c" : "verde_s");

function sign(payload: string) {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export async function setSession(kind: Kind, id: number) {
  const payload = Buffer.from(
    JSON.stringify({ id, exp: Date.now() + MAX_AGE * 1000 }),
  ).toString("base64url");
  const jar = await cookies();
  jar.set(cookieName(kind), `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSession(kind: Kind) {
  const jar = await cookies();
  jar.delete(cookieName(kind));
}

async function readSession(kind: Kind): Promise<number | null> {
  const jar = await cookies();
  const raw = jar.get(cookieName(kind))?.value;
  if (!raw) return null;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  )
    return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof data.id !== "number" || data.exp < Date.now()) return null;
    return data.id;
  } catch {
    return null;
  }
}

export async function getCustomer() {
  const id = await readSession("customer");
  if (!id) return null;
  const [c] = await db.select().from(customers).where(eq(customers.id, id));
  return c ?? null;
}

export type StaffRow = typeof staff.$inferSelect;

export async function getStaff(): Promise<StaffRow | null> {
  const id = await readSession("staff");
  if (!id) return null;
  const [s] = await db.select().from(staff).where(eq(staff.id, id));
  return s && s.active ? s : null;
}

export function hasPerm(s: StaffRow, perm: string): boolean {
  if (s.role === "owner") return true;
  if (s.role === "kitchen") return perm === "orders";
  return (s.permissions ?? []).includes(perm);
}

export async function requireStaffPage(perm?: string) {
  const s = await getStaff();
  if (!s) redirect("/staff/login");
  if (perm && !hasPerm(s, perm)) redirect(s.role === "kitchen" ? "/kitchen" : "/admin");
  return s;
}

/** For API routes: returns staff row or null (caller returns 401/403). */
export async function staffForApi(perm?: string): Promise<StaffRow | null> {
  const s = await getStaff();
  if (!s) return null;
  if (perm && !hasPerm(s, perm)) return null;
  return s;
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}
