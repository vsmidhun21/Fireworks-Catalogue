import { useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2, Power, Check, X, Loader2, FolderTree, Upload } from "lucide-react";
import { AdminCategoryService } from "../../services/api";
import { getProductImageUrl, onImageError } from "../../utils/image";
import Pagination from "../../components/common/Pagination";

const emptyForm = { nameEn: "", nameTa: "", descriptionEn: "", descriptionTa: "", sortOrder: 0, imageFile: null };
const PAGE_SIZE = 10;

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const fileInputRef = useRef(null);

  function cleanupPreview() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }
  }

  function load(nextPage = page) {
    setLoading(true);
    AdminCategoryService.list({ page: nextPage, limit: PAGE_SIZE })
      .then((res) => {
        setCategories(res.data.items);
        setTotal(res.data.total);
        setPage(res.data.page);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    return () => cleanupPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    cleanupPreview();
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  }

  function openEdit(cat) {
    cleanupPreview();
    setEditing(cat);
    setForm({
      nameEn: cat.nameEn,
      nameTa: cat.nameTa || "",
      descriptionEn: cat.descriptionEn || "",
      descriptionTa: cat.descriptionTa || "",
      sortOrder: cat.sortOrder,
      imageFile: null,
    });
    setError("");
    setShowForm(true);
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    cleanupPreview();
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setForm((prev) => ({ ...prev, imageFile: file, imageUrl: undefined }));
  }

  function handleRemoveImage() {
    cleanupPreview();
    setForm((prev) => ({ ...prev, imageFile: null, imageUrl: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const hasImage = Boolean(previewUrl || (form.imageUrl !== "" && editing?.imageUrl));

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
      cleanupPreview();
      setShowForm(false);
      load(editing ? page : 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(cat) {
    await AdminCategoryService.setStatus(cat.id, !cat.isActive);
    load(page);
  }

  async function handleDelete(cat) {
    if (!confirm(`Delete/archive "${cat.nameEn}"?`)) return;
    await AdminCategoryService.remove(cat.id);
    const nextPage = categories.length === 1 && page > 1 ? page - 1 : page;
    load(nextPage);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-navy">Product Categories</h1>
          <p className="text-sm text-brand-muted">Organize cracker types and classifications</p>
        </div>
        <button onClick={openCreate} className="btn-primary !py-2 !px-4 text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="card-surface p-6 rounded-2xl border-2 border-brand-primary/20 shadow-sm grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 flex items-center justify-between pb-3 border-b border-brand-border">
            <h2 className="font-display text-lg font-bold text-brand-navy">
              {editing ? `Edit Category: ${editing.nameEn}` : "Add New Category"}
            </h2>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="p-1 rounded-full text-brand-muted hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-navy mb-1">English Name *</label>
            <input
              required
              placeholder="e.g. Flower Pots"
              value={form.nameEn}
              onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
              className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-navy mb-1">Tamil Name</label>
            <input
              placeholder="Enter Tamil category name"
              value={form.nameTa}
              onChange={(e) => setForm({ ...form, nameTa: e.target.value })}
              className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:outline-none focus:border-brand-primary font-tamil"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-brand-navy mb-1">Description (English)</label>
            <textarea
              rows={2}
              value={form.descriptionEn}
              onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })}
              className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-navy mb-1">Sort Order</label>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
              className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div className="sm:col-span-2 rounded-xl border border-brand-border bg-slate-50 p-4">
            <label className="mb-2 block text-sm font-semibold text-brand-navy">Category Image</label>
            <div className="grid items-center gap-4 sm:grid-cols-[180px_1fr]">
              <div className="overflow-hidden rounded-xl border border-brand-border bg-white">
                <img
                  src={getProductImageUrl(previewUrl || (form.imageUrl === "" ? "" : editing?.imageUrl))}
                  alt="Category preview"
                  onError={onImageError}
                  className="h-28 w-full object-cover"
                />
              </div>
              <div className="space-y-3">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-lg bg-brand-navy px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navy/90"
                  >
                    <Upload className="h-4 w-4" />
                    <span>{hasImage ? "Change Image" : "Upload Image"}</span>
                  </button>
                  {hasImage && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="inline-flex items-center gap-2 rounded-lg border border-brand-border px-4 py-2 text-sm font-semibold text-brand-muted hover:bg-slate-100"
                    >
                      <X className="h-4 w-4" />
                      <span>Remove Image</span>
                    </button>
                  )}
                </div>
                <p className="text-xs text-brand-muted">JPG, PNG or WebP. Recommended landscape image.</p>
              </div>
            </div>
          </div>

          {error && <p className="sm:col-span-2 text-sm text-brand-error">{error}</p>}

          <div className="sm:col-span-2 flex gap-3 pt-2 border-t border-brand-border">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary !py-2.5 !px-6 text-sm flex items-center gap-2 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{editing ? "Update Category" : "Create Category"}</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-full border border-brand-border px-5 py-2 text-sm font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="card-surface overflow-hidden border border-brand-border/80 rounded-2xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50 text-brand-muted border-b border-brand-border uppercase text-[11px] tracking-wider font-semibold">
                <th className="py-3.5 px-4">Name</th>
                <th className="py-3.5 px-4">Slug</th>
                <th className="py-3.5 px-4">Sort</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-brand-muted">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-primary" />
                    <span>Loading categories...</span>
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-brand-muted">
                    <FolderTree className="w-8 h-8 mx-auto mb-2 text-brand-border" />
                    <span>No categories found.</span>
                  </td>
                </tr>
              ) : (
                categories.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-brand-navy">
                      <div className="flex items-center gap-3">
                        <img
                          src={getProductImageUrl(c.imageUrl)}
                          alt={c.nameEn}
                          onError={onImageError}
                          className="h-10 w-14 shrink-0 rounded-lg border border-brand-border/60 object-cover"
                        />
                        <div>
                          <div>{c.nameEn}</div>
                          {c.nameTa && <div className="text-xs text-brand-muted font-tamil font-normal">{c.nameTa}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-brand-muted">{c.slug}</td>
                    <td className="py-3 px-4 text-brand-muted">{c.sortOrder}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          c.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${c.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                        {c.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => openEdit(c)}
                          title="Edit Category"
                          className="p-1.5 rounded-lg text-brand-primary hover:bg-brand-primary/10 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleActive(c)}
                          title={c.isActive ? "Deactivate Category" : "Activate Category"}
                          className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          title="Delete Category"
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-4">
          <Pagination page={page} total={total} pageSize={PAGE_SIZE} onPageChange={load} />
        </div>
      </div>
    </div>
  );
}
