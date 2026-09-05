import {
  ShieldCheck, Truck, Sparkles, BadgeCheck, Wallet, Headset, ListChecks, PartyPopper,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../context/SettingsContext";

const ITEMS = [
  { icon: ShieldCheck, color: "text-emerald-400 bg-emerald-400/10", key: 1 },
  { icon: Truck, color: "text-cyan-400 bg-cyan-400/10", key: 2 },
  { icon: Sparkles, color: "text-amber-400 bg-amber-400/10", key: 3 },
  { icon: BadgeCheck, color: "text-rose-400 bg-rose-400/10", key: 4 },
  { icon: Wallet, color: "text-lime-400 bg-lime-400/10", key: 5 },
  { icon: ListChecks, color: "text-violet-400 bg-violet-400/10", key: 6 },
  { icon: Headset, color: "text-sky-400 bg-sky-400/10", key: 7 },
  { icon: PartyPopper, color: "text-pink-400 bg-pink-400/10", key: 8 },
];

export default function WhyChooseUs() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const businessName = settings.business_name || "Sri RR Crackers";

  return (
    <section className="bg-brand-navy text-white py-14 sm:py-16 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "26px 26px" }}
      />
      <div className="container-page relative z-10">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-gold">Why {businessName}</span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold mt-1">{t("home.whyChooseUs")}</h2>
          <p className="text-sm text-white/60 mt-1">{t("whyChooseUs.subtitle")}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 sm:gap-6">
          {ITEMS.map(({ icon: Icon, color, key }) => (
            <div
              key={key}
              className="text-center px-2 py-3 space-y-3 rounded-2xl hover:bg-white/5 transition-colors"
            >
              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${color} flex items-center justify-center mx-auto border border-white/10 group-hover:scale-105 transition-transform`}>
                <Icon className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <h3 className="font-display font-bold text-sm sm:text-base text-white">{t(`whyChooseUs.item${key}Title`)}</h3>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed">{t(`whyChooseUs.item${key}Desc`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
