export default function Logo({ className = "h-12 w-auto", variant = "transparent" }) {
  const src = variant === "transparent" ? "/images/logo.png" : "/images/logo-white-bg.png";
  return <img src={src} alt="Sri RR Crackers" className={className} />;
}
