import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Sparkles,
  Flame,
  Rocket,
  Gift,
  Zap,
  Disc3,
  PartyPopper,
  Layers,
  ArrowRight,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Receipt,
  PhoneCall,
  ShoppingBag,
  Star,
  Award,
  FileDown,
  Percent,
  Loader2,
} from "lucide-react";
import { CategoryService, ProductService, PromotionService } from "../../services/api";
import ProductCard from "../../components/products/ProductCard";
import { LoadingGrid } from "../../components/common/States";
import { downloadPriceListPDF } from "../../utils/pdfGenerator";
import PromoBannerCarousel from "../../components/common/PromoBannerCarousel";
import { useSettings } from "../../context/SettingsContext";

const CATEGORY_CONFIG = {
  "single-sound-crackers": {
    icon: Zap,
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20 group-hover:bg-amber-500 group-hover:text-white",
  },
  "ground-chakkars": {
    icon: Disc3,
    color: "text-purple-500 bg-purple-500/10 border-purple-500/20 group-hover:bg-purple-500 group-hover:text-white",
  },
  "flower-pots": {
    icon: Sparkles,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white",
  },
  "rockets": {
    icon: Rocket,
    color: "text-rose-500 bg-rose-500/10 border-rose-500/20 group-hover:bg-rose-500 group-hover:text-white",
  },
  "sparklers": {
    icon: Flame,
    color: "text-amber-600 bg-amber-600/10 border-amber-600/20 group-hover:bg-amber-600 group-hover:text-white",
  },
  "childrens-special": {
    icon: PartyPopper,
    color: "text-pink-500 bg-pink-500/10 border-pink-500/20 group-hover:bg-pink-500 group-hover:text-white",
  },
  "repeating-shots": {
    icon: Layers,
    color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20 group-hover:bg-cyan-500 group-hover:text-white",
  },
  "gift-box": {
    icon: Gift,
    color: "text-orange-500 bg-orange-500/10 border-orange-500/20 group-hover:bg-orange-500 group-hover:text-white",
  },
  "wala-garlands": {
    icon: Flame,
    color: "text-red-500 bg-red-500/10 border-red-500/20 group-hover:bg-red-500 group-hover:text-white",
  },
  "bomb": {
    icon: Zap,
    color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white",
  },
  "combo-pack": {
    icon: Gift,
    color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20 group-hover:bg-yellow-500 group-hover:text-white",
  },
};

/**
 * Interactive HTML5 Fireworks Particle Canvas
 */
function FireworksCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    window.addEventListener("resize", handleResize);

    const particles = [];
    const colors = ["#F59E0B", "#EF4444", "#EC4899", "#3B82F6", "#10B981", "#8B5CF6", "#FBBF24"];

    function createBurst(x, y, count = 35) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1.5;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          alpha: 1,
          size: Math.random() * 2.5 + 1,
          decay: Math.random() * 0.015 + 0.012,
        });
      }
    }

    let lastAutoBurst = 0;

    function render(time) {
      ctx.clearRect(0, 0, width, height);

      if (time - lastAutoBurst > 1100) {
        lastAutoBurst = time;
        const rx = width * 0.15 + Math.random() * (width * 0.7);
        const ry = height * 0.15 + Math.random() * (height * 0.55);
        createBurst(rx, ry, Math.floor(Math.random() * 30 + 25));
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    }

    animationFrameId = requestAnimationFrame(render);

    const handleCanvasClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      createBurst(x, y, 45);
    };

    canvas.addEventListener("pointerdown", handleCanvasClick);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (canvas) canvas.removeEventListener("pointerdown", handleCanvasClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-auto cursor-crosshair opacity-85"
    />
  );
}

