import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Logo from "../common/Logo";
import { useSettings } from "../../context/SettingsContext";
import { whatsappLink } from "../../utils/format";

function SocialIcon({ type, className }) {
  if (type === "facebook") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
        <path d="M13.5 21v-8h2.75l.5-3h-3.25V8.05c0-.87.29-1.55 1.6-1.55h1.8V3.82c-.31-.04-1.37-.14-2.6-.14-2.57 0-4.3 1.57-4.3 4.45V10H7.25v3H10v8h3.5Z" />
      </svg>
    );
  }

  if (type === "instagram") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4.25" />
        <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M20.4 7.2a2.8 2.8 0 0 0-1.97-1.98C16.7 4.75 12 4.75 12 4.75s-4.7 0-6.43.47A2.8 2.8 0 0 0 3.6 7.2C3.13 8.94 3.13 12 3.13 12s0 3.06.47 4.8a2.8 2.8 0 0 0 1.97 1.98c1.73.47 6.43.47 6.43.47s4.7 0 6.43-.47a2.8 2.8 0 0 0 1.97-1.98c.47-1.74.47-4.8.47-4.8s0-3.06-.47-4.8ZM10.25 15.25v-6.5L15.88 12l-5.63 3.25Z" />
    </svg>
  );
}

const socialLinks = [
  { key: "facebook_url", label: "Facebook", type: "facebook" },
  { key: "instagram_url", label: "Instagram", type: "instagram" },
  { key: "youtube_url", label: "YouTube", type: "youtube" },
];

export default function Footer() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand-navy text-white/90 mt-16">
      <div className="container-page py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <Logo className="h-14 w-auto mb-3" variant="white-bg" />
          <p className="text-sm text-white/60 max-w-xs">{t("footer.tagline")}</p>
          {socialLinks.some(({ key }) => settings[key]?.trim()) && (
            <div className="flex items-center gap-3 mt-5" aria-label="Social media links">
              {socialLinks.map(({ key, label, type }) => {
                const url = settings[key]?.trim();
                if (!url) return null;

                return (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    title={label}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-white/20 text-white/70 hover:text-brand-gold hover:border-brand-gold transition-colors"
                  >
                    <SocialIcon type={type} className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h4 className="font-display font-semibold text-white mb-3">{t("footer.quickLinks")}</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link to="/products" className="hover:text-brand-gold">{t("nav.products")}</Link></li>
            <li><Link to="/about" className="hover:text-brand-gold">{t("nav.about")}</Link></li>
            <li><Link to="/payment" className="hover:text-brand-gold">{t("footer.paymentInfo")}</Link></li>
            <li><Link to="/safety" className="hover:text-brand-gold">{t("nav.safety")}</Link></li>
            <li><Link to="/privacy-policy" className="hover:text-brand-gold">{t("footer.privacyPolicy")}</Link></li>
            <li><Link to="/terms-and-conditions" className="hover:text-brand-gold">{t("footer.terms")}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display font-semibold text-white mb-3">{t("footer.contactUs")}</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li>{settings.address}</li>
            <li>{settings.phone_primary}{settings.phone_secondary ? `, ${settings.phone_secondary}` : ""}</li>
            <li>
              <a href={whatsappLink(settings.whatsapp_number)} target="_blank" rel="noopener noreferrer" className="hover:text-brand-gold">
                {t("footer.whatsappPrefix")}: {settings.phone_primary}
              </a>
            </li>
            {settings.email && <li>{settings.email}</li>}
          </ul>
        </div>

        <div>
          <h4 className="font-display font-semibold text-white mb-3">{t("contact.hours")}</h4>
          <p className="text-sm text-white/70">{settings.business_hours}</p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page py-4 text-xs text-white/50 flex flex-col items-center justify-center text-center gap-2">
          <span>
            &copy; {year} {settings.business_name}. {t("footer.rights")}
          </span>

          <div className="text-white/40">
            {t("footer.madeBy")}{" "}
            <a
              href="https://midhun-v-s.web.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-gold hover:text-white underline underline-offset-2 transition-colors"
            >
              Midhun
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}