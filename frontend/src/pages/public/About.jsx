import { useTranslation } from "react-i18next";
import { Building2, ShieldCheck, Users } from "lucide-react";
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
        <div className="card-surface p-6 rounded-2xl border border-brand-border shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="font-display font-semibold text-brand-navy mb-1">Sourced from Sivakasi</h3>
          <p className="text-sm text-brand-muted">India's fireworks capital, known for quality craftsmanship.</p>
        </div>
        <div className="card-surface p-6 rounded-2xl border border-brand-border shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-display font-semibold text-brand-navy mb-1">Licensed Retailer</h3>
          <p className="text-sm text-brand-muted">Operating with a valid retail fireworks licence.</p>
        </div>
        <div className="card-surface p-6 rounded-2xl border border-brand-border shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-display font-semibold text-brand-navy mb-1">Personal Service</h3>
          <p className="text-sm text-brand-muted">Our team discusses every estimate directly with you.</p>
        </div>
      </div>
    </div>
  );
}
