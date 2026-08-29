import { useState } from "react";
import { Phone, MessageCircle, FileDown, Loader2 } from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
import { whatsappLink } from "../../utils/format";
import { downloadPriceListPDF } from "../../utils/pdfGenerator";

export default function FloatingActions() {
  const { settings } = useSettings();
  const [downloading, setDownloading] = useState(false);

  const phone = settings?.phone_primary || "8754066248";
  const whatsappNum = settings?.whatsapp_number || "918754066248";

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      await downloadPriceListPDF();
    } catch (e) {
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 pointer-events-auto">
      {/* Download Price List Floating Button */}
      <button
        onClick={handleDownloadPDF}
        disabled={downloading}
        className="group relative flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-brand-orange text-slate-950 font-bold px-4 py-2.5 shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105 transition-all text-xs sm:text-sm border border-amber-300"
        title="Download Sri RR Crackers Retail Price List 2025"
      >
        {downloading ? (
          <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
        ) : (
          <FileDown className="w-4 h-4 text-slate-950 group-hover:translate-y-0.5 transition-transform" />
        )}
        <span className="hidden sm:inline">
          {downloading ? "Generating PDF..." : "Download Price List"}
        </span>
        <span className="sm:hidden">
          {downloading ? "PDF..." : "Price List"}
        </span>
      </button>

      {/* Floating Call & WhatsApp Row */}
      <div className="flex items-center gap-3">
        {/* Direct Call Button */}
        <a
          href={`tel:${phone}`}
          className="relative flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/30 hover:scale-110 transition-all"
          aria-label="Call Sri RR Crackers"
          title={`Call ${phone}`}
        >
          <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-25" />
          <Phone className="w-5 h-5 fill-current" />
        </a>

        {/* WhatsApp Chat Button */}
        <a
          href={whatsappLink(whatsappNum, "Hi Sri RR Crackers, I want to enquire about cracker prices and estimates.")}
          target="_blank"
          rel="noopener noreferrer"
          className="relative flex items-center justify-center w-12 h-12 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-xl shadow-green-600/30 hover:scale-110 transition-all"
          aria-label="Chat on WhatsApp"
          title="Chat on WhatsApp"
        >
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full" />
          <MessageCircle className="w-6 h-6 fill-current" />
        </a>
      </div>
    </div>
  );
}
