import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  ArrowRight,
  ShoppingBag,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
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
      {/* Top Minimum Order & 90% Discount Alert Banner */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 border border-amber-300/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
            90%
          </span>
          <div>
            <p className="font-display font-bold text-brand-navy text-sm sm:text-base">
              Flat 90% Festive Discount Always Applicable!
            </p>
            <p className="text-xs text-brand-muted">
              Minimum order required to place an order is <strong className="text-brand-navy">₹3,000</strong>.
            </p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {totals.isMinOrderMet ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Min. Order Met</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-full border border-amber-300">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Need {formatCurrency(totals.amountNeededForMinOrder)} more</span>
            </span>
          )}
        </div>
      </div>

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
            const unitPrice = item.discountedPrice != null ? item.discountedPrice : Math.round(item.originalPrice * 0.10);
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
                    <div className="flex items-center gap-1.5 sm:mt-1">
                      <span className="font-bold text-brand-primary-dark sm:inline-block">{formatCurrency(unitPrice)}</span>
                      {item.originalPrice > unitPrice && (
                        <span className="text-slate-400 line-through text-[11px]">{formatCurrency(item.originalPrice)}</span>
                      )}
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        -90%
                      </span>
                    </div>
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
                <div className="w-28 text-right hidden sm:block">
                  <div className="font-bold text-brand-navy">{formatCurrency(unitPrice * item.quantity)}</div>
                  {item.originalPrice > unitPrice && (
                    <div className="text-xs text-slate-400 line-through">{formatCurrency(item.originalPrice * item.quantity)}</div>
                  )}
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
          <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-brand-border">
            <h2 className="font-display font-semibold text-lg text-brand-navy">{t("estimate.estimatedTotal")}</h2>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-200">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>90% OFF</span>
            </span>
          </div>

          <div className="flex justify-between text-sm text-brand-muted mb-2">
            <span>{t("estimate.subtotalItems")}</span>
            <span className="font-medium text-slate-700">{formatCurrency(totals.subtotal)}</span>
          </div>

          <div className="flex justify-between text-sm text-emerald-600 mb-2 font-semibold">
            <span>{t("estimate.discount90")}</span>
            <span>-{formatCurrency(totals.discount)}</span>
          </div>

          <div className="flex justify-between font-bold text-brand-navy text-xl border-t border-brand-border pt-3 mt-3">
            <span>{t("estimate.total")}</span>
            <span className="text-brand-primary-dark">{formatCurrency(totals.estimatedTotal)}</span>
          </div>

          {/* Minimum Order Check Card & Progress Bar */}
          <div className={`mt-5 p-4 rounded-xl border ${totals.isMinOrderMet ? "bg-emerald-50/80 border-emerald-200" : "bg-amber-50/80 border-amber-300"}`}>
            {totals.isMinOrderMet ? (
              <div className="flex items-start gap-2.5 text-emerald-800 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">{t("estimate.minOrderMet")}</p>
                  <p className="text-emerald-700 font-normal mt-0.5">
                    Order total ({formatCurrency(totals.estimatedTotal)}) meets the required ₹3,000 minimum.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-amber-900 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">{t("estimate.minOrderAlert", { amount: formatCurrency(totals.amountNeededForMinOrder) })}</p>
                    <p className="text-amber-800 font-normal mt-0.5">Minimum order value is ₹3,000 (after 90% discount).</p>
                  </div>
                </div>

                {/* Progress bar towards ₹3000 */}
                <div className="w-full bg-amber-200/70 rounded-full h-2 overflow-hidden mt-2">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.round((totals.estimatedTotal / totals.minOrderAmount) * 100))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-amber-800 font-medium">
                  <span>Current: {formatCurrency(totals.estimatedTotal)}</span>
                  <span>Min: {formatCurrency(totals.minOrderAmount)}</span>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-brand-muted mt-3 leading-relaxed">
            {t("estimate.finalPriceNote")}
          </p>

          {totals.isMinOrderMet ? (
            <button
              onClick={() => navigate("/estimate/customer-details")}
              className="btn-primary w-full mt-5 flex items-center justify-center gap-2 !py-3.5 text-base font-bold shadow-lg shadow-brand-orange/25 hover:scale-105 transition-all cursor-pointer"
            >
              <span>{t("estimate.requestEstimate")}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="space-y-2 mt-5">
              <button
                disabled
                className="w-full py-3.5 px-4 bg-slate-200 text-slate-400 font-bold rounded-full cursor-not-allowed text-sm flex items-center justify-center gap-2"
                title={`Minimum order is ₹3,000. Add ${formatCurrency(totals.amountNeededForMinOrder)} more.`}
              >
                <span>Add {formatCurrency(totals.amountNeededForMinOrder)} More to Place Order</span>
              </button>
              <Link
                to="/products"
                className="btn-primary w-full flex items-center justify-center gap-2 !py-3 text-sm font-semibold shadow-sm text-center"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{t("estimate.addMoreItems")}</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}