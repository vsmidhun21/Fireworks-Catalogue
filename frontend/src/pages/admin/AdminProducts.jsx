import { useEffect, useState, useRef, Fragment, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  Image as ImageIcon,
  Star,
  Search,
  Filter,
  ArrowUpDown,
  Check,
  X,
  Loader2,
  Power,
  Sparkles,
  FileDown,
} from "lucide-react";
import { AdminProductService, AdminCategoryService } from "../../services/api";
import { formatCurrency } from "../../utils/format";
import { getProductImageUrl, onImageError } from "../../utils/image";
import { downloadPriceListPDF } from "../../utils/pdfGenerator";
import Pagination from "../../components/common/Pagination";

const emptyForm = {
  categoryId: "",
  nameEn: "",
  nameTa: "",
  descriptionEn: "",
  descriptionTa: "",
  unit: "Box",
  originalPrice: "",
  discountedPrice: "",
  imageUrl: "",
  imageFile: null,
  isFeatured: false,
  isNewArrival: false,
  sortOrder: 0,
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState("all");
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("category");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [error, setError] = useState("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const fileInputRef = useRef(null);

  async function load(nextPage = page) {
    setLoading(true);
    try {
      const isAll = pageSize === "all";
      const limit = isAll ? 500 : pageSize;
      const targetPage = isAll ? 1 : nextPage;

      const res = await AdminProductService.list({
        search: search.trim() || undefined,
        category: selectedCategory || undefined,
        sort: sortBy,
        page: targetPage,
        limit,
      });

      let items = res.data.items || [];
      const totalCount = res.data.total ?? items.length;

      // In case the backend caps at 100 items per response, automatically fetch
      // subsequent pages so the admin sees all products under each category without omission.
      if (isAll && totalCount > items.length && items.length > 0) {
        const remainingPages = Math.ceil(totalCount / items.length);
        const extraPromises = [];
        for (let p = 2; p <= remainingPages; p++) {
          extraPromises.push(
            AdminProductService.list({
              search: search.trim() || undefined,
              category: selectedCategory || undefined,
              sort: sortBy,
              page: p,
              limit,
            })
          );
        }
        const extraResults = await Promise.all(extraPromises);
        extraResults.forEach((r) => {
          if (r.data?.items) {
            items = items.concat(r.data.items);
          }
        });
      }

      setProducts(items);
      setTotal(totalCount);
      setPage(targetPage);
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    AdminCategoryService.list({ page: 1, limit: 1000 }).then((res) => setCategories(res.data.items || []));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(1), 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedCategory, sortBy, pageSize]);

  // Order categories by sortOrder ASC, id ASC
  const orderedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      const orderA = a.sortOrder ?? 0;
      const orderB = b.sortOrder ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return a.id - b.id;
    });
  }, [categories]);

  // Map categoryId to its order index
  const categoryOrderMap = useMemo(() => {
    const map = new Map();
    orderedCategories.forEach((c, index) => {
      map.set(Number(c.id), index);
    });
    return map;
  }, [orderedCategories]);

  // Map categoryId to category object
  const categoryById = useMemo(() => {
    const map = new Map();
    categories.forEach((c) => {
      map.set(Number(c.id), c);
    });
    return map;
  }, [categories]);

  // Group and sort displayed products so that Category 1 displays ALL its products,
  // then Category 2 displays ALL its products, sequentially without interleaving.
  const displayedProducts = useMemo(() => {
    if (sortBy === "category") {
      return [...products].sort((a, b) => {
        const catA = categoryOrderMap.has(Number(a.categoryId))
          ? categoryOrderMap.get(Number(a.categoryId))
          : 9999;
        const catB = categoryOrderMap.has(Number(b.categoryId))
          ? categoryOrderMap.get(Number(b.categoryId))
          : 9999;
        if (catA !== catB) return catA - catB;

        // Inside the same category: sort by product code (numeric) or sortOrder
        const codeA = parseInt(a.productCode, 10);
        const codeB = parseInt(b.productCode, 10);
        if (!isNaN(codeA) && !isNaN(codeB) && codeA !== codeB) {
          return codeA - codeB;
        }
        const sortA = a.sortOrder ?? 0;
        const sortB = b.sortOrder ?? 0;
        if (sortA !== sortB) return sortA - sortB;

        return a.id - b.id;
      });
    }

    if (sortBy === "code_asc") {
      return [...products].sort((a, b) => {
        const codeA = parseInt(a.productCode, 10);
        const codeB = parseInt(b.productCode, 10);
        if (!isNaN(codeA) && !isNaN(codeB)) return codeA - codeB;
        return String(a.productCode || "").localeCompare(String(b.productCode || ""));
      });
    }

    if (sortBy === "name_asc") {
      return [...products].sort((a, b) => a.nameEn.localeCompare(b.nameEn));
    }

    if (sortBy === "price_asc") {
      return [...products].sort((a, b) => (a.originalPrice || 0) - (b.originalPrice || 0));
    }

    if (sortBy === "price_desc") {
      return [...products].sort((a, b) => (b.originalPrice || 0) - (a.originalPrice || 0));
    }

    if (sortBy === "newest") {
      return [...products].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return products;
  }, [products, sortBy, categoryOrderMap]);

  // Product count per category among currently displayed products
  const categoryCounts = useMemo(() => {
    const counts = {};
    displayedProducts.forEach((p) => {
      const cid = p.categoryId;
      counts[cid] = (counts[cid] || 0) + 1;
    });
    return counts;
  }, [displayedProducts]);

  function openCreate() {
    setEditing(null);
    setForm({
      ...emptyForm,
      categoryId: selectedCategory || categories[0]?.id || "",
    });
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImagePreviewUrl("");
    setError("");
    setShowForm(true);
  }

  function openEdit(p) {
    setEditing(p);
    setForm({
      categoryId: p.categoryId,
      nameEn: p.nameEn,
      nameTa: p.nameTa || "",
      descriptionEn: p.descriptionEn || "",
      descriptionTa: p.descriptionTa || "",
      unit: p.unit,
      originalPrice: p.originalPrice,
      discountedPrice: p.discountedPrice ?? "",
      imageUrl: p.imageUrl || "",
      imageFile: null,
      isFeatured: p.isFeatured,
      isNewArrival: p.isNewArrival,
      sortOrder: p.sortOrder,
    });
    setImagePreviewUrl("");
    setError("");
    setShowForm(true);
  }

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  function handleFileSelect(file) {
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Please choose a valid image file.");
      return;
    }
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    const previewUrl = URL.createObjectURL(file);
    setImagePreviewUrl(previewUrl);
    setForm((prev) => ({ ...prev, imageFile: file }));
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleFileSelect(file);
    }
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
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      setImagePreviewUrl("");
      setForm(emptyForm);
      setShowForm(false);
      load(editing ? page : 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(p) {
    await AdminProductService.setStatus(p.id, !p.isActive);
    load(page);
  }

  async function toggleFeatured(p) {
    await AdminProductService.setFeatured(p.id, !p.isFeatured);
    load(page);
  }

  async function handleDelete(p) {
    if (!confirm(`Delete/archive "${p.nameEn}"?`)) return;
    await AdminProductService.remove(p.id);
    const nextPage = products.length === 1 && page > 1 ? page - 1 : page;
    load(nextPage);
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-brand-navy">Products Management</h1>
            <p className="text-sm text-brand-muted">
              Manage product catalogue, image uploads, and inventory ({total} total products)
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setDownloadingPdf(true);
                downloadPriceListPDF().finally(() => setDownloadingPdf(false));
              }}
              disabled={downloadingPdf}
              className="rounded-full border border-amber-400 bg-amber-50 text-amber-900 px-4 py-2 text-sm font-bold hover:bg-amber-100 transition-colors flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-60"
              title="Download latest price list PDF"
            >
              {downloadingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
              ) : (
                <FileDown className="w-4 h-4 text-amber-700" />
              )}
              <span>{downloadingPdf ? "Generating..." : "Download Price List PDF"}</span>
            </button>
            <button onClick={openCreate} className="btn-primary !py-2 !px-4 text-sm flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-brand-border/80 shadow-sm">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[260px]">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted" />
              <input
                placeholder="Search products by name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-brand-border pl-9 pr-8 py-2 text-sm focus:outline-none focus:border-brand-primary"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-navy p-0.5"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Dropdown */}
            <div className="relative">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none" />
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className={`rounded-xl border pl-9 pr-8 py-2 text-sm font-medium focus:outline-none focus:border-brand-primary cursor-pointer transition-colors ${
                  selectedCategory
                    ? "border-brand-primary bg-brand-primary/5 text-brand-primary font-semibold"
                    : "border-brand-border bg-white text-brand-navy"
                }`}
                title="Filter products by category"
              >
                <option value="">All Categories ({categories.length})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameEn} {c.nameTa ? `(${c.nameTa})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Selector */}
            <div className="relative">
              <ArrowUpDown className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="rounded-xl border border-brand-border bg-white pl-9 pr-8 py-2 text-sm text-brand-navy font-medium focus:outline-none focus:border-brand-primary cursor-pointer"
                title="Sort order"
              >
                <option value="category">Category Order</option>
                <option value="code_asc">Code (001 - 999)</option>
                <option value="name_asc">Name (A - Z)</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </div>

          {/* Page Size Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-brand-muted font-medium">Show:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const val = e.target.value === "all" ? "all" : Number(e.target.value);
                setPageSize(val);
                setPage(1);
              }}
              className="rounded-xl border border-brand-border bg-white px-2.5 py-2 text-xs font-semibold text-brand-navy focus:outline-none focus:border-brand-primary cursor-pointer"
              title="Items per page"
            >
              <option value="all">All Products</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
          </div>
        </div>

        {/* Active Filter Summary Bar */}
        {(selectedCategory || search) && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-slate-50 border border-brand-border/70 rounded-xl text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-brand-navy">Active:</span>
              {selectedCategory && (
                <span className="inline-flex items-center gap-1.5 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 px-2.5 py-1 rounded-full font-semibold">
                  <span>
                    Category:{" "}
                    {categories.find((c) => String(c.id) === String(selectedCategory))?.nameEn || "Selected Category"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("")}
                    className="hover:bg-brand-primary/20 rounded-full p-0.5 cursor-pointer"
                    title="Clear category filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {search && (
                <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-full font-medium">
                  <span>Search: "{search}"</span>
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="hover:bg-amber-200 rounded-full p-0.5 cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
            <div className="text-brand-muted">
              Found <strong className="text-brand-navy">{total}</strong> product{total === 1 ? "" : "s"}
            </div>
          </div>
        )}
      </div>

      {/* Product Form Modal / Section */}
      {showForm && (
        <form onSubmit={handleSave} className="card-surface p-6 border-2 border-brand-primary/20 rounded-2xl grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 flex items-center justify-between pb-3 border-b border-brand-border">
            <h2 className="font-display text-lg font-bold text-brand-navy">
              {editing ? `Edit Product: ${editing.nameEn}` : "Add New Product"}
            </h2>
            <button
              type="button"
              onClick={() => {
                if (imagePreviewUrl) {
                  URL.revokeObjectURL(imagePreviewUrl);
                }
                setImagePreviewUrl("");
                setShowForm(false);
              }}
              className="p-1 rounded-full text-brand-muted hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-navy mb-1">Category *</label>
            <select
              required
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:outline-none focus:border-brand-primary bg-white"
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameEn}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-navy mb-1">Product Code</label>
            <input
              value={editing?.productCode ?? "Auto-generated on save"}
              disabled
              className="w-full rounded-lg border border-brand-border bg-slate-50 px-3 py-2 text-sm text-brand-muted"
            />
            <p className="mt-1 text-[11px] text-brand-muted">Generated automatically as the next available numeric item code.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-navy mb-1">English Name *</label>
            <input
              required
              placeholder="e.g. 2 3/4 Kuruvi Crackers"
              value={form.nameEn}
              onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
              className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-navy mb-1">Tamil Name</label>
            <input
              placeholder="Enter Tamil product name"
              value={form.nameTa}
              onChange={(e) => setForm({ ...form, nameTa: e.target.value })}
              className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:outline-none focus:border-brand-primary font-tamil"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-brand-navy mb-1">Description (English)</label>
            <textarea
              rows={2}
              placeholder="Crisp sound, safe ignition, packed in protective packaging."
              value={form.descriptionEn}
              onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })}
              className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-navy mb-1">Unit / Packaging</label>
            <input
              placeholder="e.g. 1 Box (10 Pcs), 1 Pkt"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
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

          <div>
            <label className="block text-sm font-semibold text-brand-navy mb-1">Original Price / MRP (Rs.) *</label>
            <input
              required
              type="number"
              step="0.01"
              placeholder="e.g. 150"
              value={form.originalPrice}
              onChange={(e) => {
                const val = e.target.value;
                const num = parseFloat(val);
                const autoDiscount = !isNaN(num) && num > 0 ? String(Math.round(num * 0.10)) : "";
                setForm({ ...form, originalPrice: val, discountedPrice: autoDiscount });
              }}
              className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-navy mb-1">
              Offer Price / 90% Off (Rs.)
              <span className="text-xs text-emerald-600 font-normal ml-1">(90% discount)</span>
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 15 (auto 90% off)"
              value={form.discountedPrice}
              onChange={(e) => setForm({ ...form, discountedPrice: e.target.value })}
              className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:outline-none focus:border-brand-primary"
            />
          </div>

          {/* PRODUCT IMAGE UPLOAD SECTION */}
          <div className="sm:col-span-2 bg-slate-50 p-4 rounded-xl border border-brand-border">
            <label className="block text-sm font-semibold text-brand-navy mb-2 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-brand-primary" />
              <span>Product Image (Upload or Default)</span>
            </label>

            <div className="grid sm:grid-cols-12 gap-4 items-center">
              {/* Preview Thumbnail */}
              <div className="sm:col-span-3 flex flex-col items-center justify-center">
                <div className="relative w-28 h-28 rounded-xl border-2 border-dashed border-brand-border overflow-hidden bg-white shadow-sm flex items-center justify-center">
                  <img
                    src={getProductImageUrl(imagePreviewUrl || form.imageUrl)}
                    alt="Product preview"
                    onError={onImageError}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[11px] text-brand-muted mt-1.5 text-center">
                  {imagePreviewUrl ? "Selected image will upload on save" : form.imageUrl ? "Saved image" : "Default Image in use"}
                </span>
              </div>

              {/* Upload Actions & Drag-Drop */}
              <div className="sm:col-span-9 space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                  className="hidden"
                />

                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-brand-primary/30 rounded-xl p-4 text-center bg-white hover:border-brand-primary transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-6 h-6 text-brand-primary mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-brand-navy">
                    Click to browse or drag & drop image here
                  </p>
                  <p className="text-[11px] text-brand-muted mt-0.5">
                    Supports PNG, JPG, WebP, SVG up to 5MB. Upload happens when you save the product.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-brand-navy text-white text-xs font-medium hover:bg-brand-navy/90 flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{imagePreviewUrl ? "Choose Different File" : "Choose Image File"}</span>
                  </button>

                  {(form.imageUrl || imagePreviewUrl) && (
                    <button
                      type="button"
                      onClick={() => {
                        if (imagePreviewUrl) {
                          URL.revokeObjectURL(imagePreviewUrl);
                        }
                        setImagePreviewUrl("");
                        setForm((prev) => ({ ...prev, imageUrl: "", imageFile: null }));
                      }}
                      className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Image</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary"
              />
              <Star className="w-4 h-4 text-brand-gold fill-brand-gold" />
              <span>Mark as Featured Product</span>
            </label>
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={form.isNewArrival}
                onChange={(e) => setForm({ ...form, isNewArrival: e.target.checked })}
                className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary"
              />
              <Sparkles className="w-4 h-4 text-brand-orange" />
              <span>New Arrival</span>
            </label>
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
                  <span>{editing ? "Update Product" : "Save Product"}</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                if (imagePreviewUrl) {
                  URL.revokeObjectURL(imagePreviewUrl);
                }
                setImagePreviewUrl("");
                setShowForm(false);
              }}
              className="rounded-full border border-brand-border px-5 py-2 text-sm font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Products Table */}
      <div className="card-surface overflow-hidden border border-brand-border/80 rounded-2xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50 text-brand-muted border-b border-brand-border uppercase text-[11px] tracking-wider font-semibold">
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4">Code</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4 text-center">Featured</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-brand-muted">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-primary" />
                    <span>Loading products...</span>
                  </td>
                </tr>
              ) : displayedProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-brand-muted">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 text-brand-border" />
                    <span>No products found matching your search.</span>
                  </td>
                </tr>
              ) : (
                displayedProducts.map((p, idx) => {
                  const prevCategory = idx > 0 ? displayedProducts[idx - 1].categoryId : null;
                  const currentCategory = p.categoryId;
                  const isNewCategory = sortBy === "category" && !selectedCategory && currentCategory !== prevCategory;
                  const catObj = categoryById.get(Number(currentCategory)) || p.category;
                  const countInCat = categoryCounts[currentCategory] || 0;

                  return (
                    <Fragment key={p.id}>
                      {isNewCategory && (
                        <tr className="bg-slate-100/95 border-y-2 border-brand-primary/25">
                          <td colSpan={7} className="py-2.5 px-4 bg-slate-100">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5 font-bold text-xs uppercase tracking-wider text-brand-navy">
                                <span className="w-2.5 h-2.5 rounded-full bg-brand-primary shrink-0" />
                                <span className="font-extrabold text-brand-navy text-sm">
                                  {catObj?.nameEn || "Uncategorized"}
                                </span>
                                {catObj?.nameTa && (
                                  <span className="text-brand-muted font-normal font-tamil normal-case tracking-normal text-xs">
                                    ({catObj.nameTa})
                                  </span>
                                )}
                                <span className="text-[11px] font-semibold text-brand-muted bg-white px-2.5 py-0.5 rounded-full border border-brand-border ml-1">
                                  {countInCat} product{countInCat === 1 ? "" : "s"}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setSelectedCategory(String(currentCategory))}
                                className="text-[11px] text-brand-primary hover:text-brand-navy hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <span>Filter this category only</span>
                                <span>&rarr;</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={getProductImageUrl(p.imageUrl)}
                              alt={p.nameEn}
                              onError={onImageError}
                              className="w-11 h-11 rounded-lg object-cover bg-brand-cream border border-brand-border/50 shrink-0"
                            />
                            <div>
                              <div className="font-semibold text-brand-navy">{p.nameEn}</div>
                              {p.nameTa && <div className="text-xs text-brand-muted font-tamil">{p.nameTa}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-brand-muted font-medium">{p.productCode}</td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => setSelectedCategory(String(currentCategory))}
                            title={`Filter by ${catObj?.nameEn || "this category"}`}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-brand-navy hover:bg-brand-primary/10 hover:text-brand-primary hover:border-brand-primary/30 border border-slate-200 transition-colors cursor-pointer"
                          >
                            {catObj?.nameEn || p.category?.nameEn || "-"}
                          </button>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-semibold text-brand-navy">
                            {formatCurrency(p.discountedPrice != null ? p.discountedPrice : Math.round(p.originalPrice * 0.10))}
                          </div>
                          <div className="text-xs text-brand-muted line-through">
                            {formatCurrency(p.originalPrice)}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => toggleFeatured(p)}
                            title={p.isFeatured ? "Remove from Featured" : "Add to Featured"}
                            className="p-1 rounded-full hover:bg-slate-100 transition-transform active:scale-90"
                          >
                            <Star
                              className={`w-5 h-5 ${
                                p.isFeatured
                                  ? "text-brand-gold fill-brand-gold"
                                  : "text-slate-300 hover:text-brand-gold"
                              }`}
                            />
                          </button>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              p.isActive
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${p.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                            {p.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => openEdit(p)}
                              title="Edit Product"
                              className="p-1.5 rounded-lg text-brand-primary hover:bg-brand-primary/10 transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleActive(p)}
                              title={p.isActive ? "Deactivate Product" : "Activate Product"}
                              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                            >
                              <Power className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(p)}
                              title="Delete / Archive Product"
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {pageSize !== "all" && (
          <div className="px-4 pb-4">
            <Pagination page={page} total={total} pageSize={Number(pageSize)} onPageChange={load} />
          </div>
        )}
      </div>
    </div>
  );
}
