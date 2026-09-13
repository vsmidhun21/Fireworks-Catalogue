import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { CategoryService, ProductService } from "../../services/api";
import ProductCard from "../../components/products/ProductCard";
import { LoadingGrid, EmptyState } from "../../components/common/States";
import { catalogueDiscountSummary } from "../../utils/format";

const SKELETON_COUNT = 10;

export default function Products() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);

  // Flat, filtered list — used whenever the customer has search/category/
  // sort/featured active (existing behaviour, untouched).
  const [products, setProducts] = useState([]);
  // Grouped-by-category list — used for the default view (no filters
  // active), so products are shown one category at a time, in the order
  // each category's products were first added.
  const [groups, setGroups] = useState([]);

  const [loading, setLoading] = useState(true);

  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const featured = searchParams.get("featured") || "";
  const sort = searchParams.get("sort") || "";

  // Any active filter drops us into the flat, filtered view. With nothing
  // selected, the page defaults to the grouped-by-category browsing view.
  const hasActiveFilters = Boolean(search || category || featured || sort);

  const allVisibleProducts = useMemo(
    () => (hasActiveFilters ? products : groups.flatMap((g) => g.products)),
    [hasActiveFilters, products, groups]
  );
  const discountSummary = catalogueDiscountSummary(allVisibleProducts);

  useEffect(() => {
    CategoryService.list().then((res) => setCategories(res.data));
  }, []);

  useEffect(() => {
    setLoading(true);

    if (hasActiveFilters) {
      // No page/limit is sent: the customer catalogue returns all active
      // products in a single, unpaginated response.
      ProductService.list({ search, category, featured, sort })
        .then((res) => setProducts(res.data.items))
        .finally(() => setLoading(false));
    } else {
      ProductService.groupedByCategory()
        .then((res) => setGroups(res.data.groups))
        .finally(() => setLoading(false));
    }
  }, [hasActiveFilters, search, category, featured, sort]);

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  }

  return (
    <div className="container-page py-8 sm:py-12">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-navy">{t("nav.products")}</h1>
          <p className="text-sm text-brand-muted mt-1">{t("product.subtitle")}</p>
        </div>
      </div>

      {/* Offer & Minimum Order Banner */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 border border-amber-300/80 flex items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
            {discountSummary.pct}%
          </div>
          <div>
            <p className="font-display font-bold text-brand-navy text-sm sm:text-base">
              {t("home.catalogueNotice")}
            </p>
            <p className="text-xs text-brand-muted">
              Select crackers directly at Sivakasi factory rates ·{" "}
              {discountSummary.uniform ? `Flat ${discountSummary.pct}%` : `Up to ${discountSummary.pct}%`} discount is
              applied automatically in your order summary.
            </p>
          </div>
        </div>
        <div className="hidden md:flex shrink-0">
          <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold rounded-full">
            Min. Order ₹3,000
          </span>
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
      ) : hasActiveFilters ? (
        products.length === 0 ? (
          <EmptyState title={t("product.noResults")} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )
      ) : groups.length === 0 ? (
        <EmptyState title={t("product.noResults")} />
      ) : (
        <>
          {/* Quick jump to a category, so customers can pick a section directly */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-1 px-1">
            {groups.map(({ category: c }) => (
              <a
                key={c.id}
                href={`#category-${c.slug}`}
                className="shrink-0 rounded-full border border-brand-border bg-white px-4 py-1.5 text-xs font-semibold text-brand-navy hover:border-brand-primary hover:text-brand-primary transition-colors"
              >
                {i18n.language === "ta" && c.nameTa ? c.nameTa : c.nameEn}
              </a>
            ))}
          </div>

          <div className="space-y-10">
            {groups.map(({ category: c, products: catProducts }) => (
              <section key={c.id} id={`category-${c.slug}`} className="scroll-mt-24">
                <div className="flex items-baseline justify-between gap-3 mb-4">
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-brand-navy">
                    {i18n.language === "ta" && c.nameTa ? c.nameTa : c.nameEn}
                  </h2>
                  <button
                    type="button"
                    onClick={() => navigate(`/category/${c.slug}`)}
                    className="shrink-0 text-xs sm:text-sm font-semibold text-brand-primary hover:text-brand-primary-dark"
                  >
                    {t("product.exploreMore")}
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {catProducts.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
