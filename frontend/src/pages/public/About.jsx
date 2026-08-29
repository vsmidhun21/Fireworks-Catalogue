import { useTranslation } from "react-i18next";
import Logo from "../../components/common/Logo";

export default function About() {
  const { t } = useTranslation();
  return (
    <div className="container-page py-12 sm:py-16 max-w-3xl mx-auto">
      <div className="flex justify-center mb-8">
        <Logo className="h-24 w-auto" />
      </div>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-navy text-center mb-6">{t("about.title")}</h1>
      <p className="text-brand-text/80 leading-relaxed text-center mb-10">{t("about.intro")}</p>

      <div className="grid sm:grid-cols-3 gap-6 text-center">
        <div className="card-surface p-6">
          <div className="text-3xl mb-2">🏭</div>
          <h3 className="font-display font-semibold text-brand-navy mb-1">Sourced from Sivakasi</h3>
          <p className="text-sm text-brand-muted">India's fireworks capital, known for quality craftsmanship.</p>
        </div>
        <div className="card-surface p-6">
          <div className="text-3xl mb-2">📜</div>
          <h3 className="font-display font-semibold text-brand-navy mb-1">Licensed Retailer</h3>
          <p className="text-sm text-brand-muted">Operating with a valid retail fireworks licence.</p>
        </div>
        <div className="card-surface p-6">
          <div className="text-3xl mb-2">🤝</div>
          <h3 className="font-display font-semibold text-brand-navy mb-1">Personal Service</h3>
          <p className="text-sm text-brand-muted">Our team discusses every estimate directly with you.</p>
        </div>
      </div>

      <p className="text-xs text-brand-muted text-center mt-10">
        This is placeholder content. Final About Us copy should be supplied or approved by the client.
      </p>
    </div>
  );
}
