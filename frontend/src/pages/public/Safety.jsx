import { useTranslation } from "react-i18next";

export default function Safety() {
  const { t } = useTranslation();
  return (
    <div className="container-page py-12 sm:py-16 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-navy mb-6">{t("safety.title")}</h1>
      <p className="text-brand-text/80 leading-relaxed mb-6">{t("safety.intro")}</p>
      <ul className="list-disc pl-5 space-y-2 text-brand-text/80 text-sm">
        <li>{t("safety.point1")}</li>
        <li>{t("safety.point2")}</li>
        <li>{t("safety.point3")}</li>
        <li>{t("safety.point4")}</li>
        <li>{t("safety.point5")}</li>
        <li>{t("safety.point6")}</li>
      </ul>
      <p className="text-xs text-brand-muted mt-8">
        {t("safety.disclaimer")}
      </p>
    </div>
  );
}
