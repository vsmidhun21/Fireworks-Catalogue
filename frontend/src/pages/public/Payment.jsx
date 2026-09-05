import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ShieldCheck, MessageCircle, PhoneCall, ArrowRight, XCircle, CheckCircle2 } from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
import { whatsappLink } from "../../utils/format";
import SEO from "../../components/common/SEO";

export default function Payment() {
  const { t } = useTranslation();
  const { settings } = useSettings();

  return (
    <div className="container-page py-12 sm:py-16 max-w-3xl mx-auto">
      <SEO
        title={t("payment.title")}
        description={t("payment.intro")}
      />

      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-navy mb-3">
          {t("payment.title")}
        </h1>
        <p className="text-brand-text/80 leading-relaxed max-w-xl mx-auto">
          {t("payment.intro")}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5 mb-10">
        <div className="card-surface rounded-2xl border border-brand-border p-6">
          <div className="flex items-center gap-2 text-rose-600 mb-3">
            <XCircle className="w-5 h-5" />
            <h3 className="font-display font-bold text-brand-navy">{t("payment.notDoTitle")}</h3>
          </div>
          <ul className="space-y-2 text-sm text-brand-text/75 list-disc list-inside">
            <li>{t("payment.notDo1")}</li>
            <li>{t("payment.notDo2")}</li>
            <li>{t("payment.notDo3")}</li>
          </ul>
        </div>

        <div className="card-surface rounded-2xl border border-brand-border p-6">
          <div className="flex items-center gap-2 text-emerald-600 mb-3">
            <CheckCircle2 className="w-5 h-5" />
            <h3 className="font-display font-bold text-brand-navy">{t("payment.howTitle")}</h3>
          </div>
          <ul className="space-y-2 text-sm text-brand-text/75 list-disc list-inside">
            <li>{t("payment.how1")}</li>
            <li>{t("payment.how2")}</li>
            <li>{t("payment.how3")}</li>
            <li>{t("payment.how4")}</li>
          </ul>
        </div>
      </div>

      <div className="rounded-2xl bg-brand-navy text-white p-6 sm:p-8 mb-10">
        <h2 className="font-display text-lg sm:text-xl font-bold mb-4">{t("payment.flowTitle")}</h2>
        <ol className="space-y-3 text-sm sm:text-base text-white/85">
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-brand-gold text-brand-navy font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
            <span>{t("payment.flow1")}</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-brand-gold text-brand-navy font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
            <span>{t("payment.flow2")}</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-brand-gold text-brand-navy font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
            <span>{t("payment.flow3")}</span>
          </li>
        </ol>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <a
          href={whatsappLink(settings?.whatsapp_number, t("payment.whatsappMessage"))}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold px-6 py-3 transition-all shadow-sm"
        >
          <MessageCircle className="w-4.5 h-4.5" />
          <span>{t("payment.askWhatsapp")}</span>
        </a>
        {settings?.phone_primary && (
          <a
            href={`tel:${settings.phone_primary}`}
            className="inline-flex items-center gap-2 rounded-full bg-white border border-brand-border text-brand-navy font-bold px-6 py-3 hover:bg-slate-50 transition-all"
          >
            <PhoneCall className="w-4.5 h-4.5" />
            <span>{t("payment.callUs")}</span>
          </a>
        )}
        <Link
          to="/products"
          className="inline-flex items-center gap-2 rounded-full bg-brand-primary text-white font-bold px-6 py-3 hover:bg-brand-primary-dark transition-all"
        >
          <span>{t("payment.continueBrowsing")}</span>
          <ArrowRight className="w-4.5 h-4.5" />
        </Link>
      </div>
    </div>
  );
}
