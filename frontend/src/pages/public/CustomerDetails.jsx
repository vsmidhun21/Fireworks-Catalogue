import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Send, Loader2, ShoppingCart } from "lucide-react";
import { useEstimate } from "../../context/EstimateContext";
import { EstimateService } from "../../services/api";

const initialForm = { name: "", phone: "", email: "", address: "", city: "", state: "", pincode: "", notes: "" };

export default function CustomerDetails() {
  const { t } = useTranslation();
  const { items, totals, clear } = useEstimate();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  // Redirect to products if no items
  useEffect(() => {
    if (items.length === 0) {
      navigate("/products", { replace: true });
    }
  }, [items.length, navigate]);

  if (items.length === 0) return null;

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function validate() {
    const required = ["name", "phone", "address", "city", "state", "pincode"];
    const next = {};
    for (const field of required) {
      if (!form[field]?.trim()) next[field] = t("estimate.required");
    }
    if (form.phone && !/^[0-9+\s-]{7,15}$/.test(form.phone.trim())) {
      next.phone = "Enter a valid phone number";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError("");
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        customer: form,
      };
      const res = await EstimateService.submit(payload);
      clear();
      navigate(`/estimate/confirmation/${res.data.estimateNumber}`);
    } catch (err) {
      setApiError(err.message || t("common.error"));
    } finally {
      setSubmitting(false);
    }
  }

  const fields = [
    { key: "name", labelKey: "name", type: "text", full: true },
    { key: "phone", labelKey: "phone", type: "tel" },
    { key: "email", labelKey: "email", type: "email" },
    { key: "address", labelKey: "address", type: "text", full: true },
    { key: "city", labelKey: "city", type: "text" },
    { key: "state", labelKey: "state", type: "text" },
    { key: "pincode", labelKey: "pincode", type: "text" },
  ];

  return (
    <div className="container-page py-8 sm:py-12 pb-28 sm:pb-12 max-w-2xl mx-auto">
      <Link to="/estimate" className="inline-flex items-center gap-1.5 text-sm text-brand-primary font-semibold hover:underline mb-2">
        <ArrowLeft className="w-4 h-4" />
        <span>{t("estimate.backToEstimate")}</span>
      </Link>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-navy mt-1 mb-2">{t("estimate.customerDetails")}</h1>
      <p className="text-sm text-brand-muted mb-6">
        Order for {totals.count} item{totals.count !== 1 ? "s" : ""} — Total {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(totals.estimatedTotal)}
      </p>

      {/* Note box */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-sm text-amber-900 flex items-start gap-2">
        <ShoppingCart className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
        <span>No advance payment needed. Our team will call or WhatsApp you to confirm everything.</span>
      </div>

      <form onSubmit={handleSubmit} className="card-surface p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-5 rounded-2xl border border-brand-border shadow-sm" noValidate>
        {fields.map((f) => (
          <div key={f.key} className={f.full ? "sm:col-span-2" : ""}>
            <label className="block text-sm font-semibold text-brand-navy mb-1.5" htmlFor={f.key}>
              {t(`estimate.${f.labelKey}`)} {f.key !== "email" && <span className="text-brand-error">*</span>}
            </label>
            <input
              id={f.key}
              type={f.type}
              value={form[f.key]}
              onChange={(e) => update(f.key, e.target.value)}
              className={`w-full rounded-lg border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 text-base ${
                errors[f.key] ? "border-brand-error" : "border-brand-border"
              }`}
            />
            {errors[f.key] && <p className="text-xs text-brand-error mt-1">{errors[f.key]}</p>}
          </div>
        ))}

        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-brand-navy mb-1.5" htmlFor="notes">
            {t("estimate.notes")}
          </label>
          <textarea
            id="notes"
            rows={3}
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            className="w-full rounded-lg border border-brand-border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
          />
        </div>

        {apiError && <p className="sm:col-span-2 text-sm text-brand-error">{apiError}</p>}

        <button type="submit" disabled={submitting} className="btn-primary sm:col-span-2 flex items-center justify-center gap-2 disabled:opacity-60 !py-4 text-base font-bold">
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{t("estimate.submitting")}</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>{t("estimate.submit")}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}