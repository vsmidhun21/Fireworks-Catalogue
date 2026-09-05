import { useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Gift, Check, Sparkles, MessageCircle, Plus, Minus, ArrowLeft, PackageCheck } from "lucide-react";
import { GIFT_BOXES, getGiftBoxBySlug } from "../../data/giftBoxes";
import { formatCurrency, whatsappLink } from "../../utils/format";
import { useSettings } from "../../context/SettingsContext";
import SEO from "../../components/common/SEO";

export default function GiftBoxDetail() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const { settings } = useSettings();
  const box = getGiftBoxBySlug(slug);
  const [qty, setQty] = useState(1);
  const [addedNote, setAddedNote] = useState(false);

  if (!box) return <Navigate to="/gift-boxes" replace />;

  const related = GIFT_BOXES.filter((g) => g.id !== box.id).slice(0, 3);
  const whatsappMsg = `Hi! I'm interested in the "${box.title}" Gift Box (Qty: ${qty}). Could you share more details?`;

  return (
    <div>
      <SEO title={box.title} description={box.description} />

      <div className="container-page pt-6">
        <Link to="/gift-boxes" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-muted hover:text-brand-primary transition-colors">
          <ArrowLeft className="w-4 h-4" />
          {t("giftBoxDetailPage.allGiftBoxes")}
        </Link>
      </div>

      <section className="container-page py-8 sm:py-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-14 items-start">
          {/* Visual */}
          <div className={`relative rounded-3xl overflow-hidden aspect-square bg-gradient-to-br ${box.accent} flex items-center justify-center shadow-xl`}>
            <div
              className="absolute inset-0 opacity-[0.1]"
              style={{ backgroundImage: "radial-gradient(circle, #fff 1.5px, transparent 1.5px)", backgroundSize: "24px 24px" }}
            />
            <Gift className="w-40 h-40 sm:w-56 sm:h-56 text-white/90" strokeWidth={1} />
            {box.featured && (
              <span className="absolute top-6 right-6 inline-flex items-center gap-1.5 bg-white/95 text-brand-navy text-xs font-extrabold px-3 py-1.5 rounded-full shadow">
                <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
                {t("giftBoxDetailPage.mostPopular")}
              </span>
            )}
          </div>

          {/* Details */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">{t("giftBoxDetailPage.curatedGiftBox")}</span>
            <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-brand-navy mt-1 mb-3 leading-tight">
              {box.title}
            </h1>
            <p className="text-brand-text/80 leading-relaxed mb-5">{box.description}</p>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-extrabold text-brand-primary-dark">{formatCurrency(box.price)}</span>
              {box.price_original && (
                <span className="text-lg text-brand-muted line-through">{formatCurrency(box.price_original)}</span>
              )}
              <span className="text-xs text-brand-muted">{t("giftBoxDetailPage.estimateNote")}</span>
            </div>

            {/* Highlights */}
            <div className="grid sm:grid-cols-1 gap-2 mb-6">
              {box.highlights.map((h) => (
                <div key={h} className="flex items-start gap-2.5 text-sm text-brand-text/85">
                  <Check className="w-4.5 h-4.5 text-emerald-500 mt-0.5 shrink-0" />
                  <span>{h}</span>
                </div>
              ))}
            </div>

            <div className="card-surface rounded-2xl border border-brand-border p-5 mb-6">
              <h3 className="font-display font-bold text-brand-navy mb-1.5 flex items-center gap-2">
                <PackageCheck className="w-4.5 h-4.5 text-brand-primary" />
                {t("giftBoxDetailPage.suitableFor")}
              </h3>
              <p className="text-sm text-brand-muted">{box.suitableFor}</p>
            </div>

            {/* Quantity + CTA */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="flex items-center border-2 border-brand-primary rounded-full bg-white overflow-hidden">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center text-brand-primary hover:bg-brand-primary hover:text-white transition-colors"
                  aria-label={t("aria.decrease")}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-bold text-brand-primary">{qty}</span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="w-10 h-10 flex items-center justify-center text-brand-primary hover:bg-brand-primary hover:text-white transition-colors"
                  aria-label={t("aria.increase")}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => setAddedNote(true)}
                className="flex-1 min-w-[180px] rounded-full bg-brand-primary text-white font-bold px-6 py-3 hover:bg-brand-primary-dark transition-all shadow-sm hover:scale-[1.02]"
              >
                {t("giftBoxDetailPage.enquireButton")}
              </button>
            </div>

            {addedNote && (
              <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 mb-4">
                {t("giftBoxDetailPage.addedNote")}{" "}
                <Link to="/estimate" className="underline font-semibold">{t("giftBoxDetailPage.orderListLink")}</Link> {t("giftBoxDetailPage.toAddOthers")}
              </p>
            )}

            <a
              href={whatsappLink(settings?.whatsapp_number, whatsappMsg)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold px-6 py-3 transition-all shadow-sm"
            >
              <MessageCircle className="w-4.5 h-4.5" />
              <span>{t("giftBoxDetailPage.askWhatsapp")}</span>
            </a>
          </div>
        </div>

        {/* Contents */}
        <div className="mt-14 grid lg:grid-cols-2 gap-8">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-brand-navy mb-4">{t("giftBoxDetailPage.whatsIncluded")}</h2>
            <ul className="space-y-2.5">
              {box.contents.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-brand-text/85 card-surface rounded-xl border border-brand-border px-4 py-3">
                  <Gift className="w-4 h-4 text-brand-primary shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-brand-muted mt-3">
              {t("giftBoxDetailPage.contentsNote")}
            </p>
          </div>

          <div className="rounded-2xl bg-brand-cream border border-brand-border p-6">
            <h3 className="font-display font-bold text-brand-navy mb-2">{t("giftBoxDetailPage.howItWorksTitle")}</h3>
            <ol className="space-y-2 text-sm text-brand-text/80 list-decimal list-inside">
              <li>{t("giftBoxDetailPage.howStep1")}</li>
              <li>{t("giftBoxDetailPage.howStep2")}</li>
              <li>{t("giftBoxDetailPage.howStep3")}</li>
              <li>{t("giftBoxDetailPage.howStep4")}</li>
            </ol>
          </div>
        </div>

        {/* Related boxes */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-brand-navy mb-6">{t("giftBoxDetailPage.otherGiftBoxes")}</h2>
            <div className="grid sm:grid-cols-3 gap-5">
              {related.map((r) => (
                <Link
                  key={r.id}
                  to={`/gift-boxes/${r.slug}`}
                  className={`group rounded-2xl overflow-hidden border border-brand-border shadow-sm hover:shadow-lg transition-all hover:-translate-y-1`}
                >
                  <div className={`h-28 bg-gradient-to-br ${r.accent} flex items-center justify-center`}>
                    <Gift className="w-12 h-12 text-white/90 group-hover:scale-110 transition-transform" strokeWidth={1.2} />
                  </div>
                  <div className="p-4 bg-white">
                    <h3 className="font-display font-bold text-brand-navy text-sm mb-1 group-hover:text-brand-primary">{r.title}</h3>
                    <span className="text-brand-primary-dark font-bold text-sm">{formatCurrency(r.price)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
