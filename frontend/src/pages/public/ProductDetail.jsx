import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Minus, Plus, Check, MessageCircle, Search, ShieldCheck, Sparkles, Star } from "lucide-react";
import { ProductService } from "../../services/api";
import { formatCurrency, discountPercent, whatsappLink } from "../../utils/format";
import { useEstimate } from "../../context/EstimateContext";
import { useSettings } from "../../context/SettingsContext";
import { EmptyState } from "../../components/common/States";
import { getProductImageUrl, onImageError } from "../../utils/image";

export default function ProductDetail() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const { addItem } = useEstimate();
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

  return (
    <div className="container-page py-8 sm:py-12">
      <nav className="text-sm text-brand-muted mb-6 flex items-center gap-2 flex-wrap">
        <Link to="/" className="hover:text-brand-primary">{t("nav.home")}</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-brand-primary">{t("nav.products")}</Link>
        <span>/</span>
        <span className="text-brand-navy font-medium">{name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-10">
        <div className="aspect-square rounded-2xl bg-slate-50 border border-brand-border flex items-center justify-center overflow-hidden shadow-sm">
          <img
            src={getProductImageUrl(product.imageUrl)}
            alt={name}
            onError={onImageError}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        <div>
          {product.category && (
            <Link to={`/categories/${product.category.slug}`} className="text-xs font-semibold text-brand-primary uppercase tracking-wide">
              {i18n.language === "ta" && product.category.nameTa ? product.category.nameTa : product.category.nameEn}
            </Link>
          )}
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-navy mt-2">{name}</h1>
          {product.nameTa && i18n.language !== "ta" && <p className="font-tamil text-brand-muted mt-1">{product.nameTa}</p>}

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
            {t("product.unit")}: {product.unit} · {t("product.code")}: {product.productCode}
          </p>

          {description && (
            <div className="mt-6">
              <h3 className="font-display font-semibold text-brand-navy mb-1">{t("product.description")}</h3>
              <p className="text-brand-text/80 leading-relaxed">{description}</p>
            </div>
          )}

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center border border-brand-border rounded-full bg-white shadow-sm">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-10 h-10 flex items-center justify-center text-brand-navy hover:bg-slate-50 rounded-l-full transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center font-semibold text-brand-navy">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="w-10 h-10 flex items-center justify-center text-brand-navy hover:bg-slate-50 rounded-r-full transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => {
                addItem(product, qty);
                setAdded(true);
              }}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {added ? (
                <>
                  <Check className="w-5 h-5 text-emerald-300" />
                  <span>{t("product.added")}</span>
                </>
              ) : (
                <span>{t("product.addToEstimate")}</span>
              )}
            </button>
          </div>

          <a
            href={whatsappLink(settings.whatsapp_number, `Hi, I'm interested in ${product.nameEn} (${product.productCode})`)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 text-brand-primary font-semibold hover:underline"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{t("product.askOnWhatsApp")}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
