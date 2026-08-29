import { useTranslation } from "react-i18next";

export default function Safety() {
  const { t } = useTranslation();
  return (
    <div className="container-page py-12 sm:py-16 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-navy mb-6">{t("safety.title")}</h1>
      <p className="text-brand-text/80 leading-relaxed mb-6">{t("safety.intro")}</p>
      <ul className="list-disc pl-5 space-y-2 text-brand-text/80 text-sm">
        <li>Light fireworks only in open, well-ventilated outdoor spaces, away from dry grass and flammable material.</li>
        <li>Keep a bucket of water or sand nearby at all times.</li>
        <li>Adults should supervise children at all times; children should not light fireworks unsupervised.</li>
        <li>Never attempt to relight a "dud" firework — wait and douse it with water.</li>
        <li>Store fireworks in a cool, dry place away from direct sunlight and open flames.</li>
        <li>Follow all local and national regulations regarding permitted timings and locations for bursting crackers.</li>
      </ul>
      <p className="text-xs text-brand-muted mt-8">
        This is general safety guidance only. Final, legally reviewed safety content should be supplied or approved by the client.
      </p>
    </div>
  );
}
