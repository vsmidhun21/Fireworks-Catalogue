import { useEffect, useState } from "react";
import { AdminCategoryService } from "../../services/api";

const emptyForm = { nameEn: "", nameTa: "", descriptionEn: "", descriptionTa: "", imageUrl: "", sortOrder: 0 };

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    AdminCategoryService.list()
      .then((res) => setCategories(res.data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  }

  function openEdit(cat) {
    setEditing(cat);
    setForm({
      nameEn: cat.nameEn,
      nameTa: cat.nameTa || "",
      descriptionEn: cat.descriptionEn || "",
      descriptionTa: cat.descriptionTa || "",
      imageUrl: cat.imageUrl || "",
      sortOrder: cat.sortOrder,
    });
    setError("");
    setShowForm(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await AdminCategoryService.update(editing.id, form);
      } else {
        await AdminCategoryService.create(form);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(cat) {
    await AdminCategoryService.setStatus(cat.id, !cat.isActive);
    load();
  }

  async function handleDelete(cat) {
    if (!confirm(`Delete/archive "${cat.nameEn}"?`)) return;
    await AdminCategoryService.remove(cat.id);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-brand-navy">Categories</h1>
        <button onClick={openCreate} className="btn-primary !py-2 !px-5 text-sm">+ Add Category</button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="card-surface p-6 mb-6 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-brand-navy mb-1">English Name *</label>
            <input required value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
              className="w-full rounded-lg border border-brand-border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-brand-navy mb-1">Tamil Name</label>
            <input value={form.nameTa} onChange={(e) => setForm({ ...form, nameTa: e.target.value })}
              className="w-full rounded-lg border border-brand-border px-3 py-2 font-tamil" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-brand-navy mb-1">Description (English)</label>
            <textarea rows={2} value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })}
              className="w-full rounded-lg border border-brand-border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-brand-navy mb-1">Image URL</label>
            <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              className="w-full rounded-lg border border-brand-border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-brand-navy mb-1">Sort Order</label>
            <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
              className="w-full rounded-lg border border-brand-border px-3 py-2" />
          </div>
          {error && <p className="sm:col-span-2 text-sm text-brand-error">{error}</p>}
          <div className="sm:col-span-2 flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary !py-2 !px-5 text-sm disabled:opacity-60">
              {saving ? "Saving..." : editing ? "Update Category" : "Create Category"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-full border border-brand-border px-5 py-2 text-sm font-semibold">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="card-surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-brand-muted border-b border-brand-border">
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Slug</th>
              <th className="py-3 px-4">Sort</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="py-6 text-center text-brand-muted">Loading...</td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan={5} className="py-6 text-center text-brand-muted">No categories yet.</td></tr>
            ) : (
              categories.map((c) => (
                <tr key={c.id} className="border-b border-brand-border/60 hover:bg-brand-cream">
                  <td className="py-2.5 px-4 font-medium text-brand-navy">{c.nameEn}</td>
                  <td className="py-2.5 px-4 text-brand-muted">{c.slug}</td>
                  <td className="py-2.5 px-4">{c.sortOrder}</td>
                  <td className="py-2.5 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${c.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 space-x-3">
                    <button onClick={() => openEdit(c)} className="text-brand-primary font-semibold hover:underline">Edit</button>
                    <button onClick={() => toggleActive(c)} className="text-amber-600 font-semibold hover:underline">
                      {c.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button onClick={() => handleDelete(c)} className="text-brand-error font-semibold hover:underline">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
