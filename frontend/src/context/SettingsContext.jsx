import { createContext, useContext, useEffect, useState } from "react";
import { SettingsService } from "../services/api";

const SettingsContext = createContext({ settings: {}, loading: true });

const FALLBACK = {
  business_name: "Sri RR Crackers",
  phone_primary: "87540 66248",
  phone_secondary: "88257 21391",
  whatsapp_number: "918754066248",
  email: "info@srirrcrackers.example",
  address: "Sivakasi, Tamil Nadu, India",
  business_hours: "Mon - Sun: 9:00 AM - 9:00 PM",
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SettingsService.public()
      .then((res) => setSettings({ ...FALLBACK, ...res.data }))
      .catch(() => setSettings(FALLBACK))
      .finally(() => setLoading(false));
  }, []);

  return <SettingsContext.Provider value={{ settings, loading }}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}
