import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2, MessageCircle, ShoppingBag } from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
import { whatsappLink } from "../../utils/format";

export default function Confirmation() {
  const { estimateNumber } = useParams();
  const { t } = useTranslation();
  const { settings } = useSettings();

  return (
    <div className="container-page py-16 sm:py-24 max-w-xl mx-auto text-center">
      <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-6 shadow-sm">
        <CheckCircle2 className="w-10 h-10" />
      </div>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-navy mb-3">{t("estimate.confirmTitle")}</h1>
      <p className="text-brand-muted mb-6">{t("estimate.confirmDesc")}</p>

      <div className="card-surface inline-block px-8 py-4 mb-8 rounded-2xl border border-brand-border shadow-sm">
        <p className="text-xs text-brand-muted uppercase tracking-wider font-semibold">{t("estimate.estimateNumber")}</p>
        <p className="font-display text-2xl font-extrabold text-brand-primary-dark mt-0.5">{estimateNumber}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href={whatsappLink(settings.whatsapp_number, `Hi, I just submitted estimate ${estimateNumber}.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary inline-flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{t("estimate.chatWhatsapp")}</span>
        </a>
        <Link
          to="/products"
          className="rounded-full border border-brand-primary text-brand-primary font-semibold px-7 py-3 hover:bg-brand-primary hover:text-white transition-colors inline-flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>{t("estimate.continueBrowsing")}</span>
        </Link>
      </div>
    </div>
  );
}
