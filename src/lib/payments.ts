/**
 * Payment gateway adapter.
 *
 * IMPORTANT: this is a sandbox/simulated gateway so the whole flow works
 * end-to-end without credentials. To go live, replace `chargePayment` with a
 * call to a real provider (e.g. BenefitPay / Benefit Payment Gateway, Tap,
 * Credimax, Stripe) and keep the same return shape. Card numbers are never stored.
 */
export type PaymentInput = {
  method: string;
  amount: number;
  card?: { number?: string; expiry?: string; cvv?: string; holder?: string };
  benefitPhone?: string;
};

export type PaymentResult =
  | { ok: true; status: "paid" | "cod"; reference: string; last4: string }
  | { ok: false; error: string };

function luhn(num: string) {
  let sum = 0;
  let alt = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let n = Number(num[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

const ref = (p: string) =>
  `${p}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

export async function chargePayment(input: PaymentInput): Promise<PaymentResult> {
  if (input.method === "cash") {
    return { ok: true, status: "cod", reference: ref("COD"), last4: "" };
  }
  if (input.method === "benefitpay") {
    const phone = (input.benefitPhone ?? "").replace(/\D/g, "");
    if (phone.length < 8) return { ok: false, error: "invalid_benefit_phone" };
    return { ok: true, status: "paid", reference: ref("BP"), last4: "" };
  }
  if (input.method === "card") {
    const number = (input.card?.number ?? "").replace(/\s/g, "");
    const cvv = input.card?.cvv ?? "";
    const m = /^(\d{2})\s*\/\s*(\d{2})$/.exec(input.card?.expiry ?? "");
    if (!/^\d{13,19}$/.test(number) || !luhn(number)) return { ok: false, error: "invalid_card" };
    if (!/^\d{3,4}$/.test(cvv)) return { ok: false, error: "invalid_card" };
    if (!m) return { ok: false, error: "invalid_card" };
    const month = Number(m[1]);
    const year = 2000 + Number(m[2]);
    const now = new Date();
    if (month < 1 || month > 12 || year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1))
      return { ok: false, error: "card_expired" };
    // test card that is always declined
    if (number === "4000000000000002") return { ok: false, error: "card_declined" };
    return { ok: true, status: "paid", reference: ref("CARD"), last4: number.slice(-4) };
  }
  return { ok: false, error: "invalid_method" };
}
