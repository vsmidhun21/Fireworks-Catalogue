import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, Flame } from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
import Logo from "./Logo";

/**
 * Dedicated "brand story" section — distinct from a plain About text
 * block. Uses a decorative gradient panel (in place of a real brand
 * photograph, which will be supplied by the client later) paired with
 * short, confident copy and a CTA into the full About page.
 */
export default function BrandStory() {
  const { settings } = useSettings();
  const businessName = settings.business_name || "Sri RR Crackers";

  return (
    <section className="container-page py-14 sm:py-20">
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-14 items-center">
        {/* Visual panel */}
        <div className="relative rounded-3xl overflow-hidden aspect-[4/3] bg-gradient-to-br from-brand-navy via-slate-900 to-brand-primary-dark shadow-xl order-2 lg:order-1">
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{ backgroundImage: "radial-gradient(circle, #fff 1.5px, transparent 1.5px)", backgroundSize: "24px 24px" }}
          />
          <div className="absolute -top-10 -left-10 w-56 h-56 bg-brand-gold/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-brand-primary/30 rounded-full blur-3xl" />
          <Flame className="absolute w-48 h-48 text-white/5 -bottom-8 -right-8" strokeWidth={1} />

          <div className="relative z-10 h-full flex flex-col items-center justify-center gap-5 p-8 text-center">
            <div className="bg-white/95 rounded-2xl p-4 shadow-2xl">
              <Logo className="h-14 w-auto" />
            </div>
            <span className="inline-flex items-center gap-1.5 text-brand-gold text-xs font-extrabold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              Since day one, made for celebration
            </span>
          </div>
        </div>

        {/* Copy */}
        <div className="order-1 lg:order-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">Our Brand</span>
          <h2 className="font-display text-2xl sm:text-4xl font-bold text-brand-navy mt-1 mb-5 leading-tight">
            The {businessName} Story
          </h2>
          <p className="text-brand-text/80 leading-relaxed mb-4">
            {businessName} brings together a carefully selected range of fireworks, sparklers and
            gift boxes sourced from Sivakasi — India's home of fireworks craftsmanship. Every
            product on our shelves is chosen with one goal: helping families celebrate safely,
            joyfully and without compromise.
          </p>
          <p className="text-brand-text/70 leading-relaxed mb-8">
            We believe a great celebration starts with trust — clear pricing, genuine products,
            and a team that's easy to reach whenever you need us.
          </p>
          <Link
            to="/about"
            className="inline-flex items-center gap-2 rounded-full bg-brand-navy text-white font-bold px-6 py-3.5 hover:bg-slate-800 transition-all hover:scale-105 shadow-lg"
          >
            <span>Read Our Story</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
