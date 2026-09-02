import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, ShoppingBag } from "lucide-react";
import { CategoryService, ProductService } from "../../services/api";
import ProductCard from "../../components/products/ProductCard";
import { LoadingGrid, EmptyState } from "../../components/common/States";

const SKELETON_COUNT = 10;
const EXPLORE_MORE_LIMIT = 8;

export default function CategoryPage() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [exploreProducts, setExploreProducts] = useState([]);

  function loadProducts() {
    // No page/limit is sent: the category page shows every active product
    // in the category in a single, unpaginated response.
    return ProductService.list({ category: slug }).then((res) => {
      setProducts(res?.data?.items || []);
    });
  }

  function loadExploreMore(categoryProductIds) {
    // Reuse the existing featured-products endpoint so no backend change is
    // needed. Featured products naturally span multiple categories; any
    // items already shown in the category section above are filtered out
    // so this section doesn't just repeat the same products.
    ProductService.featured()
      .then((res) => {
        const items = res?.data || [];
        const filtered = items.filter((p) => !categoryProductIds.has(p.id));
        setExploreProducts(filtered.slice(0, EXPLORE_MORE_LIMIT));
      })
      .catch(() => setExploreProducts([]));
  }

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    setExploreProducts([]);
    CategoryService.bySlug(slug)
      .then((res) => {
        setCategory(res.data);
        return loadProducts();
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    if (loading || notFound) return;
    loadExploreMore(new Set(products.map((p) => p.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, notFound, slug]);

  if (notFound) {
    return (
      <EmptyState
        icon={Search}
        title="Category not found"
        action={
          <Link to="/products" className="btn-primary inline-flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            <span>{t("estimate.browse")}</span>
          </Link>
        }
      />
    );
  }

  return (
    <div className="container-page py-8 sm:py-12">
      {category && (
        <div className="mb-8">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-navy">
            {i18n.language === "ta" && category.nameTa ? category.nameTa : category.nameEn}
          </h1>
          {category.descriptionEn && <p className="text-brand-muted mt-2 max-w-2xl">{category.descriptionEn}</p>}
        </div>
      )}

      {loading ? (
        <LoadingGrid count={SKELETON_COUNT} />
      ) : products.length === 0 ? (
        <EmptyState title={t("product.noResults")} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {!loading && !notFound && exploreProducts.length > 0 && (
        <div className="mt-12 sm:mt-16">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-brand-navy mb-6">
            {t("product.exploreMore")}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {exploreProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
