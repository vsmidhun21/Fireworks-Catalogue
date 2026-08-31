import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Sparkles, ArrowRight, Truck, CheckCircle2, PhoneCall, ShieldCheck,
  ShoppingBag, Award, FileDown, Percent, Loader2, MessageCircle,
} from "lucide-react";
import { CategoryService, ProductService, PromotionService } from "../../services/api";
import ProductCard from "../../components/products/ProductCard";
import { LoadingGrid } from "../../components/common/States";
import { downloadPriceListPDF } from "../../utils/pdfGenerator";
import PromoBannerCarousel from "../../components/common/PromoBannerCarousel";
import CategoryShowcase from "../../components/common/CategoryShowcase";
import BrandStory from "../../components/common/BrandStory";
import WhyChooseUs from "../../components/common/WhyChooseUs";
import GiftBoxShowcase from "../../components/common/GiftBoxShowcase";
import SEO from "../../components/common/SEO";
import { useSettings } from "../../context/SettingsContext";
import { whatsappLink } from "../../utils/format";

/**
 * Full-hero Interactive Fireworks Canvas
 */
function FireworksCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;

    let W = (canvas.width = canvas.offsetWidth);
    let H = (canvas.height = canvas.offsetHeight);

    const onResize = () => {
      if (!canvas) return;
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", onResize);

    const particles = [];
    const COLORS = ["#F59E0B","#EF4444","#EC4899","#3B82F6","#10B981","#8B5CF6","#FBBF24","#F97316","#06B6D4","#A855F7"];

    function burst(x, y, count = 45) {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const trailColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 1.5;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: Math.random() > 0.3 ? color : trailColor,
          alpha: 1,
          size: Math.random() * 3 + 1,
          decay: Math.random() * 0.012 + 0.01,
          trail: Math.random() > 0.5,
        });
      }
    }

    // Auto-schedule multiple bursts
    const schedule = [];
    let lastAuto = 0;

    function render(t) {
      ctx.clearRect(0, 0, W, H);

      // Auto burst every ~900ms, up to 3 at once on first load
      if (t - lastAuto > 900) {
        lastAuto = t;
        const count = particles.length < 60 ? 3 : 1;
        for (let k = 0; k < count; k++) {
          const rx = W * 0.1 + Math.random() * (W * 0.8);
          const ry = H * 0.1 + Math.random() * (H * 0.75);
          burst(rx, ry, Math.floor(Math.random() * 35 + 30));
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.vx *= 0.99;
        p.alpha -= p.decay;
        if (p.alpha <= 0) { particles.splice(i, 1); continue; }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = p.trail ? 14 : 6;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        if (p.trail) {
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 3, p.y - p.vy * 3);
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.size;
          ctx.globalAlpha = p.alpha * 0.7;
          ctx.stroke();
        } else {
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    }
    animId = requestAnimationFrame(render);

    const onClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      burst(x, y, 60);
    };
    canvas.addEventListener("pointerdown", onClick);

    return () => {
      window.removeEventListener("resize", onResize);
      if (canvas) canvas.removeEventListener("pointerdown", onClick);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-auto cursor-crosshair"
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

  const phone = settings?.phone_primary || "";
  const whatsappNum = settings?.whatsapp_number || "";

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
      <SEO
        title="Premium Fireworks for Memorable Celebrations"
        description={`${businessName} — browse our fireworks catalogue and request an estimate online. No online payment required.`}
      />
      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-[#0D1527] to-slate-950 text-white min-h-[90vh] sm:min-h-[85vh] flex items-center">
        {/* Dot grid texture */}
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }}
        />

        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/5 w-80 h-80 bg-brand-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 right-1/5 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-16 right-8 w-60 h-60 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Full-area Fireworks Canvas — interactive */}
        <FireworksCanvas />

        <div className="container-page relative z-10 py-16 sm:py-24 text-center lg:text-left">
          <div className="max-w-3xl mx-auto lg:mx-0">
            {/* Top badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 mb-6">
              <span className="inline-flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-extrabold tracking-wide uppercase px-4 py-1.5 rounded-full shadow-lg shadow-amber-500/10">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                DIWALI FESTIVAL SPECIAL 2025
              </span>
              <span className="inline-flex items-center gap-1 bg-rose-500/20 border border-rose-400/40 text-rose-300 text-xs font-bold px-3 py-1.5 rounded-full">
                <Percent className="w-3 h-3" />
                UP TO 90% DISCOUNT
              </span>
            </div>

            {/* Main headline */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight mb-2">
              {t("home.heroTitle")}
            </h1>

            {/* Tamil subtitle always visible */}
            {i18n.language !== "ta" && (
              <p className="font-tamil text-2xl sm:text-3xl text-amber-300/80 font-semibold mb-4">
                உங்கள் கொண்டாட்டங்களை ஒளிரச் செய்யுங்கள்!
              </p>
            )}

            <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed font-light mb-8">
              {t("home.heroSubtitle")}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-6">
              <Link
                to="/products"
                className="btn-primary !py-4 !px-8 text-base sm:text-lg shadow-xl shadow-brand-orange/30 hover:shadow-brand-orange/50 hover:scale-105 transition-all flex items-center gap-2 group"
              >
                <span>{t("home.exploreCrackers")}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/estimate"
                className="rounded-full bg-white text-brand-navy font-bold px-8 py-4 text-base sm:text-lg transition-all flex items-center gap-2 shadow-lg hover:scale-105"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>{t("home.orderNow")}</span>
              </Link>

              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="rounded-full bg-amber-500/20 hover:bg-amber-500/30 backdrop-blur border border-amber-400/40 text-amber-300 font-semibold px-6 py-4 text-sm sm:text-base transition-all flex items-center gap-2 disabled:opacity-60"
              >
                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                <span>{downloading ? "Generating..." : "Price List PDF"}</span>
              </button>
            </div>

            {/* Click hint */}
            {/* <p className="text-slate-400 text-xs sm:text-sm animate-pulse">
              ✨ {t("home.clickToBurst")}
            </p> */}

            {/* Trust strip */}
            <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm text-slate-300 max-w-xl mx-auto lg:mx-0">
              <div className="flex items-center justify-center lg:justify-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>100% Genuine Sivakasi</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-2">
                <Award className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Direct Factory Prices</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-2">
                <Truck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Pan-India Delivery</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <svg className="absolute bottom-0 left-0 w-full h-10 sm:h-14 text-brand-cream" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true">
          <path fill="currentColor" d="M0,32 C240,60 480,0 720,16 C960,32 1200,58 1440,28 L1440,60 L0,60 Z" />
        </svg>
      </section>

      {/* ── PROMO BANNERS ── */}
      {promotions.length > 0 && <PromoBannerCarousel items={promotions.slice(0, 8)} />}

      {/* ── CATEGORIES ── */}
      <section className="container-page py-14 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">Explore Products / பொருட்களை பார்க்க</span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-brand-navy mt-1">
              {t("home.shopByCategory")}
            </h2>
          </div>
          <Link to="/products" className="text-sm font-semibold text-brand-primary hover:underline flex items-center gap-1">
            <span>View All Products</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <LoadingGrid count={8} />
        ) : (
          <CategoryShowcase categories={categories} />
        )}
      </section>

      {/* ── GIFT BOX SHOWCASE ── */}
      <GiftBoxShowcase />

      {/* ── FEATURED PRODUCTS ── */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-14 sm:py-16 border-y border-brand-border">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">Bestsellers / பிரபலமானவை</span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-brand-navy mt-1">
                {t("home.featuredProducts")}
              </h2>
            </div>
            <Link to="/products?featured=true" className="text-sm font-semibold text-brand-primary hover:underline flex items-center gap-1">
              <span>{t("home.viewAll")}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <LoadingGrid count={4} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── HOW TO ORDER ── */}
      <section className="container-page py-14 sm:py-16">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">Simple Process / எளிய படிகள்</span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-brand-navy mt-1">
            {t("home.howItWorks")}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { step: 1, icon: ShoppingBag, color: "bg-amber-400/10 text-amber-600 border-amber-200 group-hover:bg-amber-500 group-hover:text-white" },
            { step: 2, icon: PhoneCall, color: "bg-brand-primary/10 text-brand-primary border-brand-primary/20 group-hover:bg-brand-primary group-hover:text-white" },
            { step: 3, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600 border-emerald-200 group-hover:bg-emerald-500 group-hover:text-white" },
          ].map(({ step, icon: Icon, color }) => (
            <div
              key={step}
              className="card-surface p-6 text-center rounded-2xl border border-brand-border/80 shadow-sm relative group hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              <div className={`w-16 h-16 rounded-2xl ${color} border flex items-center justify-center mx-auto mb-5 transition-all duration-300`}>
                <Icon className="w-8 h-8" />
              </div>
              <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-brand-primary text-white font-bold text-sm flex items-center justify-center">
                {step}
              </div>
              <h3 className="font-display font-bold text-brand-navy text-lg mb-2">{t(`home.step${step}Title`)}</h3>
              <p className="text-sm text-brand-muted leading-relaxed">{t(`home.step${step}Desc`)}</p>
              {/* Tamil label */}
              <p className="font-tamil text-xs text-brand-primary/70 mt-2">
                {step === 1 && "பட்டாசு தேர்வு செய்யுங்கள்"}
                {step === 2 && "உங்கள் விவரம் கொடுங்கள்"}
                {step === 3 && "நாங்கள் அழைக்கிறோம்"}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link to="/products" className="btn-primary inline-flex items-center gap-2 !py-3.5 !px-8 text-base shadow-lg shadow-brand-orange/25 hover:scale-105 transition-all">
            <ShoppingBag className="w-5 h-5" />
            <span>Start Ordering Now / இப்போது ஆர்டர் செய்யுங்கள்</span>
          </Link>
        </div>
      </section>

      {/* ── WHATSAPP / CONTACT CTA STRIP ── */}
      <section className="bg-gradient-to-r from-[#25D366] via-[#20bd5a] to-[#128C7E] text-white py-10 px-4">
        <div className="container-page flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <h3 className="font-display text-xl sm:text-2xl font-extrabold mb-1">{t("home.whatsappCta")}</h3>
            <p className="font-tamil text-sm text-white/80">கேள்விகள் உள்ளதா? WhatsApp-இல் தொடர்பு கொள்ளுங்கள்!</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <a
              href={whatsappLink(whatsappNum, "Hi Sri RR Crackers! I want to enquire about crackers.")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-white text-[#128C7E] font-bold rounded-full px-6 py-3 shadow-lg hover:scale-105 transition-all text-sm sm:text-base"
            >
              <MessageCircle className="w-5 h-5" />
              <span>WhatsApp Us</span>
            </a>
            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex items-center justify-center gap-2 bg-white/20 border border-white/50 text-white font-bold rounded-full px-6 py-3 hover:bg-white/30 transition-all text-sm sm:text-base"
              >
                <PhoneCall className="w-5 h-5" />
                <span>Call Us</span>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ── BRAND STORY ── */}
      <BrandStory />

      {/* ── WHY CHOOSE US ── */}
      <WhyChooseUs />
    </div>
  );
}