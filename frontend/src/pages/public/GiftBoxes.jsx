import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Gift, MessageCircle } from "lucide-react";
import { GiftBoxService } from "../../services/api";
import { getProductImageUrl, onImageError } from "../../utils/image";
import { whatsappLink } from "../../utils/format";
import { useSettings } from "../../context/SettingsContext";
import { LoadingGrid, EmptyState, ErrorState } from "../../components/common/States";
import SEO from "../../components/common/SEO";

export default function GiftBoxes() {
  const { t, i18n } = useTranslation();
  const { settings } = useSettings();
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    GiftBoxService.list()
      .then((res) => {
        if (active) setBoxes(res.data || []);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const isTamil = i18n.language === "ta";

  return (
    <div>
      <SEO title={t("giftBoxPage.title")} description={t("giftBoxPage.subtitle")} />

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
            {t("giftBoxPage.badge")}
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold leading-tight mb-4">
            {t("giftBoxPage.title")}
          </h1>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            {t("giftBoxPage.subtitle")}
          </p>
        </div>
      </section>

      {/* Boxes grid */}
      <section className="container-page py-14 sm:py-16">
        {loading && <LoadingGrid count={6} />}

        {!loading && error && <ErrorState message={t("common.error")} />}

        {!loading && !error && boxes.length === 0 && (
          <EmptyState
            icon={Gift}
            title={t("giftBoxPage.emptyTitle")}
            description={t("giftBoxPage.emptyDescription")}
          />
        )}

        {!loading && !error && boxes.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {boxes.map((box) => {
              const name = (isTamil && box.nameTa) || box.nameEn;
              const description = (isTamil && box.descriptionTa) || box.descriptionEn;
              const message = t("giftBoxPage.whatsappMessage", { name });

              return (
                <div
                  key={box.id}
                  className="group relative rounded-3xl overflow-hidden border border-brand-border shadow-sm hover:shadow-2xl transition-all hover:-translate-y-1 flex flex-col bg-white"
                >
                  <div className="relative h-48 sm:h-56 bg-slate-100 overflow-hidden">
                    <img
                      src={getProductImageUrl(box.imageUrl)}
                      alt={name}
                      onError={onImageError}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <h2 className="font-display font-bold text-xl text-brand-navy mb-2 group-hover:text-brand-primary transition-colors">
                      {name}
                    </h2>
                    {description && (
                      <p className="text-sm text-brand-text/80 leading-relaxed mb-5 flex-1">{description}</p>
                    )}

                    <a
                      href={whatsappLink(settings?.whatsapp_number, message)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm font-bold px-5 py-2.5 transition-colors shadow-sm"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{t("giftBoxPage.enquireWhatsApp")}</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
