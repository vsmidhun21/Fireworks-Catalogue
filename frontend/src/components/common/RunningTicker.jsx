import { useState } from "react";
import { Flame, FileDown } from "lucide-react";
import { downloadPriceListPDF } from "../../utils/pdfGenerator";

export default function RunningTicker() {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (e) => {
    e.preventDefault();
    setDownloading(true);
    try {
      await downloadPriceListPDF();
    } catch (err) {
      alert("Could not generate PDF right now. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const tickerItems = [
    {
      badge: "MEGA DIWALI SALE",
      badgeClass: "bg-amber-400 text-slate-950 font-extrabold",
      text: "Special Diwali Festive Discounts Live! Up to 90% Off Retail Prices!",
    },
    {
      badge: "SIVAKASI DIRECT",
      badgeClass: "bg-rose-500 text-white font-bold",
      text: "100% Genuine Certified Green Crackers Directly from Sivakasi Factory",
    },
    {
      badge: "PAN-INDIA DISPATCH",
      badgeClass: "bg-emerald-400 text-slate-950 font-bold",
      text: "Fast & Safe Transport Across India · Minimum Order ₹3,000",
    },
    {
      badge: "QUICK ESTIMATE",
      badgeClass: "bg-cyan-400 text-slate-950 font-bold",
      text: "Select Crackers & Get Instant Quotation in 1-Click with Zero Payment Advance!",
    },
    {
      badge: "CALL / WHATSAPP",
      badgeClass: "bg-brand-gold text-slate-950 font-bold",
      text: "Helpline: +91 87540 66248 | +91 88257 21391",
    },
  ];

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-brand-navy to-slate-950 text-white border-b border-amber-500/20 py-2 text-xs font-medium select-none">
      <div className="flex items-center w-full">
        {/* Left Fixed Pill on desktop */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-0.5 bg-amber-500 text-slate-950 font-black text-[11px] uppercase tracking-wider rounded-r-full shrink-0 z-10 shadow-md shadow-amber-500/20">
          <Flame className="w-3.5 h-3.5 fill-slate-950 animate-bounce" />
          <span>FESTIVAL OFFERS</span>
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
          title="Download 2025 Price List PDF"
        >
          <FileDown className="w-3 h-3" />
          <span>{downloading ? "Generating..." : "PDF Price List"}</span>
        </button>
      </div>
    </div>
  );
}
