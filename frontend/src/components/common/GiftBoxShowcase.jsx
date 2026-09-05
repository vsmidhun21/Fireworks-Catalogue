import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Gift, ArrowRight, Sparkles } from "lucide-react";
import { GIFT_BOXES } from "../../data/giftBoxes";
import { formatCurrency } from "../../utils/format";

/**
 * A dedicated, high-priority promotional section for Gift Boxes — treated
 * as a curated collection rather than plain product cards. Links out to
 * the standalone /gift-boxes experience rather than a normal product page.
 */
export default function GiftBoxShowcase() {
  const { t } = useTranslation();
  const boxes = GIFT_BOXES.slice(0, 3);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-gold via-amber-500 to-orange-600 py-14 sm:py-20">
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, #101828 1.5px, transparent 1.5px)", backgroundSize: "22px 22px" }}
      />
      <div className="container-page relative z-10">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div className="max-w-lg">
            <span className="inline-flex items-center gap-1.5 bg-white/25 backdrop-blur text-white text-xs font-extrabold uppercase tracking-wide px-3.5 py-1.5 rounded-full mb-3">
              <Gift className="w-3.5 h-3.5" />
              {t("giftBoxShowcase.badge")}
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-white leading-tight">
              {t("giftBoxShowcase.title")}
            </h2>
            <p className="text-white/90 mt-2 text-sm sm:text-base max-w-md">
              {t("giftBoxShowcase.subtitle")}
            </p>
          </div>
          <Link
            to="/gift-boxes"
            className="inline-flex items-center gap-2 rounded-full bg-brand-navy text-white font-bold px-6 py-3 hover:bg-slate-900 transition-all hover:scale-105 shadow-lg shrink-0"
          >
            <span>{t("giftBoxShowcase.exploreCta")}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-3 gap-5 sm:gap-6">
          {boxes.map((box) => (
            <Link
              key={box.id}
              to={`/gift-boxes/${box.slug}`}
              className="group relative rounded-3xl overflow-hidden bg-white/10 backdrop-blur border border-white/25 hover:bg-white/20 transition-all hover:-translate-y-1 shadow-lg p-6 flex flex-col"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${box.accent} flex items-center justify-center mb-5 shadow-md group-hover:scale-110 transition-transform`}>
                <Gift className="w-7 h-7 text-white" />
              </div>
              {box.featured && (
                <span className="absolute top-5 right-5 inline-flex items-center gap-1 bg-brand-navy text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full">
                  <Sparkles className="w-3 h-3 text-brand-gold" />
                  {t("giftBoxShowcase.mostPopular")}
                </span>
              )}
              <h3 className="font-display font-bold text-white text-lg mb-1.5">{box.title}</h3>
              <p className="text-white/80 text-sm leading-relaxed flex-1">{box.tagline}</p>
              <div className="mt-5 flex items-center justify-between">
                <span className="text-white font-extrabold text-lg">{formatCurrency(box.price)}</span>
                <span className="inline-flex items-center gap-1 text-white text-xs font-bold uppercase">
                  {t("giftBoxShowcase.viewBox")}
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
