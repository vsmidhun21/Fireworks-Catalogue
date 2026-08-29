import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ShoppingCart, Menu, X, FileDown, Loader2 } from "lucide-react";
import Logo from "../common/Logo";
import LanguageSwitcher from "../common/LanguageSwitcher";
import RunningTicker from "../common/RunningTicker";
import { useEstimate } from "../../context/EstimateContext";
import { downloadPriceListPDF } from "../../utils/pdfGenerator";

const navItems = [
  { to: "/", key: "home" },
  { to: "/products", key: "products" },
  { to: "/about", key: "about" },
  { to: "/contact", key: "contact" },
];

export default function Header() {
  const { t } = useTranslation();
  const { totals } = useEstimate();
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      await downloadPriceListPDF();
    } catch (e) {
      alert("Failed to generate Price List PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-brand-border shadow-sm">
      {/* Dynamic Running Announcement Ticker */}
      <RunningTicker />

      {/* Main Header Bar */}
      <div className="container-page flex items-center justify-between py-3">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <Logo className="h-11 sm:h-14 w-auto" />
        </Link>

        <nav className="hidden lg:flex items-center gap-7 font-medium">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `transition-colors hover:text-brand-orange text-sm font-semibold ${isActive ? "text-brand-orange" : "text-brand-navy"
                }`
              }
            >
              {t(`nav.${item.key}`)}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Download Price List Button */}
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="hidden sm:flex items-center gap-1.5 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 px-3.5 py-2 font-bold text-xs transition-colors shadow-sm cursor-pointer"
            title="Download Official 2025 Price List PDF"
          >
            {downloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
            ) : (
              <FileDown className="w-3.5 h-3.5 text-amber-700" />
            )}
            <span>{downloading ? "Generating..." : "Price List PDF"}</span>
          </button>

          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

          <Link
            to="/estimate"
            className="relative flex items-center gap-2 rounded-full bg-brand-primary text-white px-3.5 py-2 sm:px-4 font-semibold text-xs sm:text-sm hover:bg-brand-primary-dark transition-all shadow-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">{t("estimate.title")}</span>
            {totals.count > 0 && (
              <span className="bg-brand-orange text-white text-[11px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center -ml-1">
                {totals.count}
              </span>
            )}
          </Link>

          <button
            className="lg:hidden p-2 text-brand-navy rounded-lg hover:bg-slate-100"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-brand-border bg-white shadow-xl">
          <nav className="container-page py-4 flex flex-col gap-3 font-medium">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `py-1.5 text-base font-semibold ${isActive ? "text-brand-orange" : "text-brand-navy"}`
                }
              >
                {t(`nav.${item.key}`)}
              </NavLink>
            ))}

            <button
              onClick={() => {
                setOpen(false);
                handleDownloadPDF();
              }}
              disabled={downloading}
              className="flex items-center justify-center gap-2 w-full py-2.5 mt-2 rounded-xl bg-amber-100 text-amber-950 font-bold text-sm border border-amber-300"
            >
              <FileDown className="w-4 h-4 text-amber-700" />
              <span>{downloading ? "Generating Price List..." : "Download Price List (PDF)"}</span>
            </button>

            <div className="pt-2 border-t border-brand-border flex items-center justify-between">
              <span className="text-xs text-brand-muted">Language:</span>
              <LanguageSwitcher />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
