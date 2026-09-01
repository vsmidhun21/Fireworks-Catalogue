import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { CategoryService, ProductService } from "../../services/api";
import ProductCard from "../../components/products/ProductCard";
import { LoadingGrid, EmptyState } from "../../components/common/States";

const SKELETON_COUNT = 10;

export default function Products() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const featured = searchParams.get("featured") || "";
  const sort = searchParams.get("sort") || "";

  useEffect(() => {
    CategoryService.list().then((res) => setCategories(res.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    // No page/limit is sent: the customer catalogue returns all active
    // products in a single, unpaginated response.
    ProductService.list({ search, category, featured, sort })
      .then((res) => {
        setProducts(res.data.items);
      })
      .finally(() => setLoading(false));
  }, [search, category, featured, sort]);

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  }

  return (
    <div className="container-page py-8 sm:py-12">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-navy">{t("nav.products")}</h1>
          <p className="text-sm text-brand-muted mt-1">Explore authentic Sivakasi fireworks at factory-direct rates</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            type="search"
            defaultValue={search}
            onKeyDown={(e) => e.key === "Enter" && updateParam("search", e.currentTarget.value)}
            onBlur={(e) => updateParam("search", e.currentTarget.value)}
            placeholder={t("product.searchPlaceholder")}
            className="w-full rounded-full border border-brand-border pl-11 pr-5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white"
          />
        </div>
        <select
          value={category}
          onChange={(e) => updateParam("category", e.target.value)}
          className="rounded-full border border-brand-border px-4 py-2.5 bg-white text-sm focus:outline-none focus:border-brand-primary"
        >
          <option value="">{t("product.allCategories")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {i18n.language === "ta" && c.nameTa ? c.nameTa : c.nameEn}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => updateParam("sort", e.target.value)}
          className="rounded-full border border-brand-border px-4 py-2.5 bg-white text-sm focus:outline-none focus:border-brand-primary"
        >
          <option value="">{t("product.sortDefault")}</option>
          <option value="price_asc">{t("product.sortPriceAsc")}</option>
          <option value="price_desc">{t("product.sortPriceDesc")}</option>
          <option value="newest">{t("product.sortNewest")}</option>
        </select>
      </div>

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
    </div>
  );
}
