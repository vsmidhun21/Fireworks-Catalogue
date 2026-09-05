import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Logo from "../common/Logo";
import { useSettings } from "../../context/SettingsContext";
import { whatsappLink } from "../../utils/format";

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
        </div>

        <div>
          <h4 className="font-display font-semibold text-white mb-3">{t("footer.quickLinks")}</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link to="/products" className="hover:text-brand-gold">{t("nav.products")}</Link></li>
            <li><Link to="/gift-boxes" className="hover:text-brand-gold">{t("nav.giftBoxes")}</Link></li>
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