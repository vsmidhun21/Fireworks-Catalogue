import { Link } from "react-router-dom";
import {
  Building2, ShieldCheck, Users, Sparkles, HeartHandshake, Award,
  Layers, Headphones, ArrowRight, CheckCircle2,
} from "lucide-react";
import Logo from "../../components/common/Logo";
import { useSettings } from "../../context/SettingsContext";
import SEO from "../../components/common/SEO";

const VALUES = [
  { icon: Award, title: "Quality", desc: "Carefully selected products, chosen for a safe and joyful experience." },
  { icon: ShieldCheck, title: "Trust", desc: "Clear pricing and honest communication, from enquiry to delivery." },
  { icon: HeartHandshake, title: "Customer Satisfaction", desc: "Every order is discussed personally — never left to guesswork." },
  { icon: Sparkles, title: "Responsible Celebration", desc: "We encourage safe, mindful use of fireworks at every celebration." },
  { icon: Layers, title: "Variety", desc: "A wide catalogue spanning sparklers, aerial fancy items and gift boxes." },
  { icon: Headphones, title: "Service", desc: "A team that's easy to reach by phone or WhatsApp, whenever you need us." },
];

export default function About() {
  const { settings } = useSettings();
  const businessName = settings.business_name || "Sri RR Crackers";

  return (
    <div>
      <SEO
        title="About Us"
        description={`Learn about ${businessName} — a Sivakasi fireworks retailer focused on quality, trust and responsible celebration.`}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-navy via-slate-900 to-brand-primary-dark text-white py-16 sm:py-24">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1.5px, transparent 1.5px)", backgroundSize: "24px 24px" }}
        />
        <div className="absolute top-10 left-1/4 w-64 h-64 bg-brand-gold/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/5 w-72 h-72 bg-brand-primary/25 rounded-full blur-3xl" />

        <div className="container-page relative z-10 text-center max-w-2xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="bg-white/95 rounded-2xl p-4 shadow-2xl">
              <Logo className="h-16 w-auto" />
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 bg-brand-gold/20 border border-brand-gold/40 text-brand-gold text-xs font-extrabold uppercase tracking-wide px-4 py-1.5 rounded-full mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            Our Story
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold leading-tight">
            Celebrating Every Moment with {businessName}
          </h1>
        </div>
      </section>

      {/* Story */}
      <section className="container-page py-14 sm:py-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center mb-16">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">Our Story</span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-brand-navy mt-1 mb-5">
              Rooted in Sivakasi's fireworks tradition
            </h2>
            <p className="text-brand-text/80 leading-relaxed mb-4">
              {businessName} is a retailer of superior fancy crackers, sparklers and gift boxes,
              based in Sivakasi — widely known as the fireworks capital of India. Our catalogue
              brings together products chosen for their quality, variety and value.
            </p>
            <p className="text-brand-text/70 leading-relaxed">
              We built this website so customers can browse our full range, put together an
              order at their own pace, and let our team take care of confirming pricing,
              availability and delivery — all without any online payment.
            </p>
          </div>
          <div className="relative rounded-3xl overflow-hidden aspect-[4/3] bg-gradient-to-br from-brand-primary via-purple-700 to-brand-navy shadow-xl">
            <div
              className="absolute inset-0 opacity-[0.1]"
              style={{ backgroundImage: "radial-gradient(circle, #fff 1.5px, transparent 1.5px)", backgroundSize: "22px 22px" }}
            />
            <Sparkles className="absolute w-40 h-40 text-white/10 -bottom-6 -right-6" strokeWidth={1} />
            <div className="relative z-10 h-full flex flex-col items-center justify-center gap-3 p-8 text-center text-white">
              <Building2 className="w-10 h-10 text-brand-gold" />
              <p className="font-display font-bold text-lg">Sourced from Sivakasi</p>
              <p className="text-white/70 text-sm max-w-xs">
                India's home of fireworks craftsmanship and manufacturing heritage.
              </p>
            </div>
          </div>
        </div>

        {/* Mission */}
        <div className="rounded-3xl bg-brand-cream border border-brand-border p-8 sm:p-10 mb-16 text-center max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">Our Mission</span>
          <p className="font-display text-xl sm:text-2xl font-bold text-brand-navy mt-2 leading-snug">
            To provide a reliable and enjoyable way for families to explore fireworks for
            festive celebrations.
          </p>
        </div>

        {/* Values */}
        <div className="mb-16">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">Our Values</span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-brand-navy mt-1">What guides us</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card-surface p-6 rounded-2xl border border-brand-border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
                <div className="w-12 h-12 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-display font-semibold text-brand-navy mb-1.5">{title}</h3>
                <p className="text-sm text-brand-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Why us / commitment */}
        <div className="grid sm:grid-cols-3 gap-6 mb-16">
          <div className="card-surface p-6 rounded-2xl border border-brand-border shadow-sm text-center">
            <div className="w-12 h-12 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="font-display font-semibold text-brand-navy mb-1">Sourced from Sivakasi</h3>
            <p className="text-sm text-brand-muted">India's fireworks capital, known for quality craftsmanship.</p>
          </div>
          <div className="card-surface p-6 rounded-2xl border border-brand-border shadow-sm text-center">
            <div className="w-12 h-12 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-display font-semibold text-brand-navy mb-1">Licensed Retailer</h3>
            <p className="text-sm text-brand-muted">Operating with a valid retail fireworks licence.</p>
          </div>
          <div className="card-surface p-6 rounded-2xl border border-brand-border shadow-sm text-center">
            <div className="w-12 h-12 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-display font-semibold text-brand-navy mb-1">Personal Service</h3>
            <p className="text-sm text-brand-muted">Our team discusses every order directly with you.</p>
          </div>
        </div>

        {/* Safety & Responsible Celebration */}
        <div className="rounded-3xl bg-brand-navy text-white p-8 sm:p-10 mb-14">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="w-7 h-7 text-brand-gold" />
            <h2 className="font-display text-xl sm:text-2xl font-bold">Safety &amp; Responsible Celebration</h2>
          </div>
          <p className="text-white/80 leading-relaxed max-w-2xl mb-4">
            We encourage every customer to handle fireworks responsibly — follow local
            regulations, read manufacturer instructions, and celebrate under adult supervision.
          </p>
          <Link to="/safety" className="inline-flex items-center gap-2 text-brand-gold font-semibold hover:underline">
            Read our full safety guidance
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-emerald-600 text-sm font-semibold mb-4">
            <CheckCircle2 className="w-4 h-4" />
            Ready to plan your celebration?
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/products" className="btn-primary !py-3.5 !px-8">
              Browse Products
            </Link>
            <Link to="/contact" className="rounded-full border border-brand-border text-brand-navy font-bold px-8 py-3.5 hover:bg-slate-50 transition-all">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
