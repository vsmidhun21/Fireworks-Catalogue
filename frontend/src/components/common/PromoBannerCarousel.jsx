import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from "lucide-react";
import { getProductImageUrl, onImageError } from "../../utils/image";

const AUTOPLAY_DELAY = 5000;

/**
 * Full-width horizontal slideshow for admin-managed promotional banners.
 * One slide fills the viewport at a time, auto-advancing every 5s, with
 * arrow controls, swipe support, and dot navigation — replacing the old
 * static grid layout with the kind of hero banner slider seen on
 * reference fireworks storefronts.
 */
export default function PromoBannerCarousel({ items = [] }) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(null);
  const trackRef = useRef(null);

  const count = items.length;

  const goTo = useCallback(
    (next) => {
      if (!count) return;
      setIndex(((next % count) + count) % count);
    },
    [count]
  );

  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);
  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    if (count <= 1 || isPaused) return undefined;
    const timer = setInterval(goNext, AUTOPLAY_DELAY);
    return () => clearInterval(timer);
  }, [count, isPaused, goNext]);

  if (!count) return null;

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e) {
    if (touchStartX.current == null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) {
      if (delta > 0) {
        goPrev();
      } else {
        goNext();
      }
    }
    touchStartX.current = null;
  }

  return (
    <section
      className="relative w-full overflow-hidden bg-brand-navy"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        ref={trackRef}
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {items.map((item) => (
          <Link
            key={item.id}
            to={item.ctaUrl || "/products"}
            className="relative w-full shrink-0 aspect-[16/7] sm:aspect-[21/8] lg:aspect-[3/1] block group"
          >
            <img
              src={getProductImageUrl(item.imageUrl)}
              alt={item.title}
              onError={onImageError}
              className="absolute inset-0 h-full w-full object-cover"
              loading={index === 0 ? "eager" : "lazy"}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/40 to-transparent" />

            <div className="relative z-10 h-full flex flex-col justify-center gap-2.5 px-6 sm:px-12 lg:px-16 max-w-xl">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-gold/90 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-slate-950">
                <Sparkles className="h-3.5 w-3.5" />
                {t("promoBanner.specialOffer")}
              </span>
              <h3 className="font-display text-xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight drop-shadow-lg">
                {item.title}
              </h3>
              {item.subtitle && (
                <p className="text-sm sm:text-base text-slate-200 max-w-md leading-relaxed hidden sm:block">
                  {item.subtitle}
                </p>
              )}
              {item.ctaLabel && (
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-brand-navy mt-1.5 shadow-lg group-hover:bg-brand-gold group-hover:text-slate-950 transition-colors">
                  <span>{item.ctaLabel}</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            onClick={goPrev}
            aria-label={t("aria.previousBanner")}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur border border-white/20 text-white flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goNext}
            aria-label={t("aria.nextBanner")}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur border border-white/20 text-white flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {items.map((item, i) => (
              <button
                key={item.id}
                onClick={() => goTo(i)}
                aria-label={t("aria.goToBanner", { number: i + 1 })}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-brand-gold" : "w-1.5 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
