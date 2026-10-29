export type SettingField = {
  key: string;
  label: [string, string];
  type: "text" | "textarea" | "image";
  def: string;
};

type T = [string, string, string, "text" | "textarea", string, string];

const TEXTS: T[] = [
  ["hero_title", "عنوان الواجهة الرئيسية", "Hero title", "text", "وجبات صحية طازجة تصل إلى باب بيتك", "Fresh healthy meals, delivered to your door"],
  ["hero_subtitle", "الوصف الفرعي للواجهة", "Hero subtitle", "textarea", "اشتراكات وجبات يومية مصممة حسب هدفك: زيادة الوزن أو المحافظة عليه أو خسارته — في جميع مناطق البحرين.", "Daily meal plans tailored to your goal: gain, maintain or lose weight — across Bahrain."],
  ["hero_cta", "نص زر الاشتراك", "Subscribe button text", "text", "اشترك الآن", "Subscribe now"],
  ["gallery_title", "عنوان معرض الأطباق", "Gallery title", "text", "أطباقنا", "Our dishes"],
  ["gallery_subtitle", "وصف معرض الأطباق", "Gallery subtitle", "textarea", "نماذج من وجباتنا اليومية. الصور للعرض فقط وتقدَّم ضمن باقات الاشتراك.", "A taste of our daily meals. Images are for display only and are served within the subscription plans."],
  ["plans_title", "عنوان الباقات", "Plans title", "text", "باقات الاشتراك", "Meal plans"],
  ["plans_subtitle", "وصف الباقات", "Plans subtitle", "textarea", "اختر الخطة المناسبة لهدفك. الأسعار لكل 5 أيام ويمكن الاشتراك من 5 إلى 30 يوماً.", "Pick the plan that fits your goal. Prices are per 5 days; subscribe from 5 to 30 days."],
  ["feat1_title", "الميزة 1 - العنوان", "Feature 1 - title", "text", "طازج 100%", "100% fresh"],
  ["feat1_body", "الميزة 1 - النص", "Feature 1 - text", "textarea", "نحضّر وجباتنا يومياً من مكوّنات طازجة وعالية الجودة.", "Our meals are prepared daily from fresh, high-quality ingredients."],
  ["feat2_title", "الميزة 2 - العنوان", "Feature 2 - title", "text", "مصمّمة لهدفك", "Built for your goal"],
  ["feat2_body", "الميزة 2 - النص", "Feature 2 - text", "textarea", "نسب بروتين وكارب محسوبة بدقة لكل خطة.", "Protein and carb portions calculated precisely for each plan."],
  ["feat3_title", "الميزة 3 - العنوان", "Feature 3 - title", "text", "توصيل في وقتك", "Delivery on your time"],
  ["feat3_body", "الميزة 3 - النص", "Feature 3 - text", "textarea", "اختر الفترة والساعة التي تناسبك لاستلام وجباتك.", "Choose the period and hour that suit you to receive your meals."],
  ["footer", "نص التذييل", "Footer text", "text", "ڤيردي للوجبات الصحية — البحرين", "Verde Healthy Meals — Bahrain"],
];

export const SETTING_FIELDS: SettingField[] = [
  { key: "logo", label: ["الشعار (Logo)", "Logo"], type: "image", def: "" },
  { key: "hero_image", label: ["صورة الواجهة الرئيسية (خلفية)", "Hero image"], type: "image", def: "" },
  ...TEXTS.flatMap(([k, la, le, type, da, de]): SettingField[] => [
    { key: `${k}_ar`, label: [`${la} (عربي)`, `${le} (Arabic)`], type, def: da },
    { key: `${k}_en`, label: [`${la} (إنجليزي)`, `${le} (English)`], type, def: de },
  ]),
];

export const SETTING_DEFAULTS: Record<string, string> = Object.fromEntries(
  SETTING_FIELDS.map((f) => [f.key, f.def]),
);

export function st(
  s: Record<string, string>,
  base: string,
  locale: string,
): string {
  return s[`${base}_${locale}`] || s[`${base}_ar`] || s[`${base}_en`] || "";
}
