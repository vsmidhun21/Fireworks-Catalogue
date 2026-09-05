import { useTranslation } from "react-i18next";
import { MapPin, Phone, MessageSquare, Clock } from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
import { whatsappLink } from "../../utils/format";

export default function Contact() {
  const { t } = useTranslation();
  const { settings } = useSettings();

  return (
    <div className="container-page py-12 sm:py-16 max-w-3xl mx-auto">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-navy mb-8 text-center">{t("contact.title")}</h1>

      <div className="grid sm:grid-cols-2 gap-5">
        <div className="card-surface p-6 rounded-2xl border border-brand-border shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-brand-primary">
            <MapPin className="w-5 h-5 shrink-0" />
            <h3 className="font-display font-semibold text-brand-navy">{t("contact.address")}</h3>
          </div>
          <p className="text-brand-muted text-sm leading-relaxed">{settings.address}</p>
        </div>

        <div className="card-surface p-6 rounded-2xl border border-brand-border shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-brand-primary">
            <Phone className="w-5 h-5 shrink-0" />
            <h3 className="font-display font-semibold text-brand-navy">{t("contact.phone")}</h3>
          </div>
          <p className="text-brand-muted text-sm">{settings.phone_primary}{settings.phone_secondary ? `, ${settings.phone_secondary}` : ""}</p>
        </div>

        <div className="card-surface p-6 rounded-2xl border border-brand-border shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-brand-primary">
            <MessageSquare className="w-5 h-5 shrink-0" />
            <h3 className="font-display font-semibold text-brand-navy">{t("contact.whatsapp")}</h3>
          </div>
          <a href={whatsappLink(settings.whatsapp_number)} target="_blank" rel="noopener noreferrer" className="text-brand-primary font-semibold hover:underline text-sm inline-block">
            {t("contact.chatWhatsapp")}
          </a>
        </div>

        <div className="card-surface p-6 rounded-2xl border border-brand-border shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-brand-primary">
            <Clock className="w-5 h-5 shrink-0" />
            <h3 className="font-display font-semibold text-brand-navy">{t("contact.hours")}</h3>
          </div>
          <p className="text-brand-muted text-sm">{settings.business_hours}</p>
        </div>
      </div>

      {settings.google_maps_url ? (
        <div className="mt-8 aspect-video rounded-2xl overflow-hidden border border-brand-border shadow-sm">
          <iframe title="map" src={settings.google_maps_url} className="w-full h-full" loading="lazy" />
        </div>
      ) : (
        <p className="text-xs text-brand-muted text-center mt-8">{t("contact.mapsPlaceholder")}</p>
      )}
    </div>
  );
}
