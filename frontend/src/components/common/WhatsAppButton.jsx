import { useTranslation } from "react-i18next";
import { whatsappLink } from "../../utils/format";
import { useSettings } from "../../context/SettingsContext";

export default function WhatsAppButton({ message }) {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const number = settings?.whatsapp_number || "918754066248";

  return (
    <a
      href={whatsappLink(number, message || t("home.whatsappCta"))}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 px-4 py-3 font-semibold hover:brightness-105 transition-all"
      aria-label={t("aria.chatWhatsapp")}
    >
      <svg viewBox="0 0 32 32" className="w-6 h-6 fill-white">
        <path d="M16.001 3C9.373 3 4 8.373 4 15c0 2.386.697 4.607 1.902 6.48L4 29l7.72-1.865A11.94 11.94 0 0016.001 27C22.627 27 28 21.627 28 15S22.627 3 16.001 3zm0 21.6c-1.98 0-3.86-.55-5.47-1.5l-.393-.233-4.58 1.106 1.13-4.463-.256-.406A9.55 9.55 0 016.4 15c0-5.294 4.307-9.6 9.601-9.6 5.294 0 9.6 4.306 9.6 9.6 0 5.294-4.306 9.6-9.6 9.6zm5.263-7.19c-.288-.144-1.703-.84-1.967-.936-.264-.096-.456-.144-.648.144-.192.288-.744.936-.912 1.128-.168.192-.336.216-.624.072-.288-.144-1.216-.448-2.317-1.43-.856-.762-1.434-1.703-1.602-1.99-.168-.288-.018-.444.126-.588.13-.13.288-.336.432-.504.144-.168.192-.288.288-.48.096-.192.048-.36-.024-.504-.072-.144-.648-1.563-.888-2.14-.234-.563-.472-.487-.648-.496l-.552-.01c-.192 0-.504.072-.768.36-.264.288-1.008.984-1.008 2.4 0 1.416 1.032 2.784 1.176 2.976.144.192 2.03 3.1 4.92 4.347.688.297 1.224.474 1.643.606.69.22 1.318.19 1.815.115.554-.083 1.703-.696 1.943-1.369.24-.672.24-1.248.168-1.368-.072-.12-.264-.192-.552-.336z" />
      </svg>
      <span className="hidden sm:inline">{t("estimate.chatWhatsapp")}</span>
    </a>
  );
}
