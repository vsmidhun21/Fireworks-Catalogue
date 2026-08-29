import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formatCurrency, discountPercent } from "../../utils/format";
import { useEstimate } from "../../context/EstimateContext";

export default function ProductCard({ product }) {
  const { t, i18n } = useTranslation();
  const { addItem } = useEstimate();
  const pct = discountPercent(product.originalPrice, product.discountedPrice);
  const name = i18n.language === "ta" && product.nameTa ? product.nameTa : product.nameEn;

  return (
    <div className="card-surface overflow-hidden group flex flex-col h-full hover:shadow-lg hover:shadow-brand-primary/10 transition-shadow">
      <Link to={`/products/${product.slug}`} className="relative block aspect-square bg-brand-cream overflow-hidden">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🎇</div>
        )}
        {product.isFeatured && (
          <span className="absolute top-2 left-2 bg-brand-gold text-brand-navy text-[11px] font-bold px-2 py-1 rounded-full">
            {t("product.featured")}
          </span>
        )}
        {pct > 0 && (
          <span className="absolute top-2 right-2 bg-brand-orange text-white text-[11px] font-bold px-2 py-1 rounded-full">
            -{pct}%
          </span>
        )}
      </Link>

      <div className="p-4 flex flex-col flex-1">
        <Link to={`/products/${product.slug}`} className="font-display font-semibold text-brand-navy leading-snug hover:text-brand-primary line-clamp-2 min-h-[2.6rem]">
          {name}
        </Link>
        {product.nameTa && i18n.language !== "ta" && (
          <span className="font-tamil text-xs text-brand-muted mt-0.5">{product.nameTa}</span>
        )}
        <span className="text-xs text-brand-muted mt-1">{product.unit}</span>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-lg font-bold text-brand-primary-dark">
            {formatCurrency(product.discountedPrice ?? product.originalPrice)}
          </span>
          {product.discountedPrice && product.discountedPrice < product.originalPrice && (
            <span className="text-sm text-brand-muted line-through">{formatCurrency(product.originalPrice)}</span>
          )}
        </div>

        <button
          onClick={() => addItem(product, 1)}
          className="mt-4 w-full rounded-full bg-brand-primary text-white text-sm font-semibold py-2.5 hover:bg-brand-primary-dark transition-colors"
        >
          {t("product.addToEstimate")}
        </button>
      </div>
    </div>
  );
}
