import { useSettings } from "../../context/SettingsContext";

/**
 * Single source of truth for the business logo everywhere in the app
 * (header, footer, admin panel, login screen, PDF exports). Reads from
 * Admin → Settings → Branding, so uploading a new logo there instantly
 * rebrands the whole site — no code changes needed, ever.
 */
export default function Logo({ className = "h-12 w-auto", variant = "transparent" }) {
  const { settings } = useSettings();
  const src =
    variant === "white-bg"
      ? settings.logo_white_bg_url || settings.logo_url || "/images/logo-white-bg.png"
      : settings.logo_url || "/images/logo.png";

  return <img src={src} alt={settings.business_name || "Business logo"} className={className} />;
}
