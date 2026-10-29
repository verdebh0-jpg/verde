export type AddonLite = { id: number; price: number; pricingType: string };

const r = (n: number) => Math.round(n * 1000) / 1000;

export function computePricing(p: {
  price5: number;
  days: number;
  addons: AddonLite[];
  regionFee: number;
  discount?: { type: string; value: number } | null;
}) {
  const base = r((p.price5 / 5) * p.days);
  const addonsTotal = r(
    p.addons.reduce(
      (s, a) => s + (a.pricingType === "once" ? a.price : a.price * p.days),
      0,
    ),
  );
  const subtotal = r(base + addonsTotal);
  let discount = 0;
  if (p.discount) {
    discount =
      p.discount.type === "percent"
        ? r((subtotal * Math.min(p.discount.value, 100)) / 100)
        : Math.min(r(p.discount.value), subtotal);
  }
  const total = r(subtotal - discount + p.regionFee);
  return { base, addonsTotal, subtotal, discount, deliveryFee: p.regionFee, total };
}
