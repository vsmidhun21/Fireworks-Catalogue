import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Minus, Check, Star } from "lucide-react";
import { formatCurrency, discountPercent } from "../../utils/format";
import { useEstimate } from "../../context/EstimateContext";
import { getProductImageUrl, onImageError } from "../../utils/image";

export default function ProductCard({ product }) {
  const { t, i18n } = useTranslation();
  const { addItem, updateQuantity, removeItem, items } = useEstimate();
  const pct = discountPercent(product.originalPrice, product.discountedPrice);
  const name = i18n.language === "ta" && product.nameTa ? product.nameTa : product.nameEn;

  const orderItem = items.find((i) => i.productId === product.id);
  const qty = orderItem?.quantity || 0;

  return (
    <div className="card-surface overflow-hidden group flex flex-col h-full hover:shadow-lg hover:shadow-brand-primary/10 transition-all duration-300 rounded-2xl border border-brand-border/80">
      <Link to={`/products/${product.slug}`} className="relative block aspect-square bg-slate-100 overflow-hidden">
        <img
          src={getProductImageUrl(product.imageUrl)}
          alt={name}
          onError={onImageError}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {product.isFeatured && (
          <span className="absolute top-2.5 left-2.5 bg-brand-gold text-brand-navy text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
            <Star className="w-3 h-3 fill-brand-navy" />
            <span>{t("product.featured")}</span>
          </span>
        )}
        {pct > 0 && (
          <span className="absolute top-2.5 right-2.5 bg-brand-orange text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
            -{pct}%
          </span>
        )}
      </Link>

      <div className="p-4 flex flex-col flex-1">
        <Link
          to={`/products/${product.slug}`}
          className="font-display font-bold text-brand-navy leading-snug hover:text-brand-primary line-clamp-2 min-h-[2.6rem] transition-colors"
        >
          {name}
        </Link>
        {product.nameTa && i18n.language !== "ta" && (
          <span className="font-tamil text-xs text-brand-muted mt-0.5">{product.nameTa}</span>
        )}
        <span className="text-xs text-brand-muted mt-1 font-medium">{product.unit}</span>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-lg font-extrabold text-brand-primary-dark">
            {formatCurrency(product.discountedPrice ?? product.originalPrice)}
          </span>
          {product.discountedPrice && product.discountedPrice < product.originalPrice && (
            <span className="text-sm text-brand-muted line-through">
              {formatCurrency(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Add / Quantity Controls */}
        <div className="mt-4">
          {qty === 0 ? (
            <button
              onClick={() => addItem(product, 1)}
              className="w-full rounded-full bg-brand-primary text-white text-sm font-semibold py-2.5 hover:bg-brand-primary-dark transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>{t("product.addToOrder")}</span>
            </button>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center border-2 border-brand-primary rounded-full bg-white overflow-hidden">
                <button
                  onClick={() => {
                    if (qty <= 1) removeItem(product.id);
                    else updateQuantity(product.id, qty - 1);
                  }}
                  className="w-8 h-8 flex items-center justify-center text-brand-primary hover:bg-brand-primary hover:text-white rounded-l-full transition-colors font-bold"
                  aria-label="Decrease"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center text-sm font-bold text-brand-primary">{qty}</span>
                <button
                  onClick={() => updateQuantity(product.id, qty + 1)}
                  className="w-8 h-8 flex items-center justify-center text-brand-primary hover:bg-brand-primary hover:text-white rounded-r-full transition-colors font-bold"
                  aria-label="Increase"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
                <Check className="w-3.5 h-3.5" />
                {t("product.inOrder")}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}