import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Flame, FileDown } from "lucide-react";
import { downloadPriceListPDF } from "../../utils/pdfGenerator";

export default function RunningTicker() {
  const { t } = useTranslation();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (e) => {
    e.preventDefault();
    setDownloading(true);
    try {
      await downloadPriceListPDF();
    } catch (err) {
      alert(t("ticker.pdfError"));
    } finally {
      setDownloading(false);
    }
  };

  const tickerItems = [
    {
      badge: t("ticker.item1Badge"),
      badgeClass: "bg-amber-400 text-slate-950 font-extrabold",
      text: t("ticker.item1Text"),
    },
    {
      badge: t("ticker.item2Badge"),
      badgeClass: "bg-rose-500 text-white font-bold",
      text: t("ticker.item2Text"),
    },
    {
      badge: t("ticker.item3Badge"),
      badgeClass: "bg-emerald-400 text-slate-950 font-bold",
      text: t("ticker.item3Text"),
    },
    {
      badge: t("ticker.item4Badge"),
      badgeClass: "bg-cyan-400 text-slate-950 font-bold",
      text: t("ticker.item4Text"),
    },
    {
      badge: t("ticker.item5Badge"),
      badgeClass: "bg-brand-gold text-slate-950 font-bold",
      text: t("ticker.item5Text"),
    },
  ];

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-brand-navy to-slate-950 text-white border-b border-amber-500/20 py-2 text-xs font-medium select-none">
      <div className="flex items-center w-full">
        {/* Left Fixed Pill on desktop */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-0.5 bg-amber-500 text-slate-950 font-black text-[11px] uppercase tracking-wider rounded-r-full shrink-0 z-10 shadow-md shadow-amber-500/20">
          <Flame className="w-3.5 h-3.5 fill-slate-950 animate-bounce" />
          <span>{t("ticker.festivalOffers")}</span>
        </div>

        {/* Continuous Marquee Track */}
        <div className="overflow-hidden relative w-full flex">
          <div className="animate-marquee flex items-center gap-10">
            {/* Duplicated twice for infinite seamless loop */}
            {[...tickerItems, ...tickerItems].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 shrink-0">
                <span className={`px-2 py-0.5 rounded text-[10px] tracking-wide uppercase shadow-sm ${item.badgeClass}`}>
                  {item.badge}
                </span>
                <span className="text-slate-200 hover:text-brand-gold transition-colors font-medium">
                  {item.text}
                </span>
                <span className="text-amber-400/40">✦</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Fixed Fast Download Trigger */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="hidden sm:flex items-center gap-1.5 px-3 py-0.5 bg-white/10 hover:bg-amber-500 hover:text-slate-950 border border-amber-400/30 text-amber-300 rounded-l-full text-[11px] font-bold shrink-0 z-10 transition-all cursor-pointer"
          title={t("ticker.downloadTitle")}
        >
          <FileDown className="w-3 h-3" />
          <span>{downloading ? t("header.generating") : t("ticker.downloadCta")}</span>
        </button>
      </div>
    </div>
  );
}
