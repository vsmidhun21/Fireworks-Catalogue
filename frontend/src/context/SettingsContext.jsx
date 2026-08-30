import { createContext, useContext, useEffect, useState } from "react";
import { SettingsService } from "../services/api";
import { applyTheme, applySiteMeta, DEFAULT_THEME } from "../utils/theme";

const SettingsContext = createContext({
  settings: {},
  loading: true,
  refreshSettings: async () => {},
  updateSettings: () => {},
});

const FALLBACK = {
  business_name: "RR Crackers",
  site_tagline: "Premium Fireworks Catalogue & Estimate",
  logo_url: "/images/logo.png",
  phone_primary: "",
  phone_secondary: "",
  whatsapp_number: "918754066248",
  email: "",
  address: "Sivakasi, Tamil Nadu, India",
  business_hours: "Mon - Sun: 9:00 AM - 9:00 PM",
  google_maps_url: "",
  facebook_url: "",
  instagram_url: "",
  youtube_url: "",
  announcement_text: "",
  ...DEFAULT_THEME,
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(FALLBACK);
  const [loading, setLoading] = useState(true);

  // Any time settings change (initial load, or an admin save elsewhere in
  // the app), re-apply the brand colors + logo/title/favicon so the whole
  // app reflects them immediately without a page reload.
  useEffect(() => {
    applyTheme(settings);
    applySiteMeta(settings);
  }, [settings]);

  async function refreshSettings() {
    const res = await SettingsService.public();
    const next = { ...FALLBACK, ...(res.data || {}) };
    setSettings(next);
    return next;
  }

  function updateSettings(nextValues) {
    setSettings((current) => ({ ...current, ...nextValues }));
  }

  useEffect(() => {
    SettingsService.public()
      .then((res) => setSettings({ ...FALLBACK, ...res.data }))
      .catch(() => setSettings(FALLBACK))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
