import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Pencil, Power, Trash2, Upload, X } from "lucide-react";
import { AdminPromotionService } from "../../services/api";
import { getProductImageUrl, onImageError } from "../../utils/image";
import Pagination from "../../components/common/Pagination";

const PAGE_SIZE = 10;
const emptyForm = {
  title: "",
  subtitle: "",
  ctaLabel: "",
  ctaUrl: "",
  sortOrder: 0,
  isActive: true,
  imageFile: null,
};

export default function AdminPromotions() {
  const [promotions, setPromotions] = useState([]);
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
    AdminPromotionService.list({ page: nextPage, limit: PAGE_SIZE })
      .then((res) => {
        setPromotions(res.data.items);
        setTotal(res.data.total);
        setPage(res.data.page);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load(1);
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

  function openEdit(item) {
    cleanupPreview();
    setEditing(item);
    setForm({
      title: item.title,
      subtitle: item.subtitle || "",
      ctaLabel: item.ctaLabel || "",
      ctaUrl: item.ctaUrl || "",
      sortOrder: item.sortOrder || 0,
      isActive: item.isActive,
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
    setForm((prev) => ({ ...prev, imageFile: file }));
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (!editing && !form.imageFile) {
        setError("Please upload a banner image.");
        return;
      }
      if (editing) {
        await AdminPromotionService.update(editing.id, form);
      } else {
        await AdminPromotionService.create(form);
      }
      cleanupPreview();
      setShowForm(false);
      setForm(emptyForm);
      load(editing ? page : 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(item) {
    await AdminPromotionService.setStatus(item.id, !item.isActive);
    load(page);
  }

  async function handleDelete(item) {
    if (!confirm(`Delete promotion "${item.title}"?`)) return;
    await AdminPromotionService.remove(item.id);
    const nextPage = promotions.length === 1 && page > 1 ? page - 1 : page;
    load(nextPage);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-navy">Promotions</h1>
          <p className="text-sm text-brand-muted">Upload landing-page banners and control which ones customers see.</p>
        </div>
        <button onClick={openCreate} className="btn-primary !py-2 !px-4 text-sm flex items-center gap-2">
          <ImagePlus className="w-4 h-4" />
          <span>Add Promotion</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="card-surface grid gap-4 rounded-2xl border-2 border-brand-primary/20 p-6 sm:grid-cols-2">
          <div className="sm:col-span-2 flex items-center justify-between border-b border-brand-border pb-3">
            <h2 className="font-display text-lg font-bold text-brand-navy">
              {editing ? `Edit Promotion: ${editing.title}` : "Create Promotion"}
            </h2>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-full p-1 text-brand-muted hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-brand-navy">Title *</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-brand-navy">Sort Order</label>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
              className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-semibold text-brand-navy">Subtitle</label>
            <textarea
              rows={2}
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-brand-navy">CTA Label</label>
            <input
              value={form.ctaLabel}
              onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })}
              placeholder="Shop now"
              className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-brand-navy">CTA URL</label>
            <input
              value={form.ctaUrl}
              onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })}
              placeholder="/products"
              className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2 rounded-xl border border-brand-border bg-slate-50 p-4">
            <label className="mb-2 block text-sm font-semibold text-brand-navy">Banner Image *</label>
            <div className="grid items-center gap-4 sm:grid-cols-[180px_1fr]">
              <div className="overflow-hidden rounded-xl border border-brand-border bg-white">
                <img
                  src={getProductImageUrl(previewUrl || editing?.imageUrl)}
                  alt="Promotion preview"
                  onError={onImageError}
                  className="h-32 w-full object-cover"
                />
              </div>
              <div className="space-y-3">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-navy px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navy/90"
                >
                  <Upload className="h-4 w-4" />
                  <span>{previewUrl || editing?.imageUrl ? "Choose Another Banner" : "Upload Banner"}</span>
                </button>
                <p className="text-xs text-brand-muted">Use a wide banner image for the landing page. PNG, JPG, WebP, SVG, or GIF up to 5MB.</p>
              </div>
            </div>
          </div>

          <label className="sm:col-span-2 flex items-center gap-2 text-sm font-medium text-brand-navy">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="h-4 w-4"
            />
            <span>Show this promotion on the landing page</span>
          </label>

          {error && <p className="sm:col-span-2 text-sm text-brand-error">{error}</p>}

          <div className="sm:col-span-2 flex gap-3 border-t border-brand-border pt-2">
            <button type="submit" disabled={saving} className="btn-primary !px-6 !py-2.5 text-sm disabled:opacity-60">
              {saving ? "Saving..." : editing ? "Update Promotion" : "Save Promotion"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-full border border-brand-border px-5 py-2 text-sm font-semibold hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="card-surface overflow-hidden rounded-2xl border border-brand-border/80 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-brand-border bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
                <th className="px-4 py-3.5">Banner</th>
                <th className="px-4 py-3.5">Copy</th>
                <th className="px-4 py-3.5">Sort</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-brand-muted">
                    <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-brand-primary" />
                    <span>Loading promotions...</span>
                  </td>
                </tr>
              ) : promotions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-brand-muted">
                    <ImagePlus className="mx-auto mb-2 h-8 w-8 text-brand-border" />
                    <span>No promotions created yet.</span>
                  </td>
                </tr>
              ) : (
                promotions.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <img
                        src={getProductImageUrl(item.imageUrl)}
                        alt={item.title}
                        onError={onImageError}
                        className="h-16 w-28 rounded-lg object-cover border border-brand-border/60"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-brand-navy">{item.title}</div>
                      {item.subtitle && <div className="mt-1 max-w-md text-xs text-brand-muted">{item.subtitle}</div>}
                      {item.ctaLabel && <div className="mt-1 text-xs font-semibold text-brand-primary">{item.ctaLabel}</div>}
                    </td>
                    <td className="px-4 py-3 text-brand-muted">{item.sortOrder}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${item.isActive ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-slate-200 bg-slate-100 text-slate-600"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${item.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button onClick={() => openEdit(item)} className="rounded-lg p-1.5 text-brand-primary hover:bg-brand-primary/10" title="Edit Promotion">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => toggleActive(item)} className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50" title="Toggle Promotion">
                          <Power className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(item)} className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50" title="Delete Promotion">
                          <Trash2 className="h-4 w-4" />
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
