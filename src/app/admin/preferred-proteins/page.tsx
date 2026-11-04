"use client";

import { useEffect, useState } from "react";

interface PreferredProtein {
  id: number;
  nameKey: string;
  labelAr: string;
  labelEn: string;
  freePolicy: string;
  extraPrice: number;
  sortOrder: number;
  active: boolean;
}

export default function PreferredProteinsAdminPage() {
  const [options, setOptions] = useState<PreferredProtein[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    nameKey: "",
    labelAr: "",
    labelEn: "",
    freePolicy: "one_time_free",
    extraPrice: 0,
    sortOrder: 0,
    active: true,
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchOptions = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/preferred-proteins");
    const data = await res.json();
    setOptions(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingId ? "PUT" : "POST";
    const body = editingId ? { ...form, id: editingId } : form;

    const res = await fetch("/api/admin/preferred-proteins", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setForm({ nameKey: "", labelAr: "", labelEn: "", freePolicy: "one_time_free", extraPrice: 0, sortOrder: 0, active: true });
      setEditingId(null);
      fetchOptions();
    }
  };

  const handleEdit = (item: PreferredProtein) => {
    setEditingId(item.id);
    setForm({
      nameKey: item.nameKey,
      labelAr: item.labelAr,
      labelEn: item.labelEn,
      freePolicy: item.freePolicy,
      extraPrice: item.extraPrice,
      sortOrder: item.sortOrder,
      active: item.active,
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من الحذف؟")) return;
    const res = await fetch(`/api/admin/preferred-proteins?id=${id}`, { method: "DELETE" });
    if (res.ok) fetchOptions();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">إدارة البروتينات المفضلة وقواعد الأسعار التكرارية</h1>

      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">المفتاح (Name Key)</label>
          <input
            type="text"
            value={form.nameKey}
            onChange={(e) => setForm({ ...form, nameKey: e.target.value })}
            className="w-full border p-2 rounded"
            placeholder="e.g. chicken, meat"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">الاسم بالعربي</label>
          <input
            type="text"
            value={form.labelAr}
            onChange={(e) => setForm({ ...form, labelAr: e.target.value })}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">الاسم بالإنجليزي</label>
          <input
            type="text"
            value={form.labelEn}
            onChange={(e) => setForm({ ...form, labelEn: e.target.value })}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">سياسة الحصة المجانية</label>
          <select
            value={form.freePolicy}
            onChange={(e) => setForm({ ...form, freePolicy: e.target.value })}
            className="w-full border p-2 rounded"
          >
            <option value="one_time_free">مجاني لوجبة واحدة فقط والباقي برسوم</option>
            <option value="always_free">مجاني طوال فترة الاشتراك (مثل الدجاج)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">رسوم التكرار الإضافية</label>
          <input
            type="number"
            step="0.001"
            value={form.extraPrice}
            onChange={(e) => setForm({ ...form, extraPrice: Number(e.target.value) })}
            className="w-full border p-2 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">ترتيب العرض</label>
          <input
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
            className="w-full border p-2 rounded"
          />
        </div>
        <div className="flex items-center gap-2 md:col-span-3">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
            className="w-4 h-4"
          />
          <label className="text-sm font-medium">مفعل</label>
        </div>
        <div className="md:col-span-3 flex gap-2">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            {editingId ? "تحديث الخيار" : "إضافة بروتين جديد"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm({ nameKey: "", labelAr: "", labelEn: "", freePolicy: "one_time_free", extraPrice: 0, sortOrder: 0, active: true });
              }}
              className="bg-gray-400 text-white px-4 py-2 rounded"
            >
              إلغاء
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <p>جاري التحميل...</p>
      ) : (
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full border-collapse text-right">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="p-3">الترتيب</th>
                <th className="p-3">المفتاح</th>
                <th className="p-3">العربي</th>
                <th className="p-3">السياسة المجانية</th>
                <th className="p-3">رسوم التكرار</th>
                <th className="p-3">الحالة</th>
                <th className="p-3">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {options.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{item.sortOrder}</td>
                  <td className="p-3">{item.nameKey}</td>
                  <td className="p-3">{item.labelAr}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${item.freePolicy === "always_free" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}>
                      {item.freePolicy === "always_free" ? "مجاني كلياً (دجاج)" : "مجاني لوجبة واحدة"}
                    </span>
                  </td>
                  <td className="p-3">{item.extraPrice} د.ب</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${item.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {item.active ? "مفعل" : "معطل"}
                    </span>
                  </td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => handleEdit(item)} className="bg-amber-500 text-white px-3 py-1 rounded text-sm">تعديل</button>
                    <button onClick={() => handleDelete(item.id)} className="bg-red-600 text-white px-3 py-1 rounded text-sm">حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}