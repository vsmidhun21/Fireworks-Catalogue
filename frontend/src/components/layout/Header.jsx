import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Logo from "../common/Logo";
import LanguageSwitcher from "../common/LanguageSwitcher";
import { useEstimate } from "../../context/EstimateContext";

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

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-brand-border">
      <div className="bg-brand-navy text-white text-xs sm:text-sm">
        <div className="container-page py-1.5 flex items-center justify-between">
          <span className="truncate">🎆 {t("home.heroSubtitle")}</span>
        </div>
      </div>

      <div className="container-page flex items-center justify-between py-3">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <Logo className="h-11 sm:h-14 w-auto" />
        </Link>

        <nav className="hidden md:flex items-center gap-7 font-medium">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `transition-colors hover:text-brand-orange ${isActive ? "text-brand-orange" : "text-brand-navy"}`
              }
            >
              {t(`nav.${item.key}`)}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          <Link
            to="/estimate"
            className="relative flex items-center gap-2 rounded-full border border-brand-primary text-brand-primary px-3 py-2 sm:px-4 font-semibold text-sm hover:bg-brand-primary hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="hidden sm:inline">{t("estimate.title")}</span>
            {totals.count > 0 && (
              <span className="absolute -top-2 -right-2 bg-brand-orange text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {totals.count}
              </span>
            )}
          </Link>

          <button
            className="md:hidden p-2 text-brand-navy"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-brand-border bg-white">
          <nav className="container-page py-3 flex flex-col gap-3 font-medium">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) => (isActive ? "text-brand-orange" : "text-brand-navy")}
              >
                {t(`nav.${item.key}`)}
              </NavLink>
            ))}
            <div className="pt-2">
              <LanguageSwitcher />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
