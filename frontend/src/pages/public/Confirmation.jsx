import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../context/SettingsContext";
import { whatsappLink } from "../../utils/format";

export default function Confirmation() {
  const { estimateNumber } = useParams();
  const { t } = useTranslation();
  const { settings } = useSettings();

  return (
    <div className="container-page py-16 sm:py-24 max-w-xl mx-auto text-center">
      <div className="text-7xl mb-6">🎉</div>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-navy mb-3">{t("estimate.confirmTitle")}</h1>
      <p className="text-brand-muted mb-6">{t("estimate.confirmDesc")}</p>

      <div className="card-surface inline-block px-8 py-4 mb-8">
        <p className="text-xs text-brand-muted uppercase tracking-wide">{t("estimate.estimateNumber")}</p>
        <p className="font-display text-2xl font-bold text-brand-primary-dark">{estimateNumber}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href={whatsappLink(settings.whatsapp_number, `Hi, I just submitted estimate ${estimateNumber}.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
        >
          {t("estimate.chatWhatsapp")}
        </a>
        <Link to="/products" className="rounded-full border border-brand-primary text-brand-primary font-semibold px-7 py-3 hover:bg-brand-primary hover:text-white transition-colors">
          {t("estimate.continueBrowsing")}
        </Link>
      </div>
    </div>
  );
}
