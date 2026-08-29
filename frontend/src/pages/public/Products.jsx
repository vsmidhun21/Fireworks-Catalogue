import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CategoryService, ProductService } from "../../services/api";
import ProductCard from "../../components/products/ProductCard";
import { LoadingGrid, EmptyState } from "../../components/common/States";

export default function Products() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const featured = searchParams.get("featured") || "";
  const sort = searchParams.get("sort") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  useEffect(() => {
    CategoryService.list().then((res) => setCategories(res.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    ProductService.list({ search, category, featured, sort, page, limit: 12 })
      .then((res) => {
        setProducts(res.data.items);
        setTotal(res.data.total);
      })
      .finally(() => setLoading(false));
  }, [search, category, featured, sort, page]);

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    setSearchParams(next);
  }

  const totalPages = Math.max(1, Math.ceil(total / 12));

  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-navy mb-6">{t("nav.products")}</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <input
            type="search"
            defaultValue={search}
            onKeyDown={(e) => e.key === "Enter" && updateParam("search", e.currentTarget.value)}
            onBlur={(e) => updateParam("search", e.currentTarget.value)}
            placeholder={t("product.searchPlaceholder")}
            className="w-full rounded-full border border-brand-border px-5 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
          />
        </div>
        <select
          value={category}
          onChange={(e) => updateParam("category", e.target.value)}
          className="rounded-full border border-brand-border px-4 py-2.5 bg-white"
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
          className="rounded-full border border-brand-border px-4 py-2.5 bg-white"
        >
          <option value="">{t("product.sortDefault")}</option>
          <option value="price_asc">{t("product.sortPriceAsc")}</option>
          <option value="price_desc">{t("product.sortPriceDesc")}</option>
          <option value="newest">{t("product.sortNewest")}</option>
        </select>
      </div>

      {loading ? (
        <LoadingGrid count={12} />
      ) : products.length === 0 ? (
        <EmptyState title={t("product.noResults")} />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const next = new URLSearchParams(searchParams);
                    next.set("page", String(i + 1));
                    setSearchParams(next);
                  }}
                  className={`w-9 h-9 rounded-full font-semibold text-sm ${
                    page === i + 1 ? "bg-brand-primary text-white" : "bg-white border border-brand-border text-brand-navy"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
