import { Link } from "react-router-dom";
import { Gift, ArrowRight, Sparkles, Check } from "lucide-react";
import { GIFT_BOXES } from "../../data/giftBoxes";
import { formatCurrency } from "../../utils/format";
import SEO from "../../components/common/SEO";

export default function GiftBoxes() {
  return (
    <div>
      <SEO
        title="Gift Boxes — Curated Festive Collections"
        description="Explore Sri RR Crackers' curated Gift Box collections — ready-made bundles of fireworks and sparklers for every celebration."
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-navy via-slate-900 to-brand-primary-dark text-white py-16 sm:py-20">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1.5px, transparent 1.5px)", backgroundSize: "24px 24px" }}
        />
        <div className="absolute top-10 right-10 w-64 h-64 bg-brand-gold/15 rounded-full blur-3xl" />
        <div className="container-page relative z-10 text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 bg-brand-gold/20 border border-brand-gold/40 text-brand-gold text-xs font-extrabold uppercase tracking-wide px-4 py-1.5 rounded-full mb-5">
            <Gift className="w-3.5 h-3.5" />
            Curated Collections
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold leading-tight mb-4">
            Gift Boxes for Every Celebration
          </h1>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            Handpicked bundles that take the guesswork out of choosing — just pick a box that
            matches your celebration.
          </p>
        </div>
      </section>

      {/* Boxes grid */}
      <section className="container-page py-14 sm:py-16">
        <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
          {GIFT_BOXES.map((box) => (
            <Link
              key={box.id}
              to={`/gift-boxes/${box.slug}`}
              className="group relative rounded-3xl overflow-hidden border border-brand-border shadow-sm hover:shadow-2xl transition-all hover:-translate-y-1 flex flex-col"
            >
              <div className={`relative h-40 sm:h-48 bg-gradient-to-br ${box.accent} flex items-center justify-center overflow-hidden`}>
                <div
                  className="absolute inset-0 opacity-[0.12]"
                  style={{ backgroundImage: "radial-gradient(circle, #fff 1.5px, transparent 1.5px)", backgroundSize: "20px 20px" }}
                />
                <Gift className="w-20 h-20 text-white/90 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.2} />
                {box.featured && (
                  <span className="absolute top-4 right-4 inline-flex items-center gap-1 bg-white/95 text-brand-navy text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow">
                    <Sparkles className="w-3 h-3 text-brand-gold" />
                    Most Popular
                  </span>
                )}
              </div>

              <div className="p-6 flex flex-col flex-1 bg-white">
                <h2 className="font-display font-bold text-xl text-brand-navy mb-1.5 group-hover:text-brand-primary transition-colors">
                  {box.title}
                </h2>
                <p className="text-sm text-brand-muted mb-4">{box.tagline}</p>

                <ul className="space-y-1.5 mb-5">
                  {box.highlights.slice(0, 2).map((h) => (
                    <li key={h} className="flex items-start gap-2 text-sm text-brand-text/80">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto flex items-center justify-between pt-4 border-t border-brand-border">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-extrabold text-brand-primary-dark">{formatCurrency(box.price)}</span>
                    {box.price_original && (
                      <span className="text-sm text-brand-muted line-through">{formatCurrency(box.price_original)}</span>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary text-white text-xs font-bold px-4 py-2 group-hover:bg-brand-primary-dark transition-colors">
                    View Box
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
