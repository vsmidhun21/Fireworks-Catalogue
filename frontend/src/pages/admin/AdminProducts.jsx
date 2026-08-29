import { useEffect, useState } from "react";
import { AdminProductService, AdminCategoryService } from "../../services/api";
import { formatCurrency } from "../../utils/format";

const emptyForm = {
  categoryId: "", productCode: "", nameEn: "", nameTa: "", descriptionEn: "", descriptionTa: "",
  unit: "Box", originalPrice: "", discountedPrice: "", imageUrl: "", isFeatured: false, isNewArrival: false, sortOrder: 0,
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    AdminProductService.list({ search, limit: 50 })
      .then((res) => setProducts(res.data.items))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    AdminCategoryService.list().then((res) => setCategories(res.data));
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, categoryId: categories[0]?.id || "" });
    setError("");
    setShowForm(true);
  }

  function openEdit(p) {
    setEditing(p);
    setForm({
      categoryId: p.categoryId,
      productCode: p.productCode,
      nameEn: p.nameEn,
      nameTa: p.nameTa || "",
      descriptionEn: p.descriptionEn || "",
      descriptionTa: p.descriptionTa || "",
      unit: p.unit,
      originalPrice: p.originalPrice,
      discountedPrice: p.discountedPrice ?? "",
      imageUrl: p.imageUrl || "",
      isFeatured: p.isFeatured,
      isNewArrival: p.isNewArrival,
      sortOrder: p.sortOrder,
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
        await AdminProductService.update(editing.id, form);
      } else {
        await AdminProductService.create(form);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(p) {
    await AdminProductService.setStatus(p.id, !p.isActive);
    load();
  }
  async function toggleFeatured(p) {
    await AdminProductService.setFeatured(p.id, !p.isFeatured);
    load();
  }
  async function handleDelete(p) {
    if (!confirm(`Delete/archive "${p.nameEn}"?`)) return;
    await AdminProductService.remove(p.id);
    load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-display text-2xl font-bold text-brand-navy">Products</h1>
        <div className="flex gap-3">
          <input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-full border border-brand-border px-4 py-2 text-sm"
          />
          <button onClick={openCreate} className="btn-primary !py-2 !px-5 text-sm">+ Add Product</button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="card-surface p-6 mb-6 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-brand-navy mb-1">Category *</label>
            <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full rounded-lg border border-brand-border px-3 py-2">
              <option value="">Select category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.nameEn}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-brand-navy mb-1">Product Code *</label>
            <input required value={form.productCode} onChange={(e) => setForm({ ...form, productCode: e.target.value })}
              className="w-full rounded-lg border border-brand-border px-3 py-2" />
          </div>
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
            <label className="block text-sm font-semibold text-brand-navy mb-1">Unit</label>
            <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className="w-full rounded-lg border border-brand-border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-brand-navy mb-1">Image URL</label>
            <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              className="w-full rounded-lg border border-brand-border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-brand-navy mb-1">Original Price (₹) *</label>
            <input required type="number" step="0.01" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
              className="w-full rounded-lg border border-brand-border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-brand-navy mb-1">Discounted Price (₹)</label>
            <input type="number" step="0.01" value={form.discountedPrice} onChange={(e) => setForm({ ...form, discountedPrice: e.target.value })}
              className="w-full rounded-lg border border-brand-border px-3 py-2" />
          </div>
          <div className="flex items-center gap-6 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={form.isNewArrival} onChange={(e) => setForm({ ...form, isNewArrival: e.target.checked })} />
              New Arrival
            </label>
          </div>
          {error && <p className="sm:col-span-2 text-sm text-brand-error">{error}</p>}
          <div className="sm:col-span-2 flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary !py-2 !px-5 text-sm disabled:opacity-60">
              {saving ? "Saving..." : editing ? "Update Product" : "Create Product"}
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
              <th className="py-3 px-4">Code</th>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Price</th>
              <th className="py-3 px-4">Featured</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="py-6 text-center text-brand-muted">Loading...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={7} className="py-6 text-center text-brand-muted">No products found.</td></tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-b border-brand-border/60 hover:bg-brand-cream">
                  <td className="py-2.5 px-4 text-brand-muted">{p.productCode}</td>
                  <td className="py-2.5 px-4 font-medium text-brand-navy">{p.nameEn}</td>
                  <td className="py-2.5 px-4 text-brand-muted">{p.category?.nameEn}</td>
                  <td className="py-2.5 px-4">
                    {formatCurrency(p.discountedPrice ?? p.originalPrice)}
                    {p.discountedPrice && <span className="text-xs text-brand-muted line-through ml-1">{formatCurrency(p.originalPrice)}</span>}
                  </td>
                  <td className="py-2.5 px-4">
                    <button onClick={() => toggleFeatured(p)} className={p.isFeatured ? "text-brand-gold" : "text-brand-border"}>★</button>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 space-x-3 whitespace-nowrap">
                    <button onClick={() => openEdit(p)} className="text-brand-primary font-semibold hover:underline">Edit</button>
                    <button onClick={() => toggleActive(p)} className="text-amber-600 font-semibold hover:underline">
                      {p.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button onClick={() => handleDelete(p)} className="text-brand-error font-semibold hover:underline">Delete</button>
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
