import { useTranslation } from "react-i18next";

export default function LanguageSwitcher({ light = false }) {
  const { i18n } = useTranslation();

  function toggle(lang) {
    i18n.changeLanguage(lang);
  }

  const base = "px-2 py-1 rounded-full text-sm font-semibold transition-colors";
  const activeCls = light ? "bg-white text-brand-primary" : "bg-brand-primary text-white";
  const inactiveCls = light ? "text-white/80 hover:text-white" : "text-brand-muted hover:text-brand-primary";

  return (
    <div className="flex items-center gap-1">
      <button className={`${base} ${i18n.language === "en" ? activeCls : inactiveCls}`} onClick={() => toggle("en")}>
        EN
      </button>
      <span className={light ? "text-white/40" : "text-brand-border"}>|</span>
      <button
        className={`${base} font-tamil ${i18n.language === "ta" ? activeCls : inactiveCls}`}
        onClick={() => toggle("ta")}
      >
        தமிழ்
      </button>
    </div>
  );
}
