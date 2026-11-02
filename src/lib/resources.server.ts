/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  addons,
  carouselImages,
  deliverySlots,
  discountCodes,
  foodOptions, // 👈 1. تم إضافة الجدول هنا
  packageOptions,
  packages,
  paymentMethods,
  popups,
  regions,
} from "@/db/schema";

export const RESOURCES: Record<string, { table: any; perm: string; order: any[] }> = {
  packages: { table: packages, perm: "packages", order: [packages.sortOrder, packages.id] },
  "package-options": { table: packageOptions, perm: "packages", order: [packageOptions.packageId, packageOptions.sortOrder, packageOptions.id] },
  addons: { table: addons, perm: "addons", order: [addons.sortOrder, addons.id] },
  "delivery-slots": { table: deliverySlots, perm: "delivery_times", order: [deliverySlots.startTime, deliverySlots.id] },
  regions: { table: regions, perm: "regions", order: [regions.sortOrder, regions.id] },
  discounts: { table: discountCodes, perm: "discounts", order: [discountCodes.id] },
  popups: { table: popups, perm: "popups", order: [popups.id] },
  carousel: { table: carouselImages, perm: "settings", order: [carouselImages.sortOrder, carouselImages.id] },
  "payment-methods": { table: paymentMethods, perm: "settings", order: [paymentMethods.sortOrder, paymentMethods.id] },
  "food-options": { table: foodOptions, perm: "settings", order: [foodOptions.id] }, // 👈 2. تم إضافته إلى القائمة هنا
};

export const NO_CREATE = new Set(["payment-methods"]);
export const NO_DELETE = new Set(["payment-methods"]);