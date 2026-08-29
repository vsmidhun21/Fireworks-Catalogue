import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CategoryService, ProductService } from "../../services/api";
import ProductCard from "../../components/products/ProductCard";
import { LoadingGrid } from "../../components/common/States";

const CATEGORY_ICONS = {
  "single-sound-crackers": "💥",
  "ground-chakkars": "🌀",
  "flower-pots": "🎇",
  "rockets": "🚀",
  "sparklers": "✨",
  "children-s-special": "🎈",
  "repeating-shots": "🎆",
  "gift-boxes": "🎁",
};

export default function Home() {
  const { t, i18n } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([CategoryService.list(), ProductService.featured()])
      .then(([catRes, featRes]) => {
        setCategories(catRes.data);
        setFeatured(featRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-navy via-brand-primary-dark to-brand-primary text-white">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-10 left-10 w-2 h-2 rounded-full bg-brand-gold animate-spark" />
          <div className="absolute top-24 right-24 w-3 h-3 rounded-full bg-brand-orange animate-spark" style={{ animationDelay: "0.5s" }} />
          <div className="absolute bottom-16 left-1/3 w-2 h-2 rounded-full bg-white animate-spark" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/3 right-1/4 w-2 h-2 rounded-full bg-brand-gold animate-spark" style={{ animationDelay: "1.5s" }} />
        </div>

        <div className="container-page relative py-16 sm:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-block bg-white/10 text-brand-gold text-xs font-semibold tracking-wide uppercase px-3 py-1 rounded-full mb-4">
              Sivakasi · Tamil Nadu
            </span>
            <h1 className="font-display text-3xl sm:text-5xl font-extrabold leading-tight mb-4">
              {t("home.heroTitle")}
            </h1>
            <p className="text-white/80 text-base sm:text-lg max-w-lg mb-8">{t("home.heroSubtitle")}</p>
            <div className="flex flex-wrap gap-3">
              <Link to="/products" className="btn-primary">
                {t("home.exploreCrackers")}
              </Link>
              <Link to="/estimate" className="btn-secondary">
                {t("home.getEstimate")}
              </Link>
            </div>
          </div>
          <div className="hidden md:flex justify-center animate-float">
            <div className="text-[160px] leading-none select-none">🎆</div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container-page py-14">
        <div className="flex items-end justify-between mb-6">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-brand-navy">{t("home.shopByCategory")}</h2>
        </div>
        {loading ? (
          <LoadingGrid count={8} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {categories.map((c) => (
              <Link
                key={c.id}
                to={`/categories/${c.slug}`}
                className="card-surface p-5 flex flex-col items-center text-center gap-2 hover:border-brand-primary hover:shadow-md transition-all"
              >
                <span className="text-4xl">{CATEGORY_ICONS[c.slug] || "🎆"}</span>
                <span className="font-semibold text-brand-navy text-sm">
                  {i18n.language === "ta" && c.nameTa ? c.nameTa : c.nameEn}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="bg-white py-14 border-y border-brand-border">
        <div className="container-page">
          <div className="flex items-end justify-between mb-6">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-brand-navy">{t("home.featuredProducts")}</h2>
            <Link to="/products?featured=true" className="text-brand-primary font-semibold hover:underline">
              {t("home.viewAll")} →
            </Link>
          </div>
          {loading ? (
            <LoadingGrid count={4} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* HOW ESTIMATES WORK */}
      <section className="container-page py-14">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-brand-navy text-center mb-10">
          {t("home.howItWorks")}
        </h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {[1, 2, 3].map((step) => (
            <div key={step} className="card-surface p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-brand-primary text-white font-display font-bold flex items-center justify-center mx-auto mb-4">
                {step}
              </div>
              <h3 className="font-display font-semibold text-brand-navy mb-2">{t(`home.step${step}Title`)}</h3>
              <p className="text-sm text-brand-muted">{t(`home.step${step}Desc`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TRUST SECTION */}
      <section className="bg-brand-navy text-white py-14">
        <div className="container-page">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-center mb-10">{t("home.whyChooseUs")}</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="text-center px-4">
                <div className="text-4xl mb-3">{n === 1 ? "✅" : n === 2 ? "🚚" : "🌟"}</div>
                <h3 className="font-display font-semibold mb-2">{t(`home.trust${n}`)}</h3>
                <p className="text-sm text-white/70">{t(`home.trust${n}Desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
