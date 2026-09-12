import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Flame, FileDown } from "lucide-react";
import { downloadPriceListPDF } from "../../utils/pdfGenerator";
import { useSettings } from "../../context/SettingsContext";

export default function RunningTicker() {
  const { t } = useTranslation();
  const { settings } = useSettings();
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

  const defaultItems = [
    {
      badge: t("ticker.item1Badge"),
      badgeStyle: { backgroundColor: "#fbbf24", color: "#020617" },
      text: t("ticker.item1Text"),
    },
    {
      badge: t("ticker.item2Badge"),
      badgeStyle: { backgroundColor: "#f43f5e", color: "#ffffff" },
      text: t("ticker.item2Text"),
    },
    {
      badge: t("ticker.item3Badge"),
      badgeStyle: { backgroundColor: "#34d399", color: "#020617" },
      text: t("ticker.item3Text"),
    },
    {
      badge: t("ticker.item4Badge"),
      badgeStyle: { backgroundColor: "#22d3ee", color: "#020617" },
      text: t("ticker.item4Text"),
    },
    {
      badge: t("ticker.item5Badge"),
      badgeStyle: { backgroundColor: "#f59e0b", color: "#020617" },
      text: t("ticker.item5Text"),
    },
  ];

  let rawConfigItems = settings?.header_ticker_items;
  if (typeof rawConfigItems === "string") {
    try {
      rawConfigItems = JSON.parse(rawConfigItems);
    } catch {
      rawConfigItems = null;
    }
  }

  const activeConfigItems = Array.isArray(rawConfigItems)
    ? rawConfigItems.filter((i) => i && i.is_active !== false && (i.highlight_text || i.message_text))
    : [];

  const configuredItems = activeConfigItems.map((i) => ({
    badge: i.highlight_text || "",
    badgeStyle: {
      backgroundColor: i.highlight_color || "#fbbf24",
      color: i.highlight_text_color || "#020617",
    },
    text: i.message_text || "",
  }));

  const items = configuredItems.length > 0 ? configuredItems : defaultItems;

  // Duplicate items enough times to ensure a continuous, seamless marquee loop across all screen widths
  let marqueeItems = [...items, ...items];
  while (marqueeItems.length < 10) {
    marqueeItems = [...marqueeItems, ...items];
  }


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
            {marqueeItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 shrink-0">
                <span
                  className="px-2 py-0.5 rounded text-[10px] tracking-wide uppercase shadow-sm font-extrabold"
                  style={item.badgeStyle}
                >
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
