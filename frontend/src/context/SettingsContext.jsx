import { createContext, useContext, useEffect, useState } from "react";
import { SettingsService } from "../services/api";
import { applyTheme, applySiteMeta, DEFAULT_THEME } from "../utils/theme";

const SettingsContext = createContext({
  settings: {},
  loading: true,
  refreshSettings: async () => {},
  updateSettings: () => {},
});

export const DEFAULT_TICKER_ITEMS = [
  {
    id: "ticker-1",
    highlight_text: "MEGA DIWALI SALE",
    highlight_color: "#fbbf24",
    highlight_text_color: "#020617",
    message_text: "Special Diwali Festive Discounts Live! Up to 90% Off Retail Prices!",
    is_active: true,
  },
  {
    id: "ticker-2",
    highlight_text: "SIVAKASI DIRECT",
    highlight_color: "#f43f5e",
    highlight_text_color: "#ffffff",
    message_text: "100% Genuine Certified Green Crackers Directly from Sivakasi Factory",
    is_active: true,
  },
  {
    id: "ticker-3",
    highlight_text: "PAN-INDIA DISPATCH",
    highlight_color: "#34d399",
    highlight_text_color: "#020617",
    message_text: "Fast & Safe Transport Across India · Minimum Order ₹3,000",
    is_active: true,
  },
  {
    id: "ticker-4",
    highlight_text: "QUICK ESTIMATE",
    highlight_color: "#22d3ee",
    highlight_text_color: "#020617",
    message_text: "Select Crackers & Get Instant Quotation in 1-Click with Zero Payment Advance!",
    is_active: true,
  },
  {
    id: "ticker-5",
    highlight_text: "CALL / WHATSAPP",
    highlight_color: "#f59e0b",
    highlight_text_color: "#020617",
    message_text: "Helpline: +91 87540 66248 | +91 88257 21391",
    is_active: true,
  },
];

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
  header_ticker_items: DEFAULT_TICKER_ITEMS,
  ...DEFAULT_THEME,
};

function normalizeSettings(data = {}) {
  let tickerItems = data.header_ticker_items;
  if (typeof tickerItems === "string") {
    try {
      tickerItems = JSON.parse(tickerItems);
    } catch {
      tickerItems = null;
    }
  }
  if (!Array.isArray(tickerItems) || tickerItems.length === 0) {
    tickerItems = DEFAULT_TICKER_ITEMS;
  }
  return {
    ...FALLBACK,
    ...data,
    header_ticker_items: tickerItems,
  };
}

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
    const next = normalizeSettings(res.data || {});
    setSettings(next);
    return next;
  }

  function updateSettings(nextValues) {
    setSettings((current) => normalizeSettings({ ...current, ...nextValues }));
  }

  useEffect(() => {
    SettingsService.public()
      .then((res) => setSettings(normalizeSettings(res.data || {})))
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
