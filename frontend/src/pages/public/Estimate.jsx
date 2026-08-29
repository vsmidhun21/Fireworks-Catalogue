import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEstimate } from "../../context/EstimateContext";
import { formatCurrency } from "../../utils/format";
import { EmptyState } from "../../components/common/States";

export default function Estimate() {
  const { t, i18n } = useTranslation();
  const { items, updateQuantity, removeItem, totals } = useEstimate();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon="🧾"
          title={t("estimate.empty")}
          description={t("estimate.emptyDesc")}
          action={<Link to="/products" className="btn-primary">{t("estimate.browse")}</Link>}
        />
      </div>
    );
  }

  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-navy mb-8">{t("estimate.title")}</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => {
            const name = i18n.language === "ta" && item.nameTa ? item.nameTa : item.nameEn;
            const unitPrice = item.discountedPrice ?? item.originalPrice;
            return (
              <div key={item.productId} className="card-surface p-4 flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-brand-cream flex items-center justify-center shrink-0 overflow-hidden">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">🎇</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-brand-navy truncate">{name}</p>
                  <p className="text-xs text-brand-muted">{item.unit}</p>
                  <p className="text-sm font-bold text-brand-primary-dark mt-1">{formatCurrency(unitPrice)}</p>
                </div>
                <div className="flex items-center border border-brand-border rounded-full">
                  <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="w-8 h-8 font-bold text-brand-navy">−</button>
                  <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="w-8 h-8 font-bold text-brand-navy">+</button>
                </div>
                <div className="w-20 text-right font-semibold text-brand-navy hidden sm:block">
                  {formatCurrency(unitPrice * item.quantity)}
                </div>
                <button onClick={() => removeItem(item.productId)} className="text-brand-error hover:opacity-70" aria-label={t("estimate.remove")}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>

        <div className="card-surface p-6 h-fit sticky top-24">
          <h2 className="font-display font-semibold text-lg text-brand-navy mb-4">{t("estimate.estimatedTotal")}</h2>
          <div className="flex justify-between text-sm text-brand-muted mb-2">
            <span>Subtotal</span>
            <span>{formatCurrency(totals.subtotal)}</span>
          </div>
          {totals.discount > 0 && (
            <div className="flex justify-between text-sm text-brand-success mb-2">
              <span>Savings</span>
              <span>-{formatCurrency(totals.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-brand-navy text-lg border-t border-brand-border pt-3 mt-2">
            <span>{t("estimate.total")}</span>
            <span>{formatCurrency(totals.estimatedTotal)}</span>
          </div>
          <button onClick={() => navigate("/estimate/customer-details")} className="btn-primary w-full mt-6">
            {t("estimate.requestEstimate")}
          </button>
          <Link to="/products" className="block text-center text-brand-primary font-semibold mt-3 hover:underline">
            {t("estimate.continueShopping")}
          </Link>
        </div>
      </div>
    </div>
  );
}
