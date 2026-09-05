import { useEffect } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2, MessageCircle, ShoppingBag, ClipboardCheck, PhoneCall, MessageSquare, Truck } from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
import { whatsappLink } from "../../utils/format";

export default function Confirmation() {
  const { estimateNumber } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { settings } = useSettings();

  useEffect(() => {
    if (!location.state?.fromOrderSubmission) {
      navigate("/products", { replace: true });
    }
  }, [location.state, navigate]);

  if (!location.state?.fromOrderSubmission) return null;

  return (
    <div className="container-page py-16 sm:py-24 max-w-xl mx-auto text-center">
      {/* Success icon */}
      <div className="w-24 h-24 rounded-full bg-emerald-50 text-emerald-600 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-6 shadow-sm">
        <CheckCircle2 className="w-12 h-12" />
      </div>

      <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-navy mb-3">{t("estimate.confirmTitle")}</h1>
      <p className="text-brand-muted mb-6 leading-relaxed">{t("estimate.confirmDesc")}</p>

      {/* Order number */}
      <div className="bg-gradient-to-br from-brand-primary/10 to-brand-orange/10 border border-brand-primary/20 inline-block px-8 py-5 mb-8 rounded-2xl shadow-sm">
        <p className="text-xs text-brand-muted uppercase tracking-wider font-semibold mb-1">{t("estimate.estimateNumber")}</p>
        <p className="font-display text-3xl font-extrabold text-brand-primary-dark">{estimateNumber}</p>
      </div>

      {/* What happens next */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 text-sm text-amber-900 text-left">
        <p className="font-bold mb-1">{t("confirmation.whatsNextTitle")}</p>
        <ul className="space-y-1 text-amber-800">
          <li className="flex items-start gap-2"><ClipboardCheck className="w-4 h-4 mt-0.5 shrink-0" /> <span>{t("confirmation.step1")}</span></li>
          <li className="flex items-start gap-2"><PhoneCall className="w-4 h-4 mt-0.5 shrink-0" /> <span>{t("confirmation.step2")}</span></li>
          <li className="flex items-start gap-2"><MessageSquare className="w-4 h-4 mt-0.5 shrink-0" /> <span>{t("confirmation.step3")}</span></li>
          <li className="flex items-start gap-2"><Truck className="w-4 h-4 mt-0.5 shrink-0" /> <span>{t("confirmation.step4")}</span></li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href={whatsappLink(settings.whatsapp_number, `Hi, I just placed order ${estimateNumber}. Please confirm.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary inline-flex items-center justify-center gap-2 !py-3.5"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{t("estimate.chatWhatsapp")}</span>
        </a>
        <Link
          to="/products"
          className="rounded-full border border-brand-primary text-brand-primary font-semibold px-7 py-3.5 hover:bg-brand-primary hover:text-white transition-colors inline-flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>{t("estimate.continueBrowsing")}</span>
        </Link>
      </div>
    </div>
  );
}