import { createContext, useContext, useEffect, useState } from "react";
import { SettingsService } from "../services/api";

const SettingsContext = createContext({
  settings: {},
  loading: true,
  refreshSettings: async () => {},
  updateSettings: () => {},
});

const FALLBACK = {
  business_name: "RR Crackers",
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
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(FALLBACK);
  const [loading, setLoading] = useState(true);

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
