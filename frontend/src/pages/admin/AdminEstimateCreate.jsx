import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Plus, Search, Trash2, Save } from "lucide-react";
import { AdminEstimateService, AdminProductService, AdminSettingsService } from "../../services/api";
import { formatCurrency, calcDiscountedPrice, globalDiscountPercent, formatPercent } from "../../utils/format";

const initialCustomer = { name: "", phone: "", alternatePhone: "", email: "", address: "", city: "", state: "", pincode: "" };

const customerFields = [
  { key: "name", label: "Name", full: true, required: true },
  { key: "phone", label: "Mobile Number", required: true, inputMode: "numeric", maxLength: 10 },
  { key: "alternatePhone", label: "Additional Mobile", inputMode: "numeric", maxLength: 10 },
  { key: "email", label: "Email", type: "email" },
  { key: "address", label: "Address", full: true, required: true },
  { key: "city", label: "City", required: true, maxLength: 50 },
  { key: "state", label: "State", required: true, maxLength: 50 },
  { key: "pincode", label: "Pincode", required: true, inputMode: "numeric", maxLength: 6 },
];

// Same customer rules as the public estimate form / backend validation.
function validateCustomer(c) {
  const e = {};
  for (const f of customerFields) if (f.required && !c[f.key].trim()) e[f.key] = "Required";
  if (c.name.trim() && !/^\p{L}[\p{L} .'-]{1,79}$/u.test(c.name.trim())) e.name = "Letters, spaces, apostrophes or hyphens only";
  if (c.phone.trim() && !/^[6-9]\d{9}$/.test(c.phone.trim())) e.phone = "Enter a valid 10-digit mobile number";
  if (c.alternatePhone.trim() && !/^[6-9]\d{9}$/.test(c.alternatePhone.trim())) e.alternatePhone = "Enter a valid 10-digit mobile number";
  if (c.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.email.trim())) e.email = "Enter a valid email";
  if (c.city.trim() && !/^\p{L}[\p{L} .'-]{1,49}$/u.test(c.city.trim())) e.city = "Letters only";
  if (c.state.trim() && !/^\p{L}[\p{L} .'-]{1,49}$/u.test(c.state.trim())) e.state = "Letters only";
  if (c.pincode.trim() && !/^\d{6}$/.test(c.pincode.trim())) e.pincode = "Enter a 6-digit pincode";
  return e;
}

/** Returns the number (0-100, max 2 decimals) or null when the text is invalid/empty. */
function parseDiscountInput(text) {
  const s = String(text).trim();
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(s)) return null;
  const n = Number(s);
  return n >= 0 && n <= 100 ? n : null;
}

export default function AdminEstimateCreate() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(initialCustomer);
  const [errors, setErrors] = useState({});
  const [discountText, setDiscountText] = useState("");
  const discountTouched = useRef(false);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [search, setSearch] = useState("");
  const [lines, setLines] = useState([]); // [{ productId, quantity }]
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    AdminProductService.list({ limit: 2000, sort: "code_asc" })
      .then((res) => setProducts((res.data.items || []).filter((p) => p.isActive)))
      .catch((err) => setApiError(err.message))
      .finally(() => setLoadingProducts(false));
    // Pre-fill with the current global discount (admin may change it for this estimate).
    AdminSettingsService.get()
      .then((res) => {
        if (!discountTouched.current) setDiscountText(formatPercent(globalDiscountPercent(res.data)));
      })
      .catch(() => {
        if (!discountTouched.current) setDiscountText(formatPercent(globalDiscountPercent(null)));
      });
  }, []);

  const discount = parseDiscountInput(discountText);
  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const rows = useMemo(
    () =>
      lines
        .map((l) => {
          const p = productMap.get(l.productId);
          if (!p) return null;
          const qty = Number(l.quantity);
          const validQty = Number.isInteger(qty) && qty >= 1 && qty <= 99999;
          const unit = discount == null ? null : calcDiscountedPrice(p.originalPrice, discount);
          return {
            product: p,
            quantity: l.quantity,
            validQty,
            unit,
            lineMrp: validQty ? p.originalPrice * qty : 0,
            lineTotal: validQty && unit != null ? unit * qty : 0,
          };
        })
        .filter(Boolean),
    [lines, productMap, discount]
  );

  const subtotal = rows.reduce((s, r) => s + r.lineMrp, 0);
  const total = rows.reduce((s, r) => s + r.lineTotal, 0);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    const inList = new Set(lines.map((l) => l.productId));
    return products
      .filter((p) => !inList.has(p.id))
      .filter((p) => !q || p.nameEn?.toLowerCase().includes(q) || p.nameTa?.toLowerCase().includes(q) || String(p.productCode).toLowerCase().includes(q))
      .slice(0, 30);
  }, [products, search, lines]);

  function addProduct(id) {
    setLines((ls) => [...ls, { productId: id, quantity: "1" }]);
  }
  function setQty(id, value) {
    setLines((ls) => ls.map((l) => (l.productId === id ? { ...l, quantity: value.replace(/[^0-9]/g, "") } : l)));
  }
  function removeLine(id) {
    setLines((ls) => ls.filter((l) => l.productId !== id));
  }

  const discountError = discount == null ? "Enter a percentage between 0 and 100 (up to 2 decimals)" : "";
  const canSubmit = !saving && discount != null && rows.length > 0 && rows.every((r) => r.validQty);

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError("");
    const errs = validateCustomer(customer);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    if (discount == null) return setApiError("Please enter a valid discount percentage.");
    if (rows.length === 0) return setApiError("Add at least one product.");
    if (!rows.every((r) => r.validQty)) return setApiError("Every quantity must be a whole number of at least 1.");
    setSaving(true);
    try {
      const res = await AdminEstimateService.create({
        customer,
        discountPercent: discount,
        items: rows.map((r) => ({ productId: r.product.id, quantity: Number(r.quantity) })),
      });
      navigate(`/admin/estimates/${res.data.id}`, { replace: true });
    } catch (err) {
      setApiError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const inputCls = (bad) =>
    `w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-brand-primary ${bad ? "border-brand-error" : "border-brand-border"}`;

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-4xl space-y-6">
      <Link to="/admin/estimates" className="inline-flex items-center gap-1.5 text-sm text-brand-primary font-semibold hover:underline">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Estimates</span>
      </Link>
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-navy">Create Manual Estimate</h1>
        <p className="text-sm text-brand-muted">Enter customer details, choose products and set the discount for this estimate.</p>
      </div>

      <section className="card-surface p-5 rounded-2xl border border-brand-border/80 shadow-sm">
        <h2 className="font-display font-semibold text-brand-navy mb-3">Customer Details</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {customerFields.map((f) => (
            <div key={f.key} className={f.full ? "sm:col-span-2" : ""}>
              <label htmlFor={`c-${f.key}`} className="block text-sm font-semibold text-brand-navy mb-1">
                {f.label} {f.required && <span className="text-brand-error">*</span>}
              </label>
              <input
                id={`c-${f.key}`}
                type={f.type || "text"}
                inputMode={f.inputMode}
                maxLength={f.maxLength}
                value={customer[f.key]}
                onChange={(e) => setCustomer((c) => ({ ...c, [f.key]: e.target.value }))}
                className={inputCls(errors[f.key])}
              />
              {errors[f.key] && <p className="text-xs text-brand-error mt-1">{errors[f.key]}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="card-surface p-5 rounded-2xl border border-brand-border/80 shadow-sm">
        <h2 className="font-display font-semibold text-brand-navy mb-3">Discount</h2>
        <label htmlFor="discount" className="block text-sm font-semibold text-brand-navy mb-1">
          Discount Percentage (%) <span className="text-brand-error">*</span>
        </label>
        <input
          id="discount"
          type="text"
          inputMode="decimal"
          value={discountText}
          onChange={(e) => {
            discountTouched.current = true;
            setDiscountText(e.target.value);
          }}
          className={`${inputCls(discountError)} sm:w-48`}
        />
        {discountError ? (
          <p className="text-xs text-brand-error mt-1">{discountError}</p>
        ) : (
          <p className="text-xs text-brand-muted mt-1">Pre-filled from the global discount; changes apply to this estimate only.</p>
        )}
      </section>

      <section className="card-surface p-5 rounded-2xl border border-brand-border/80 shadow-sm space-y-4">
        <h2 className="font-display font-semibold text-brand-navy">Products</h2>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            placeholder="Search product by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-brand-border pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-brand-primary"
          />
        </div>
        <div className="border border-brand-border/70 rounded-xl max-h-64 overflow-y-auto divide-y divide-brand-border/50">
          {loadingProducts ? (
            <div className="py-6 text-center text-brand-muted text-sm"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
          ) : results.length === 0 ? (
            <p className="py-6 text-center text-sm text-brand-muted">No matching products.</p>
          ) : (
            results.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-brand-navy truncate">{p.nameEn}</p>
                  <p className="text-xs text-brand-muted">{p.productCode} · {p.unit} · MRP {formatCurrency(p.originalPrice)}</p>
                </div>
                <button type="button" onClick={() => addProduct(p.id)} className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-brand-border px-2.5 py-1 text-xs font-semibold text-brand-primary hover:border-brand-primary">
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            ))
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50 text-brand-muted border-b border-brand-border uppercase text-[11px] tracking-wider font-semibold">
                <th className="py-3 px-3">Product</th>
                <th className="py-3 px-3 text-right">Original Price</th>
                <th className="py-3 px-3 text-right">Discounted Price</th>
                <th className="py-3 px-3 text-center">Qty</th>
                <th className="py-3 px-3 text-right">Item Total</th>
                <th className="py-3 px-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60">
              {rows.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-brand-muted">No products added yet.</td></tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.product.id}>
                    <td className="py-2 px-3">
                      <p className="font-semibold text-brand-navy">{r.product.nameEn}</p>
                      <p className="text-xs text-brand-muted">{r.product.productCode} · {r.product.unit}</p>
                    </td>
                    <td className="py-2 px-3 text-right text-slate-500">{formatCurrency(r.product.originalPrice)}</td>
                    <td className="py-2 px-3 text-right font-semibold text-brand-navy">{r.unit == null ? "—" : formatCurrency(r.unit)}</td>
                    <td className="py-2 px-3 text-center">
                      <input
                        aria-label={`Quantity for ${r.product.nameEn}`}
                        inputMode="numeric"
                        value={r.quantity}
                        onChange={(e) => setQty(r.product.id, e.target.value)}
                        className={`w-16 text-center rounded-lg border px-2 py-1 text-sm focus:outline-none focus:border-brand-primary ${r.validQty ? "border-brand-border" : "border-brand-error"}`}
                      />
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-brand-navy">{r.validQty && r.unit != null ? formatCurrency(r.lineTotal) : "—"}</td>
                    <td className="py-2 px-3 text-right">
                      <button type="button" onClick={() => removeLine(r.product.id)} aria-label={`Remove ${r.product.nameEn}`} className="text-brand-error hover:opacity-70">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <dl className="text-sm space-y-1.5 sm:ml-auto sm:max-w-xs">
          <div className="flex justify-between"><dt className="text-brand-muted">Retail Subtotal (MRP)</dt><dd className="font-medium">{formatCurrency(subtotal)}</dd></div>
          <div className="flex justify-between">
            <dt className="text-brand-muted">Discount ({discount == null ? "—" : formatPercent(discount)}%)</dt>
            <dd className="text-emerald-600 font-bold">-{formatCurrency(discount == null ? 0 : subtotal - total)}</dd>
          </div>
          <div className="flex justify-between font-bold text-brand-navy text-base border-t border-brand-border pt-2">
            <dt>Estimate Total</dt><dd className="text-brand-primary-dark">{discount == null ? "—" : formatCurrency(total)}</dd>
          </div>
        </dl>
      </section>

      {apiError && <p className="text-sm text-brand-error bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{apiError}</p>}

      <button type="submit" disabled={!canSubmit} className="btn-primary !py-2.5 !px-6 text-sm flex items-center gap-2 disabled:opacity-60">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        <span>{saving ? "Saving..." : "Create Estimate"}</span>
      </button>
    </form>
  );
}