export default function Home() {
  const { t, i18n } = useTranslation();
  const { settings } = useSettings();
  const businessName = settings.business_name || "Sri RR Crackers";
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      await downloadPriceListPDF();
    } catch (e) {
      alert("Failed to generate Price List PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    Promise.all([CategoryService.list(), ProductService.featured(), PromotionService.list({ limit: 10 })])
      .then(([catRes, featRes, promotionRes]) => {
        setCategories(catRes.data || []);
        setFeatured(featRes.data || []);
        setPromotions(promotionRes.data?.items || []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="overflow-hidden">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-[#0D1527] to-slate-950 text-white min-h-[580px] sm:min-h-[660px] flex items-center">
        {/* Subtle festive dot-grid texture so the hero doesn't read as a flat gradient */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />

        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-primary/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-12 right-12 w-72 h-72 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Dynamic Fireworks Canvas */}
        <FireworksCanvas />

        <div className="container-page relative z-10 py-14 sm:py-20 grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Column Content */}
          <div className="lg:col-span-7 space-y-6">
            {/* Top Glowing Badges */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-extrabold tracking-wide uppercase px-3.5 py-1.5 rounded-full shadow-lg shadow-amber-500/10">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>DIWALI FESTIVAL SPECIAL 2025</span>
              </span>
              <span className="inline-flex items-center gap-1 bg-rose-500/20 border border-rose-400/40 text-rose-300 text-xs font-bold px-3 py-1.5 rounded-full">
                <Percent className="w-3 h-3 text-rose-400" />
                <span>UP TO 90% DISCOUNT</span>
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.12] tracking-tight">
              {t("home.heroTitle")}
            </h1>

            <p className="text-slate-300 text-base sm:text-lg max-w-xl leading-relaxed font-light">
              {t("home.heroSubtitle")}
            </p>

            {/* Action Buttons Hub */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                to="/products"
                className="btn-primary !py-3.5 !px-7 text-sm sm:text-base shadow-xl shadow-brand-orange/25 hover:shadow-brand-orange/45 hover:scale-105 transition-all flex items-center gap-2 group cursor-pointer"
              >
                <span>{t("home.exploreCrackers")}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-6 py-3.5 text-sm sm:text-base transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 hover:scale-105 cursor-pointer disabled:opacity-60"
              >
                {downloading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <FileDown className="w-4 h-4 text-slate-950" />
                )}
                <span>{downloading ? "Generating..." : "Download Price List"}</span>
              </button>

              <Link
                to="/estimate"
                className="rounded-full bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 text-white font-semibold px-6 py-3.5 text-sm sm:text-base transition-all flex items-center gap-2 shadow-sm"
              >
                <Receipt className="w-4 h-4 text-brand-gold" />
                <span>{t("home.getEstimate")}</span>
              </Link>
            </div>

            {/* Micro Trust Strip */}
            <div className="pt-6 border-t border-white/10 grid grid-cols-3 gap-3 sm:gap-6 text-xs sm:text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>100% Genuine Sivakasi</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Direct Factory Prices</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Safe Pan-India Transport</span>
              </div>
            </div>
          </div>

          {/* Right Column: Festive Showcase */}
          <div className="lg:col-span-5 relative flex justify-center items-center">
            <div className="relative w-full max-w-sm sm:max-w-md aspect-square rounded-3xl bg-gradient-to-tr from-white/10 via-white/5 to-transparent border border-white/20 backdrop-blur-xl p-6 shadow-2xl flex flex-col justify-between overflow-hidden">
              {/* Top Mini Badge Card */}
              <div className="bg-slate-900/80 border border-white/10 backdrop-blur-md rounded-2xl p-4 shadow-lg flex items-center justify-between animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-brand-gold flex items-center justify-center shrink-0 border border-amber-400/30">
                    <Star className="w-5 h-5 fill-brand-gold" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Sivakasi Direct Factory</div>
                    <div className="text-[11px] text-slate-400">Retail & Wholesale Catalogue 2025</div>
                  </div>
                </div>
                <span className="px-2 py-1 rounded bg-amber-400 text-slate-950 font-black text-[10px]">
                  90% OFF
                </span>
              </div>

              {/* Center Emblem */}
              <div className="my-auto py-4 text-center relative">
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-brand-primary via-brand-orange to-brand-gold p-1 shadow-2xl shadow-brand-primary/40 flex items-center justify-center animate-pulse">
                  <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-brand-gold" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-xs uppercase tracking-widest text-brand-gold font-extrabold">{businessName}</span>
                  <p className="text-xs font-medium text-slate-300 mt-0.5">Click canvas to burst firecrackers!</p>
                </div>
              </div>

              {/* Bottom Card with Quick Action */}
              <div className="bg-slate-900/80 border border-white/10 backdrop-blur-md rounded-2xl p-3.5 shadow-lg flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-white">Instant Estimate</div>
                    <div className="text-[10px] text-slate-400">Zero Advance Obligation</div>
                  </div>
                </div>
                <Link
                  to="/estimate"
                  className="text-xs font-bold text-brand-orange hover:text-amber-300 flex items-center gap-1"
                >
                  <span>Build</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Soft wave divider into the next section, so the hero doesn't end on a hard cut */}
        <svg
          className="absolute bottom-0 left-0 w-full h-10 sm:h-14 text-brand-cream"
          viewBox="0 0 1440 60"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path fill="currentColor" d="M0,32 C240,60 480,0 720,16 C960,32 1200,58 1440,28 L1440,60 L0,60 Z" />
        </svg>
      </section>

      {promotions.length > 0 && (
        <PromoBannerCarousel items={promotions.slice(0, 8)} />
      )}

      {/* PROMO BANNER: DOWNLOAD COMPLETE PRICE LIST PDF */}
      {/*<section className="bg-gradient-to-r from-amber-500 via-brand-orange to-amber-600 text-slate-950 py-6 px-4 shadow-md">
        <div className="container-page flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center md:text-left">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur border border-white/40 flex items-center justify-center shrink-0">
              <FileDown className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-base sm:text-lg">
                Download Official Retail Price List 2025 (PDF)
              </h3>
              <p className="text-xs sm:text-sm text-slate-900 font-medium">
                Complete catalog with product codes, Tamil descriptions, original rates & discounted prices.
              </p>
            </div>
          </div>

          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="rounded-full bg-slate-950 hover:bg-slate-900 text-white font-bold px-7 py-3 text-sm transition-all shadow-xl hover:scale-105 flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-70"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 text-amber-400" />
                <span>Download Price List PDF</span>
              </>
            )}
          </button>
        </div>
      </section>*}

      {/* CATEGORIES SECTION */}
      <section className="container-page py-16">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">Explore Products</span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-brand-navy mt-1">
              {t("home.shopByCategory")}
            </h2>
          </div>
          <Link to="/products" className="text-sm font-semibold text-brand-primary hover:underline flex items-center gap-1">
            <span>Explore All Products</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <LoadingGrid count={8} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
            {categories.map((c) => {
              const cfg = CATEGORY_CONFIG[c.slug] || {
                icon: Sparkles,
                color: "text-brand-primary bg-brand-primary/10 border-brand-primary/20 group-hover:bg-brand-primary group-hover:text-white",
              };
              const Icon = cfg.icon;

              return (
                <Link
                  key={c.id}
                  to={`/categories/${c.slug}`}
                  className="card-surface p-6 flex flex-col items-center text-center gap-3 group hover:border-brand-primary hover:shadow-xl hover:-translate-y-1 transition-all rounded-2xl border border-brand-border/80"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all duration-300 ${cfg.color}`}
                  >
                    <Icon className="w-7 h-7 transition-transform group-hover:scale-110" />
                  </div>
                  <span className="font-bold text-brand-navy text-sm leading-snug group-hover:text-brand-primary transition-colors">
                    {i18n.language === "ta" && c.nameTa ? c.nameTa : c.nameEn}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* FEATURED PRODUCTS SECTION */}
      <section className="bg-slate-50 py-16 border-y border-brand-border">
        <div className="container-page">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">Handpicked Selections</span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-brand-navy mt-1">
                {t("home.featuredProducts")}
              </h2>
            </div>
            <Link
              to="/products?featured=true"
              className="text-sm font-semibold text-brand-primary hover:underline flex items-center gap-1"
            >
              <span>{t("home.viewAll")}</span>
              <ArrowRight className="w-4 h-4" />
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
      <section className="container-page py-16">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">Simple 3-Step Process</span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-brand-navy mt-1">
            {t("home.howItWorks")}
          </h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { step: 1, icon: ShoppingBag },
            { step: 2, icon: Receipt },
            { step: 3, icon: PhoneCall },
          ].map(({ step, icon: Icon }) => (
            <div
              key={step}
              className="card-surface p-7 text-center rounded-2xl border border-brand-border/80 shadow-sm relative group hover:shadow-md transition-shadow"
            >
              <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto mb-5 group-hover:bg-brand-primary group-hover:text-white transition-colors">
                <Icon className="w-7 h-7" />
              </div>
              <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-100 text-brand-navy font-bold text-xs flex items-center justify-center">
                {step}
              </div>
              <h3 className="font-display font-bold text-brand-navy text-lg mb-2">{t(`home.step${step}Title`)}</h3>
              <p className="text-sm text-brand-muted leading-relaxed">{t(`home.step${step}Desc`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TRUST / WHY CHOOSE US */}
      <section className="bg-brand-navy text-white py-16 relative overflow-hidden">
        <div className="container-page relative z-10">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-gold">Why {businessName}</span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold mt-1">{t("home.whyChooseUs")}</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { n: 1, icon: ShieldCheck, color: "text-emerald-400 bg-emerald-400/10" },
              { n: 2, icon: Truck, color: "text-cyan-400 bg-cyan-400/10" },
              { n: 3, icon: Sparkles, color: "text-amber-400 bg-amber-400/10" },
            ].map(({ n, icon: Icon, color }) => (
              <div key={n} className="text-center px-4 space-y-3">
                <div className={`w-16 h-16 rounded-2xl ${color} flex items-center justify-center mx-auto mb-4 border border-white/10`}>
                  <Icon className="w-8 h-8" />
                </div>
                <h3 className="font-display font-bold text-lg text-white">{t(`home.trust${n}`)}</h3>
                <p className="text-sm text-white/70 leading-relaxed">{t(`home.trust${n}Desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
