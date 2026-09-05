import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight, ShoppingBag } from "lucide-react";
import { useEstimate } from "../../context/EstimateContext";
import { formatCurrency } from "../../utils/format";
import { getProductImageUrl, onImageError } from "../../utils/image";

export default function Estimate() {
  const { t, i18n } = useTranslation();
  const { items, updateQuantity, removeItem, totals } = useEstimate();
  const navigate = useNavigate();

  // If empty, redirect to products
  useEffect(() => {
    if (items.length === 0) {
      navigate("/products", { replace: false });
    }
  }, [items.length, navigate]);

  if (items.length === 0) return null;

  return (
    <div className="container-page py-8 sm:py-12 pb-28 sm:pb-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
          <ShoppingCart className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-navy">{t("estimate.title")}</h1>
          <p className="text-sm text-brand-muted">{t("estimate.itemsInOrder", { count: totals.count })}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Item list */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => {
            const name = i18n.language === "ta" && item.nameTa ? item.nameTa : item.nameEn;
            const unitPrice = item.discountedPrice ?? item.originalPrice;
            return (
              <div key={item.productId} className="card-surface grid grid-cols-[4rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 p-3 rounded-xl border border-brand-border/80 shadow-sm sm:flex sm:gap-4 sm:p-4">
                <div className="row-span-2 w-16 h-16 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden border border-brand-border/50 sm:row-span-1">
                  <img
                    src={getProductImageUrl(item.imageUrl)}
                    alt={name}
                    onError={onImageError}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold leading-snug text-brand-navy whitespace-normal break-words">{name}</p>
                  <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 text-xs text-brand-muted sm:block">
                    <span>{item.unit}</span>
                    <span className="font-bold text-brand-primary-dark sm:mt-1 sm:block">{formatCurrency(unitPrice)}</span>
                  </div>
                </div>
                <div className="col-start-2 row-start-2 justify-self-start flex items-center border-2 border-brand-primary rounded-full bg-white overflow-hidden shrink-0 sm:order-none sm:col-auto sm:row-auto">
                  <button
                    onClick={() => {
                      if (item.quantity <= 1) removeItem(item.productId);
                      else updateQuantity(item.productId, item.quantity - 1);
                    }}
                    className="w-8 h-8 flex items-center justify-center text-brand-primary hover:bg-brand-primary hover:text-white rounded-l-full transition-colors"
                    aria-label={t("aria.decrease")}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-brand-primary">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center text-brand-primary hover:bg-brand-primary hover:text-white rounded-r-full transition-colors"
                    aria-label={t("aria.increase")}
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

          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-sm text-brand-primary font-semibold hover:underline mt-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{t("estimate.continueShopping")}</span>
          </Link>
        </div>

        {/* Order summary */}
        <div className="card-surface p-6 h-fit sticky top-24 rounded-2xl border border-brand-border shadow-sm">
          <h2 className="font-display font-semibold text-lg text-brand-navy mb-4">{t("estimate.estimatedTotal")}</h2>
          <div className="flex justify-between text-sm text-brand-muted mb-2">
            <span>{t("estimate.subtotalItems", { count: totals.count })}</span>
            <span>{formatCurrency(totals.subtotal)}</span>
          </div>
          {totals.discount > 0 && (
            <div className="flex justify-between text-sm text-brand-success mb-2 font-medium">
              <span>{t("estimate.youSave")}</span>
              <span>-{formatCurrency(totals.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-brand-navy text-lg border-t border-brand-border pt-3 mt-2">
            <span>{t("estimate.total")}</span>
            <span>{formatCurrency(totals.estimatedTotal)}</span>
          </div>
          <p className="text-xs text-brand-muted mt-2 leading-relaxed">
            {t("estimate.finalPriceNote")}
          </p>
          <button
            onClick={() => navigate("/estimate/customer-details")}
            className="btn-primary w-full mt-5 flex items-center justify-center gap-2 !py-3.5 text-base font-bold shadow-lg shadow-brand-orange/25 hover:scale-105 transition-all"
          >
            <span>{t("estimate.requestEstimate")}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}