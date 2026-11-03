export type Opt = { value: string | number; label: string };

export type Field = {
  key: string;
  label: [string, string];
  type:
    | "text"
    | "textarea"
    | "number"
    | "bool"
    | "date"
    | "time"
    | "image"
    | "select"
    | "numselect";
  required?: boolean;
  list?: boolean;
  options?: Opt[];
};

const nameAr: Field = { key: "nameAr", label: ["الاسم (عربي)", "Name (Arabic)"], type: "text", required: true, list: true };
const nameEn: Field = { key: "nameEn", label: ["الاسم (إنجليزي)", "Name (English)"], type: "text", required: true, list: true };
const sort: Field = { key: "sortOrder", label: ["الترتيب", "Sort order"], type: "number" };
const active: Field = { key: "active", label: ["مفعّل", "Active"], type: "bool", list: true };
const startDate: Field = { key: "startDate", label: ["من تاريخ", "From date"], type: "date", list: true };
const endDate: Field = { key: "endDate", label: ["إلى تاريخ", "To date"], type: "date", list: true };

export const RESOURCE_FIELDS: Record<string, Field[]> = {
  packages: [
    nameAr,
    nameEn,
    { key: "descAr", label: ["الوصف (عربي)", "Description (Arabic)"], type: "textarea" },
    { key: "descEn", label: ["الوصف (إنجليزي)", "Description (English)"], type: "textarea" },
    { key: "protein", label: ["البروتين", "Protein"], type: "number", list: true },
    { key: "carbs", label: ["الكارب", "Carbs"], type: "number", list: true },
    { key: "image", label: ["صورة", "Image"], type: "image" },
    sort,
    active,
  ],
  "package-options": [
    { key: "packageId", label: ["الباقة", "Package"], type: "numselect", required: true, list: true },
    { key: "labelAr", label: ["الوصف (عربي)", "Label (Arabic)"], type: "text", required: true, list: true },
    { key: "labelEn", label: ["الوصف (إنجليزي)", "Label (English)"], type: "text", required: true, list: true },
    { key: "mealsPerDay", label: ["عدد الوجبات يومياً", "Meals per day"], type: "number", list: true },
    { key: "price5", label: ["السعر لكل 5 أيام (د.ب)", "Price per 5 days (BD)"], type: "number", list: true },
    sort,
    active,
  ],
  // 🌟 أضفنا هذا القسم هنا ليتوافق مع لوحة التحكم CrudManager تماماً
  "custom-meals": [
    nameAr,
    nameEn,
    {
      key: "category",
      label: ["التصنيف", "Category"],
      type: "select",
      required: true,
      list: true,
      options: [
        { value: "protein", label: "protein / بروتين" },
        { value: "carb", label: "carb / كارب" },
        { value: "packaging", label: "packaging / تغليف" },
        { value: "side", label: "side / إضافة جانبية" },
      ],
    },
    { key: "price", label: ["السعر الإضافي (د.ب)", "Extra Price (BD)"], type: "number", list: true },
    sort,
    active,
  ],
  addons: [
    nameAr,
    nameEn,
    { key: "price", label: ["السعر (د.ب)", "Price (BD)"], type: "number", list: true },
    {
      key: "pricingType",
      label: ["طريقة الاحتساب", "Pricing type"],
      type: "select",
      list: true,
      options: [
        { value: "per_day", label: "per day / لكل يوم" },
        { value: "once", label: "once / مرة واحدة" },
      ],
    },
    sort,
    active,
  ],
  "delivery-slots": [
    { key: "groupAr", label: ["اسم الفترة (عربي)", "Period name (Arabic)"], type: "text", list: true },
    { key: "groupEn", label: ["اسم الفترة (إنجليزي)", "Period name (English)"], type: "text", list: true },
    { key: "startTime", label: ["من الساعة", "From"], type: "time", required: true, list: true },
    { key: "endTime", label: ["إلى الساعة", "To"], type: "time", required: true, list: true },
    sort,
    active,
  ],
  regions: [
    nameAr,
    nameEn,
    { key: "fee", label: ["رسوم التوصيل (د.ب)", "Delivery fee (BD)"], type: "number", list: true },
    sort,
    active,
  ],
  discounts: [
    { key: "code", label: ["الكود", "Code"], type: "text", required: true, list: true },
    {
      key: "type",
      label: ["نوع الخصم", "Type"],
      type: "select",
      list: true,
      options: [
        { value: "percent", label: "% percent / نسبة" },
        { value: "fixed", label: "BD fixed / مبلغ ثابت" },
      ],
    },
    { key: "value", label: ["القيمة", "Value"], type: "number", list: true },
    startDate,
    endDate,
    { key: "usageCount", label: ["عدد الاستخدامات", "Times used"], type: "number", list: true },
    active,
  ],
  popups: [
    { key: "titleAr", label: ["العنوان (عربي)", "Title (Arabic)"], type: "text", list: true },
    { key: "titleEn", label: ["العنوان (إنجليزي)", "Title (English)"], type: "text", list: true },
    { key: "bodyAr", label: ["النص (عربي)", "Text (Arabic)"], type: "textarea" },
    { key: "bodyEn", label: ["النص (إنجليزي)", "Text (English)"], type: "textarea" },
    { key: "image", label: ["صورة", "Image"], type: "image", list: true },
    startDate,
    endDate,
    active,
  ],
  carousel: [
    { key: "image", label: ["الصورة", "Image"], type: "image", required: true, list: true },
    { key: "captionAr", label: ["التعليق (عربي)", "Caption (Arabic)"], type: "text", list: true },
    { key: "captionEn", label: ["التعليق (إنجليزي)", "Caption (English)"], type: "text", list: true },
    sort,
    active,
  ],
  "payment-methods": [nameAr, nameEn, sort, active],
};

export function coerce(
  fields: Field[],
  body: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    if (!(f.key in body)) continue;
    const v = body[f.key];
    switch (f.type) {
      case "number":
        out[f.key] = Number.isFinite(Number(v)) ? Number(v) : 0;
        break;
      case "numselect":
        out[f.key] = Number(v) || 0;
        break;
      case "bool":
        out[f.key] = Boolean(v);
        break;
      case "date":
        out[f.key] = v ? String(v).slice(0, 10) : null;
        break;
      default:
        out[f.key] = v == null ? "" : String(v).trim();
    }
  }
  if (typeof out.code === "string") out.code = out.code.toUpperCase();
  return out;
}