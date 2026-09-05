import { useState } from "react";
import { Link } from "react-router-dom";
import { Phone, MessageCircle, FileDown, Loader2, ShoppingCart } from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
import { useEstimate } from "../../context/EstimateContext";
import { whatsappLink } from "../../utils/format";
import { downloadPriceListPDF } from "../../utils/pdfGenerator";
import { useTranslation } from "react-i18next";

export default function FloatingActions() {
  const { settings } = useSettings();
  const { totals } = useEstimate();
  const { t } = useTranslation();
  const [downloading, setDownloading] = useState(false);

  const phone = settings?.phone_primary || "8754066248";
  const whatsappNum = settings?.whatsapp_number || "918754066248";

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      await downloadPriceListPDF();
    } catch (e) {
      alert(t("floatingActions.pdfError"));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      {/* LEFT SIDE — Download, Call, WhatsApp */}
      <div className="fixed bottom-5 left-3 sm:left-5 z-40 flex flex-col items-start gap-2.5 pointer-events-auto">
        {/* Download Price List */}
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="flex items-center gap-2 rounded-full bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold px-3.5 py-2.5 shadow-xl shadow-amber-400/25 hover:scale-105 transition-all text-xs sm:text-sm border border-amber-300 disabled:opacity-70"
          title={t("floatingActions.priceListTitle")}
        >
          {downloading ? (
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          ) : (
            <FileDown className="w-4 h-4 shrink-0" />
          )}
          <span className="hidden xs:inline">{downloading ? t("floatingActions.generating") : t("floatingActions.priceListFull")}</span>
          <span className="xs:hidden">{downloading ? t("floatingActions.generatingShort") : t("floatingActions.priceListShort")}</span>
        </button>

        {/* Call Us */}
        <a
          href={`tel:${phone}`}
          className="flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-2.5 shadow-xl shadow-blue-600/30 hover:scale-105 transition-all text-xs sm:text-sm"
          aria-label={t("aria.callUs")}
          title={t("floatingActions.callUsTitle", { phone })}
        >
          <span className="relative flex">
            <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-30" />
            <Phone className="w-4 h-4 shrink-0 fill-current" />
          </span>
          <span>{t("floatingActions.callUs")}</span>
        </a>

        {/* WhatsApp */}
        <a
          href={whatsappLink(whatsappNum, t("floatingActions.whatsappMessage"))}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold px-3.5 py-2.5 shadow-xl shadow-green-600/25 hover:scale-105 transition-all text-xs sm:text-sm"
          aria-label={t("aria.chatWhatsapp")}
          title={t("floatingActions.whatsappTitle")}
        >
          <MessageCircle className="w-4 h-4 fill-current shrink-0" />
          <span>{t("floatingActions.whatsapp")}</span>
        </a>
      </div>

      {/* RIGHT SIDE — Order Now */}
      <div className="fixed bottom-5 right-3 sm:right-5 z-40 pointer-events-auto">
        <Link
          to="/estimate"
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white font-bold px-4 sm:px-5 py-3 shadow-2xl shadow-brand-primary/40 hover:scale-105 hover:shadow-brand-primary/60 transition-all text-sm sm:text-base animate-pulse-glow"
        >
          <ShoppingCart className="w-5 h-5 shrink-0" />
          <span>{t("nav.orderNow")}</span>
          {totals.count > 0 && (
            <span className="bg-brand-orange text-white text-[11px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center">
              {totals.count}
            </span>
          )}
        </Link>
      </div>
    </>
  );
}
