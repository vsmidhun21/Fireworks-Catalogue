import { useTranslation } from "react-i18next";
import SEO from "../../components/common/SEO";

export default function PrivacyPolicy() {
  const { t } = useTranslation();
  return (
    <div className="container-page py-12 sm:py-16 max-w-2xl mx-auto">
      <SEO title={t("privacyPolicy.title")} />
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-navy mb-6">{t("privacyPolicy.title")}</h1>
      <p className="text-brand-text/80 leading-relaxed mb-4">
        {t("privacyPolicy.paragraph1")}
      </p>
      <p className="text-brand-text/80 leading-relaxed mb-4">
        {t("privacyPolicy.paragraph2")}
      </p>
      {/* <p className="text-xs text-brand-muted mt-8">
        {t("privacyPolicy.placeholderNote")}
      </p> */}
    </div>
  );
}
