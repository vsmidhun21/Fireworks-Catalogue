import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Minus, Plus, Check, MessageCircle, Search, ShieldCheck, ShoppingCart, Trash2 } from "lucide-react";
import { ProductService } from "../../services/api";
import { formatCurrency, discountPercent, whatsappLink } from "../../utils/format";
import { useEstimate } from "../../context/EstimateContext";
import { useSettings } from "../../context/SettingsContext";
import { EmptyState } from "../../components/common/States";
import { getProductImageUrl, onImageError } from "../../utils/image";

export default function ProductDetail() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const { addItem, updateQuantity, removeItem, items, totals } = useEstimate();
  const { settings } = useSettings();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    setAdded(false);
    ProductService.bySlug(slug)
      .then((res) => setProduct(res.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <div className="container-page py-16 text-center text-brand-muted">{t("common.loading")}</div>;
  }
  if (notFound || !product) {
    return (
      <EmptyState
        icon={Search}
        title="Product not found"
        action={<Link to="/products" className="btn-primary">{t("estimate.browse")}</Link>}
      />
    );
  }

  const name = i18n.language === "ta" && product.nameTa ? product.nameTa : product.nameEn;
  const description = i18n.language === "ta" && product.descriptionTa ? product.descriptionTa : product.descriptionEn;
  const pct = discountPercent(product.originalPrice, product.discountedPrice);

  const orderItem = items.find((i) => i.productId === product.id);

  function handleAdd() {
    addItem(product, qty);
    setAdded(true);
  }

  return (
    <div className="container-page py-8 sm:py-12 pb-28 sm:pb-12">
      {/* Breadcrumb */}
      <nav className="text-sm text-brand-muted mb-6 flex items-center gap-2 flex-wrap">
        <Link to="/" className="hover:text-brand-primary">{t("nav.home")}</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-brand-primary">{t("nav.products")}</Link>
        <span>/</span>
        <span className="text-brand-navy font-medium">{name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Product image */}
        <div className="aspect-square rounded-2xl bg-slate-50 border border-brand-border flex items-center justify-center overflow-hidden shadow-sm">
          <img
            src={getProductImageUrl(product.imageUrl)}
            alt={name}
            onError={onImageError}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Product details */}
        <div>
          {product.category && (
            <Link to={`/categories/${product.category.slug}`} className="text-xs font-semibold text-brand-primary uppercase tracking-wide">
              {i18n.language === "ta" && product.category.nameTa ? product.category.nameTa : product.category.nameEn}
            </Link>
          )}
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-navy mt-2">{name}</h1>
          {product.nameTa && i18n.language !== "ta" && <p className="font-tamil text-brand-muted mt-1 text-lg">{product.nameTa}</p>}

          <div className="flex items-baseline gap-3 mt-5">
            <span className="text-3xl font-bold text-brand-primary-dark">
              {formatCurrency(product.discountedPrice ?? product.originalPrice)}
            </span>
            {product.discountedPrice && product.discountedPrice < product.originalPrice && (
              <>
                <span className="text-lg text-brand-muted line-through">{formatCurrency(product.originalPrice)}</span>
                <span className="text-sm font-bold text-brand-orange">-{pct}%</span>
              </>
            )}
          </div>
          <p className="text-sm text-brand-muted mt-1 font-medium">
            {t("product.unit")}: <strong>{product.unit}</strong> &nbsp;·&nbsp; {t("product.code")}: <strong>{product.productCode}</strong>
          </p>

          {description && (
            <div className="mt-5">
              <h3 className="font-display font-semibold text-brand-navy mb-1">{t("product.description")}</h3>
              <p className="text-brand-text/80 leading-relaxed">{description}</p>
            </div>
          )}

          {/* Add to order controls */}
          <div className="mt-8 space-y-3">
            {!orderItem ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center border-2 border-brand-border rounded-full bg-white shadow-sm overflow-hidden">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center text-brand-navy hover:bg-slate-50 rounded-l-full transition-colors" aria-label="Decrease">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center font-semibold text-brand-navy">{qty}</span>
                  <button onClick={() => setQty((q) => q + 1)} className="w-10 h-10 flex items-center justify-center text-brand-navy hover:bg-slate-50 rounded-r-full transition-colors" aria-label="Increase">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <button onClick={handleAdd} className="btn-primary flex-1 flex items-center justify-center gap-2 !py-3.5 text-base font-bold">
                  {added ? (
                    <><Check className="w-5 h-5 text-emerald-300" /><span>{t("product.added")}</span></>
                  ) : (
                    <><Plus className="w-5 h-5" /><span>{t("product.addToOrder")}</span></>
                  )}
                </button>
              </div>
            ) : (
              <div className="bg-brand-primary/5 border-2 border-brand-primary/30 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-brand-primary flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> In Your Order
                  </span>
                  <button onClick={() => removeItem(product.id)} className="text-rose-500 hover:text-rose-700 text-xs font-semibold flex items-center gap-1">
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border-2 border-brand-primary rounded-full bg-white overflow-hidden">
                    <button onClick={() => { if (orderItem.quantity <= 1) removeItem(product.id); else updateQuantity(product.id, orderItem.quantity - 1); }} className="w-9 h-9 flex items-center justify-center text-brand-primary hover:bg-brand-primary hover:text-white rounded-l-full transition-colors">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-9 text-center font-bold text-brand-primary">{orderItem.quantity}</span>
                    <button onClick={() => updateQuantity(product.id, orderItem.quantity + 1)} className="w-9 h-9 flex items-center justify-center text-brand-primary hover:bg-brand-primary hover:text-white rounded-r-full transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="font-bold text-brand-navy text-lg">{formatCurrency((product.discountedPrice ?? product.originalPrice) * orderItem.quantity)}</span>
                </div>
              </div>
            )}
          </div>

          {/* WhatsApp ask */}
          <a
            href={whatsappLink(settings.whatsapp_number, `Hi, I'\''m interested in ${product.nameEn} (${product.productCode})`)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 text-[#25D366] font-semibold hover:underline"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{t("product.askOnWhatsApp")}</span>
          </a>
        </div>
      </div>

      {/* Mini order summary at bottom (if items in cart) */}
      {items.length > 0 && (
        <div className="mt-12 card-surface rounded-2xl border border-brand-border/80 overflow-hidden shadow-sm">
          <div className="bg-brand-primary/5 border-b border-brand-border px-5 py-4 flex items-center justify-between">
            <h3 className="font-display font-bold text-brand-navy flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-brand-primary" />
              {t("product.yourOrder")} ({totals.count} items)
            </h3>
            <Link to="/estimate" className="text-sm font-bold text-brand-primary hover:underline">
              {t("product.viewOrder")} →
            </Link>
          </div>
          <div className="px-5 py-4 space-y-2 max-h-52 overflow-y-auto">
            {items.map((item) => {
              const iname = i18n.language === "ta" && item.nameTa ? item.nameTa : item.nameEn;
              return (
                <div key={item.productId} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <img src={getProductImageUrl(item.imageUrl)} alt={iname} onError={onImageError} className="w-8 h-8 rounded-lg object-cover shrink-0 border border-brand-border" />
                    <span className="text-brand-navy font-medium truncate">{iname}</span>
                    <span className="text-brand-muted shrink-0">x{item.quantity}</span>
                  </div>
                  <span className="font-bold text-brand-navy shrink-0 ml-2">
                    {formatCurrency((item.discountedPrice ?? item.originalPrice) * item.quantity)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="border-t border-brand-border px-5 py-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-brand-muted">Estimated Total</span>
              <p className="font-bold text-xl text-brand-primary-dark">{formatCurrency(totals.estimatedTotal)}</p>
            </div>
            <Link to="/estimate" className="btn-primary !py-3 !px-6 flex items-center gap-2 shadow-lg shadow-brand-orange/20 hover:scale-105 transition-all">
              <ShoppingCart className="w-4 h-4" />
              <span>{t("nav.orderNow")}</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}