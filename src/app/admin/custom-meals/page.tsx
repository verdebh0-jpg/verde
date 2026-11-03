import ResourcePage from "@/components/ResourcePage"; // أو التأكد من المسار النسبي الصحيح

export default function CustomMealsAdminPage() {
  return (
    <ResourcePage
      resource="custom-meals"
      titleAr="طلبات من اختيارك"
      titleEn="Custom Built Meals"
      fields={[
        { name: "nameAr", label: "الاسم بالعربي", type: "text", required: true },
        { name: "nameEn", label: "الاسم بالإنجليزية", type: "text", required: true },
        {
          name: "category",
          label: "التصنيف",
          type: "select",
          required: true,
          options: [
            { value: "protein", label: "بروتين (Protein)" },
            { value: "carb", label: "كارب (Carb)" },
            { value: "packaging", label: "تغليف (Packaging)" },
            { value: "side", label: "إضافة جانبية (Side Addon)" },
          ],
        },
        { name: "price", label: "السعر الإضافي (د.ب)", type: "number", step: "0.001", required: true },
        { name: "active", label: "مفعل", type: "boolean" },
      ]}
    />
  );
}