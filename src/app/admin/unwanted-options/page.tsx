"use client";

import { useEffect, useState } from "react";

interface UnwantedOption {
  id: number;
  nameKey: string;
  labelAr: string;
  labelEn: string;
  sortOrder: number;
  active: boolean;
}

export default function UnwantedOptionsAdminPage() {
  const [options, setOptions] = useState<UnwantedOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nameKey: "", labelAr: "", labelEn: "", sortOrder: 0, active: true });
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchOptions = async () => {
    setLoading(true);
    const res = await fetch("/admin/unwanted-options");
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

    const res = await fetch("/admin/unwanted-options", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setForm({ nameKey: "", labelAr: "", labelEn: "", sortOrder: 0, active: true });
      setEditingId(null);
      fetchOptions();
    }
  };

  const handleEdit = (item: UnwantedOption) => {
    setEditingId(item.id);
    setForm({ nameKey: item.nameKey, labelAr: item.labelAr, labelEn: item.labelEn, sortOrder: item.sortOrder, active: item.active });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من الحذف؟")) return;
    const res = await fetch(`/admin/unwanted-options?id=${id}`, { method: "DELETE" });
    if (res.ok) fetchOptions();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">إدارة الأكلات غير المرغوبة (Unwanted Options)</h1>

      {/* نموذج الإضافة والتعديل */}
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">المفتاح الإنجليزي (Name Key)</label>
          <input
            type="text"
            value={form.nameKey}
            onChange={(e) => setForm({ ...form, nameKey: e.target.value })}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">الاسم بالعربي (Label Ar)</label>
          <input
            type="text"
            value={form.labelAr}
            onChange={(e) => setForm({ ...form, labelAr: e.target.value })}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">الاسم بالإنجليزي (Label En)</label>
          <input
            type="text"
            value={form.labelEn}
            onChange={(e) => setForm({ ...form, labelEn: e.target.value })}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">ترتيب العرض (Sort Order)</label>
          <input
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
            className="w-full border p-2 rounded"
          />
        </div>
        <div className="flex items-center gap-2 md:col-span-2">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
            className="w-4 h-4"
          />
          <label className="text-sm font-medium">مفعل (Active)</label>
        </div>
        <div className="md:col-span-2 flex gap-2">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            {editingId ? "تحديث الخيار" : "إضافة خيار جديد"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => { setEditingId(null); setForm({ nameKey: "", labelAr: "", labelEn: "", sortOrder: 0, active: true }); }}
              className="bg-gray-400 text-white px-4 py-2 rounded"
            >
              إلغاء
            </button>
          )}
        </div>
      </form>

      {/* جدول العرض */}
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
                <th className="p-3">الإنجليزي</th>
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
                  <td className="p-3">{item.labelEn}</td>
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