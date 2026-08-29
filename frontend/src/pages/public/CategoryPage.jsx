import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, ShoppingBag } from "lucide-react";
import { CategoryService, ProductService } from "../../services/api";
import ProductCard from "../../components/products/ProductCard";
import { LoadingGrid, EmptyState } from "../../components/common/States";
import Pagination from "../../components/common/Pagination";

const PAGE_SIZE = 10;

export default function CategoryPage() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  function loadProducts(nextPage = 1) {
    return ProductService.list({ category: slug, page: nextPage, limit: PAGE_SIZE }).then((res) => {
      setProducts(res?.data?.items || []);
      setTotal(res?.data?.total || 0);
      setPage(res?.data?.page || nextPage);
    });
  }

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    setPage(1);
    CategoryService.bySlug(slug)
      .then((res) => {
        setCategory(res.data);
        return loadProducts(1);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

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
        <LoadingGrid count={PAGE_SIZE} />
      ) : products.length === 0 ? (
        <EmptyState title={t("product.noResults")} />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <Pagination
            page={page}
            total={total}
            pageSize={PAGE_SIZE}
            className="mt-10"
            onPageChange={(nextPage) => {
              setLoading(true);
              loadProducts(nextPage).finally(() => setLoading(false));
            }}
          />
        </>
      )}
    </div>
  );
}
