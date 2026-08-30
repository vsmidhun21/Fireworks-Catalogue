import { Link } from "react-router-dom";
import {
  Sparkles, Flame, Rocket, Gift, Zap, Disc3, PartyPopper, Layers,
  ArrowUpRight, Star,
} from "lucide-react";

// Distinct visual treatment per category — gradient + accent + a short,
// non-repetitive blurb — so cards feel visually different from one another
// instead of the same icon in different colours.
const CATEGORY_CONFIG = {
  "single-sound-crackers": {
    icon: Zap,
    gradient: "from-amber-500 via-orange-500 to-amber-700",
    blurb: "Classic bursts to open every celebration.",
  },
  "ground-chakkars": {
    icon: Disc3,
    gradient: "from-brand-primary via-purple-600 to-brand-primary-dark",
    blurb: "Spinning colour and light for the ground.",
  },
  "flower-pots": {
    icon: Sparkles,
    gradient: "from-emerald-500 via-teal-500 to-emerald-700",
    blurb: "Fountains of colour that bloom skyward.",
  },
  "rockets": {
    icon: Rocket,
    gradient: "from-rose-500 via-red-500 to-rose-700",
    blurb: "Whistle, soar and burst high above.",
  },
  "sparklers": {
    icon: Flame,
    gradient: "from-amber-400 via-yellow-500 to-amber-600",
    blurb: "Handheld sparkle for every age.",
  },
  "childrens-special": {
    icon: PartyPopper,
    gradient: "from-pink-500 via-fuchsia-500 to-pink-700",
    blurb: "Safe, playful fun made for kids.",
  },
  "repeating-shots": {
    icon: Layers,
    gradient: "from-cyan-500 via-sky-500 to-cyan-700",
    blurb: "Multi-shot displays, one after another.",
  },
  "gift-box": {
    icon: Gift,
    gradient: "from-brand-gold via-amber-500 to-orange-600",
    blurb: "Curated collections, ready to gift.",
  },
  "wala-garlands": {
    icon: Flame,
    gradient: "from-red-500 via-rose-600 to-red-700",
    blurb: "Continuous strings of festive sound.",
  },
  "bomb": {
    icon: Zap,
    gradient: "from-indigo-500 via-violet-600 to-indigo-700",
    blurb: "Bold, powerful festival statements.",
  },
  "combo-pack": {
    icon: Gift,
    gradient: "from-yellow-500 via-amber-500 to-yellow-700",
    blurb: "Handpicked value bundles.",
  },
};

const FALLBACK = {
  icon: Sparkles,
  gradient: "from-brand-primary via-purple-600 to-brand-navy",
  blurb: "Explore this festive collection.",
};

/**
 * Premium, image-led category showcase. Deliberately NOT a repeated
 * icon grid — each card gets its own gradient identity, a large icon
 * used as a decorative watermark, and a short description, arranged in
 * an asymmetric layout (first card wider) with horizontal scroll on
 * mobile. Backed by the same dynamic category API data as before.
 */
export default function CategoryShowcase({ categories = [] }) {
  const shown = categories.slice(0, 7);

  return (
    <div
      className="flex gap-4 sm:gap-5 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 snap-x snap-mandatory sm:snap-none"
    >
      {shown.map((c, idx) => {
        const cfg = CATEGORY_CONFIG[c.slug] || FALLBACK;
        const Icon = cfg.icon;
        const isHero = idx === 0;

        return (
          <Link
            key={c.id}
            to={`/categories/${c.slug}`}
            className={`group relative shrink-0 snap-start w-[68vw] xs:w-[55vw] sm:w-auto rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 ${
              isHero ? "sm:col-span-2 sm:row-span-2 aspect-[4/5] sm:aspect-auto sm:h-full min-h-[280px] sm:min-h-[340px]" : "aspect-[4/5] sm:min-h-[160px]"
            }`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${cfg.gradient}`} />

            {/* Decorative dot texture */}
            <div
              className="absolute inset-0 opacity-[0.12] pointer-events-none"
              style={{ backgroundImage: "radial-gradient(circle, #fff 1.5px, transparent 1.5px)", backgroundSize: "20px 20px" }}
            />

            {/* Oversized watermark icon */}
            <Icon
              className={`absolute text-white/15 group-hover:text-white/25 group-hover:scale-110 transition-all duration-500 ${
                isHero ? "w-40 h-40 -bottom-6 -right-6" : "w-24 h-24 -bottom-4 -right-4"
              }`}
              strokeWidth={1.2}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />

            <div className={`relative z-10 h-full flex flex-col justify-end p-4 sm:p-5 ${isHero ? "sm:p-7" : ""}`}>
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center mb-3 ${isHero ? "sm:w-12 sm:h-12" : ""}`}>
                <Icon className={`text-white ${isHero ? "w-5 h-5 sm:w-6 sm:h-6" : "w-4.5 h-4.5"}`} />
              </div>
              <h3 className={`font-display font-bold text-white leading-snug ${isHero ? "text-xl sm:text-2xl" : "text-base sm:text-lg"}`}>
                {c.nameEn}
              </h3>
              {c.nameTa && (
                <span className="font-tamil text-xs text-white/70 mt-0.5">{c.nameTa}</span>
              )}
              <p className={`text-white/80 mt-1.5 leading-snug ${isHero ? "text-sm block" : "text-xs hidden sm:block"}`}>
                {cfg.blurb}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-white text-xs font-bold uppercase tracking-wide">
                Explore
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </span>
            </div>

            {c.isFeatured && (
              <span className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 bg-white/95 text-brand-navy text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow">
                <Star className="w-3 h-3 fill-brand-gold text-brand-gold" />
                Popular
              </span>
            )}
          </Link>
        );
      })}

      {/* View All card */}
      {categories.length > 0 && (
        <Link
          to="/products"
          className="group relative shrink-0 snap-start w-[68vw] xs:w-[55vw] sm:w-auto rounded-3xl overflow-hidden border-2 border-dashed border-brand-primary/30 bg-brand-primary/5 hover:bg-brand-primary/10 transition-colors flex flex-col items-center justify-center text-center p-6 aspect-[4/5] sm:min-h-[160px] sm:aspect-auto"
        >
          <div className="w-11 h-11 rounded-full bg-brand-primary text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-brand-navy text-sm sm:text-base">View All Categories</span>
          <span className="text-xs text-brand-muted mt-1">Browse the full catalogue</span>
        </Link>
      )}
    </div>
  );
}
