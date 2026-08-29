import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Minus, Plus, Trash2, Receipt, ArrowRight, ShoppingBag } from "lucide-react";
import { useEstimate } from "../../context/EstimateContext";
import { formatCurrency } from "../../utils/format";
import { EmptyState } from "../../components/common/States";
import { getProductImageUrl, onImageError } from "../../utils/image";

export default function Estimate() {
  const { t, i18n } = useTranslation();
  const { items, updateQuantity, removeItem, totals } = useEstimate();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={Receipt}
          title={t("estimate.empty")}
          description={t("estimate.emptyDesc")}
          action={
            <Link to="/products" className="btn-primary inline-flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span>{t("estimate.browse")}</span>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-page py-8 sm:py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
          <Receipt className="w-5 h-5" />
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-navy">{t("estimate.title")}</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => {
            const name = i18n.language === "ta" && item.nameTa ? item.nameTa : item.nameEn;
            const unitPrice = item.discountedPrice ?? item.originalPrice;
            return (
              <div key={item.productId} className="card-surface p-4 flex items-center gap-4 rounded-xl border border-brand-border/80 shadow-sm">
                <div className="w-16 h-16 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden border border-brand-border/50">
                  <img
                    src={getProductImageUrl(item.imageUrl)}
                    alt={name}
                    onError={onImageError}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-brand-navy truncate">{name}</p>
                  <p className="text-xs text-brand-muted">{item.unit}</p>
                  <p className="text-sm font-bold text-brand-primary-dark mt-1">{formatCurrency(unitPrice)}</p>
                </div>
                <div className="flex items-center border border-brand-border rounded-full bg-white">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="w-8 h-8 flex items-center justify-center text-brand-navy hover:bg-slate-50 rounded-l-full transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold text-brand-navy">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center text-brand-navy hover:bg-slate-50 rounded-r-full transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="w-24 text-right font-bold text-brand-navy hidden sm:block">
                  {formatCurrency(unitPrice * item.quantity)}
                </div>
                <button
                  onClick={() => removeItem(item.productId)}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  aria-label={t("estimate.remove")}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="card-surface p-6 h-fit sticky top-24 rounded-2xl border border-brand-border shadow-sm">
          <h2 className="font-display font-semibold text-lg text-brand-navy mb-4">{t("estimate.estimatedTotal")}</h2>
          <div className="flex justify-between text-sm text-brand-muted mb-2">
            <span>Subtotal</span>
            <span>{formatCurrency(totals.subtotal)}</span>
          </div>
          {totals.discount > 0 && (
            <div className="flex justify-between text-sm text-brand-success mb-2 font-medium">
              <span>Savings</span>
              <span>-{formatCurrency(totals.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-brand-navy text-lg border-t border-brand-border pt-3 mt-2">
            <span>{t("estimate.total")}</span>
            <span>{formatCurrency(totals.estimatedTotal)}</span>
          </div>
          <button
            onClick={() => navigate("/estimate/customer-details")}
            className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
          >
            <span>{t("estimate.requestEstimate")}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <Link to="/products" className="block text-center text-sm text-brand-primary font-semibold mt-3 hover:underline">
            {t("estimate.continueShopping")}
          </Link>
        </div>
      </div>
    </div>
  );
}
