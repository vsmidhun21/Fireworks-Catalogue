import { useEffect, useRef, useState } from "react";
import {
  Save,
  CheckCircle2,
  Loader2,
  UploadCloud,
  RotateCcw,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Megaphone,
  Sparkles,
  Palette,
  PhoneCall,
  Eye,
  EyeOff,
} from "lucide-react";
import { AdminSettingsService } from "../../services/api";
import { useSettings, DEFAULT_TICKER_ITEMS } from "../../context/SettingsContext";
import { applyTheme, DEFAULT_THEME } from "../../utils/theme";

const contactFields = [
  { key: "business_name", label: "Business Name" },
  { key: "site_tagline", label: "Website Tagline", placeholder: "Premium Fireworks Catalogue & Estimate" },
  { key: "phone_primary", label: "Primary Phone" },
  { key: "phone_secondary", label: "Secondary Phone" },
  { key: "whatsapp_number", label: "WhatsApp Number (with country code, no +)", placeholder: "918754066248" },
  { key: "email", label: "Business Email" },
  { key: "address", label: "Address", textarea: true },
  { key: "business_hours", label: "Business Hours" },
  { key: "google_maps_url", label: "Google Maps Embed URL" },
  { key: "facebook_url", label: "Facebook URL" },
  { key: "instagram_url", label: "Instagram URL" },
  { key: "youtube_url", label: "YouTube URL" },
];

const colorFields = [
  { key: "theme_primary_color", label: "Primary Color", hint: "Buttons, links, active states" },
  { key: "theme_secondary_color", label: "Accent / CTA Color", hint: "Call-to-action highlights" },
  { key: "theme_dark_color", label: "Dark / Navy Color", hint: "Header & footer backgrounds" },
  { key: "theme_gold_color", label: "Festive Gold Color", hint: "Badges & festive highlights" },
];

const BADGE_COLOR_PRESETS = [
  { name: "Amber", bg: "#fbbf24", text: "#020617" },
  { name: "Rose", bg: "#f43f5e", text: "#ffffff" },
  { name: "Emerald", bg: "#34d399", text: "#020617" },
  { name: "Cyan", bg: "#22d3ee", text: "#020617" },
  { name: "Gold", bg: "#f59e0b", text: "#020617" },
  { name: "Purple", bg: "#8b5cf6", text: "#ffffff" },
  { name: "Orange", bg: "#f97316", text: "#ffffff" },
  { name: "Slate", bg: "#0f172a", text: "#ffffff" },
];

export default function AdminSettings() {
  const { updateSettings, settings: liveSettings } = useSettings();
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    AdminSettingsService.get()
      .then((res) => {
        let tickerItems = res.data?.header_ticker_items;
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
        setForm({ ...DEFAULT_THEME, ...(res.data || {}), header_ticker_items: tickerItems });
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const res = await AdminSettingsService.update(form);
      updateSettings(res?.data || form);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  function handleColorChange(key, value) {
    const next = { ...form, [key]: value };
    setForm(next);
    // Live-preview the color across the whole app immediately, before saving.
    applyTheme(next);
  }

  function handleResetColors() {
    const next = { ...form, ...DEFAULT_THEME };
    setForm(next);
    applyTheme(next);
  }

  async function handleLogoSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError("");
    setLogoUploading(true);
    try {
      const res = await AdminSettingsService.uploadLogo(file);
      const logoUrl = res.data.logo_url;
      setForm((f) => ({ ...f, logo_url: logoUrl }));
      updateSettings({ logo_url: logoUrl });
    } catch (err) {
      setLogoError(err.message || "Failed to upload logo");
    } finally {
      setLogoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // Ticker Management Handlers
  function handleAddTickerItem() {
    const newItem = {
      id: `ticker-${Date.now()}`,
      highlight_text: "",
      highlight_color: "#fbbf24",
      highlight_text_color: "#020617",
      message_text: "",
      is_active: true,
    };
    setForm((f) => ({
      ...f,
      header_ticker_items: [...(f.header_ticker_items || []), newItem],
    }));
  }

  function handleUpdateTickerItem(index, key, value) {
    setForm((f) => {
      const items = [...(f.header_ticker_items || [])];
      items[index] = { ...items[index], [key]: value };
      return { ...f, header_ticker_items: items };
    });
  }

  function handleDeleteTickerItem(index) {
    setForm((f) => {
      const items = [...(f.header_ticker_items || [])];
      items.splice(index, 1);
      return { ...f, header_ticker_items: items };
    });
  }

  function handleMoveTickerItem(index, direction) {
    setForm((f) => {
      const items = [...(f.header_ticker_items || [])];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= items.length) return f;
      const temp = items[index];
      items[index] = items[targetIndex];
      items[targetIndex] = temp;
      return { ...f, header_ticker_items: items };
    });
  }

  function handleResetTickerItems() {
    if (window.confirm("Reset all header scrolling items to default festive offers?")) {
      setForm((f) => ({
        ...f,
        header_ticker_items: DEFAULT_TICKER_ITEMS,
      }));
    }
  }


  if (loading) {
    return (
      <div className="py-12 text-center text-brand-muted">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-primary" />
        <span>Loading store settings...</span>
      </div>
    );
  }

  const tickerItems = form.header_ticker_items || [];

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-navy">Website & Business Settings</h1>
          <p className="text-sm text-brand-muted">
            Configure site branding, moving header highlight ticker, and business contact information.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn-primary !py-2.5 !px-6 text-sm flex items-center gap-2 disabled:opacity-60 shrink-0 self-start sm:self-auto shadow-md"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </>
          )}
        </button>
      </div>

      {saved && (
        <div className="flex items-center gap-2 p-3.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-sm font-medium shadow-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>Settings saved successfully! The customer website and moving ticker are updated live.</span>
        </div>
      )}

      {/* ---------- BRANDING ---------- */}
      <div className="card-surface rounded-2xl border border-brand-border/80 p-4 sm:p-6 md:p-8 space-y-6 overflow-hidden">
        <div>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-brand-primary shrink-0" />
            <h2 className="font-display text-lg font-bold text-brand-navy">Branding</h2>
          </div>
          {/* <p className="text-sm text-brand-muted">Your logo and brand colors, used site-wide.</p> */}
        </div>

        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div className="shrink-0">
            <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-brand-border flex items-center justify-center bg-brand-cream overflow-hidden">
              <img
                src={form.logo_url || liveSettings.logo_url || "/images/logo.png"}
                alt="Current logo"
                className="max-w-full max-h-full object-contain p-2"
              />
            </div>
          </div>
          <div className="w-full flex-1 space-y-2 text-center sm:text-left">
            <label className="inline-flex items-center gap-2 rounded-full bg-brand-primary text-white px-4 py-2 text-sm font-semibold cursor-pointer hover:bg-brand-primary-dark transition-colors">
              {logoUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
              <span>{logoUploading ? "Uploading..." : "Upload New Logo"}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleLogoSelect}
                disabled={logoUploading}
              />
            </label>
            <p className="text-xs text-brand-muted">
              PNG or SVG with a transparent background works best, at least 256×256px.
            </p>
            {logoError && <p className="text-xs text-brand-error">{logoError}</p>}
          </div>
        </div>

        <div className="border-t border-brand-border pt-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold text-brand-navy text-sm">Brand Colors</h3>
            <button
              type="button"
              onClick={handleResetColors}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-muted hover:text-brand-primary"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to default
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {colorFields.map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-brand-navy mb-1.5">{f.label}</label>
                <div className="flex items-center gap-2 rounded-xl border border-brand-border px-2.5 py-2">
                  <input
                    type="color"
                    value={form[f.key] || DEFAULT_THEME[f.key]}
                    onChange={(e) => handleColorChange(f.key, e.target.value)}
                    className="w-8 h-8 rounded-lg border-0 cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={form[f.key] || DEFAULT_THEME[f.key]}
                    onChange={(e) => handleColorChange(f.key, e.target.value)}
                    className="w-full text-xs font-mono text-brand-navy outline-none bg-transparent"
                  />
                </div>
                <p className="text-[11px] text-brand-muted mt-1">{f.hint}</p>
              </div>
            ))}
          </div>
          {/* <p className="text-xs text-brand-muted mt-3">
            Color changes preview live across the site as you pick them. Click "Save Settings" below to
            make them permanent.
          </p> */}
        </div>
      </div>

      {/* ---------- HEADER ANNOUNCEMENT TICKER (MOVING HEADER HIGHLIGHT) ---------- */}
      <div className="card-surface rounded-2xl border border-brand-border/80 p-3.5 sm:p-6 md:p-8 space-y-4 sm:space-y-6 overflow-hidden max-w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border pb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-amber-500 shrink-0" />
              <h2 className="font-display text-base sm:text-lg font-bold text-brand-navy truncate">
                Header Announcement Ticker
              </h2>
            </div>
            {/* <p className="text-xs sm:text-sm text-brand-muted mt-0.5">
              Customize the moving highlight running above the header on customer pages. Add more items, change highlight colors, tags, and messages.
            </p> */}
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleResetTickerItems}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-muted hover:text-brand-navy rounded-lg border border-brand-border hover:bg-slate-50 transition-colors flex-1 sm:flex-initial"
              title="Reset to default festive announcement items"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Reset Defaults</span>
            </button>
            <button
              type="button"
              onClick={handleAddTickerItem}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 rounded-lg shadow-sm transition-all flex-1 sm:flex-initial"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Add More Content</span>
            </button>
          </div>
        </div>

        {/* Live Preview Strip */}
        <div className="rounded-xl overflow-hidden border border-amber-500/30 bg-slate-950 text-white p-2.5 sm:p-3 shadow-inner max-w-full">
          <div className="flex items-center gap-2 mb-2 text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Storefront Ticker Preview ({tickerItems.filter((i) => i.is_active !== false).length} Active Items)</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto py-1 scrollbar-thin">
            {tickerItems
              .filter((item) => item.is_active !== false)
              .map((item, idx) => (
                <div key={item.id || idx} className="flex items-center gap-2 shrink-0 text-xs">
                  <span
                    className="px-2 py-0.5 rounded text-[10px] tracking-wide uppercase font-extrabold shadow-sm shrink-0 truncate max-w-[120px] sm:max-w-[180px]"
                    style={{
                      backgroundColor: item.highlight_color || "#fbbf24",
                      color: item.highlight_text_color || "#020617",
                    }}
                  >
                    {item.highlight_text || "EMPTY"}
                  </span>
                  <span className="text-slate-200 font-medium whitespace-nowrap truncate max-w-[180px] sm:max-w-xs">
                    {item.message_text || "Remaining announcement text..."}
                  </span>
                  <span className="text-amber-400/40 shrink-0">✦</span>
                </div>
              ))}
            {tickerItems.filter((i) => i.is_active !== false).length === 0 && (
              <span className="text-xs text-slate-400 italic">No active ticker items. Default festival offers will be displayed.</span>
            )}
          </div>
        </div>

        {/* Items Editor List */}
        <div className="space-y-3.5 sm:space-y-4">
          {tickerItems.map((item, index) => (
            <div
              key={item.id || index}
              className={`rounded-xl border p-3 sm:p-4.5 transition-all overflow-hidden ${item.is_active !== false
                  ? "bg-white border-brand-border shadow-sm hover:border-amber-400/60"
                  : "bg-slate-50/70 border-slate-200 opacity-60"
                }`}
            >
              {/* Item Header & Controls */}
              <div className="flex items-center justify-between gap-2 border-b border-brand-border/60 pb-2.5 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5.5 h-5.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center justify-center border border-slate-200 shrink-0">
                    {index + 1}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide shadow-xs shrink-0 truncate max-w-[110px] sm:max-w-[160px]"
                    style={{
                      backgroundColor: item.highlight_color || "#fbbf24",
                      color: item.highlight_text_color || "#020617",
                    }}
                  >
                    {item.highlight_text || "EMPTY"}
                  </span>
                  <span className="text-xs font-semibold text-brand-navy truncate hidden sm:inline max-w-xs">
                    {item.message_text || "Untitled Message"}
                  </span>
                </div>

                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                  {/* Visibility Toggle */}
                  <button
                    type="button"
                    onClick={() => handleUpdateTickerItem(index, "is_active", item.is_active === false)}
                    className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition-colors ${item.is_active !== false
                        ? "text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
                        : "text-slate-500 border-slate-200 bg-slate-100 hover:bg-slate-200"
                      }`}
                    title={item.is_active !== false ? "Visible on ticker (Click to hide)" : "Hidden from ticker (Click to show)"}
                  >
                    {item.is_active !== false ? <Eye className="w-3.5 h-3.5 shrink-0" /> : <EyeOff className="w-3.5 h-3.5 shrink-0" />}
                    <span className="text-[11px] hidden md:inline">{item.is_active !== false ? "Visible" : "Hidden"}</span>
                  </button>

                  {/* Reorder Buttons */}
                  <button
                    type="button"
                    onClick={() => handleMoveTickerItem(index, -1)}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5 shrink-0" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveTickerItem(index, 1)}
                    disabled={index === tickerItems.length - 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5 shrink-0" />
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteTickerItem(index)}
                    disabled={tickerItems.length <= 1}
                    className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Delete this announcement item"
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  </button>
                </div>
              </div>

              {/* Form Fields for this item */}
              <div className="grid gap-3 sm:gap-4 md:grid-cols-12 items-start">
                {/* Highlight Tag / Badge Text */}
                <div className="md:col-span-4 min-w-0">
                  <label className="block text-xs font-semibold text-brand-navy mb-1">
                    Highlight Tag / Badge Text
                  </label>
                  <input
                    type="text"
                    value={item.highlight_text || ""}
                    placeholder="e.g. MEGA DIWALI SALE"
                    onChange={(e) => handleUpdateTickerItem(index, "highlight_text", e.target.value)}
                    className="w-full rounded-xl border border-brand-border px-3 py-2 text-xs font-semibold focus:outline-none focus:border-brand-primary"
                  />
                  {/* <p className="text-[11px] text-brand-muted mt-1">Short badge label shown inside the colored tag.</p> */}
                </div>

                {/* Announcement Message / Remaining Text */}
                <div className="md:col-span-8 min-w-0">
                  <label className="block text-xs font-semibold text-brand-navy mb-1">
                    Announcement Message / Remaining Text
                  </label>
                  <input
                    type="text"
                    value={item.message_text || ""}
                    placeholder="e.g. Special festive discounts live now! Up to 90% off retail prices."
                    onChange={(e) => handleUpdateTickerItem(index, "message_text", e.target.value)}
                    className="w-full rounded-xl border border-brand-border px-3 py-2 text-xs focus:outline-none focus:border-brand-primary"
                  />
                  {/* <p className="text-[11px] text-brand-muted mt-1">The primary scrolling message displayed alongside the badge.</p> */}
                </div>

                {/* Badge Highlight Color & Badge Text Color */}
                <div className="md:col-span-12 pt-3 border-t border-dashed border-brand-border/60">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Badge Background Color + Presets */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-brand-navy shrink-0">Badge Color:</span>
                      <div className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border px-2 py-1 bg-white shadow-2xs shrink-0">
                        <input
                          type="color"
                          value={item.highlight_color || "#fbbf24"}
                          onChange={(e) => handleUpdateTickerItem(index, "highlight_color", e.target.value)}
                          className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent shrink-0"
                          title="Pick custom color"
                        />
                        <input
                          type="text"
                          value={item.highlight_color || "#fbbf24"}
                          onChange={(e) => handleUpdateTickerItem(index, "highlight_color", e.target.value)}
                          className="w-16 text-xs font-mono text-brand-navy outline-none bg-transparent uppercase"
                        />
                      </div>

                      {/* Quick Presets (wraps cleanly on mobile) */}
                      <div className="flex items-center flex-wrap gap-1.5">
                        {BADGE_COLOR_PRESETS.map((preset) => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => {
                              handleUpdateTickerItem(index, "highlight_color", preset.bg);
                              handleUpdateTickerItem(index, "highlight_text_color", preset.text);
                            }}
                            className="w-5.5 h-5.5 rounded-full border border-black/15 active:scale-95 transition-transform shadow-2xs shrink-0"
                            style={{ backgroundColor: preset.bg }}
                            title={`${preset.name} (${preset.bg})`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Badge Text Color */}
                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                      <span className="text-xs font-semibold text-brand-navy shrink-0">Text:</span>
                      <div className="inline-flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleUpdateTickerItem(index, "highlight_text_color", "#020617")}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${item.highlight_text_color === "#020617" || !item.highlight_text_color
                              ? "bg-white text-slate-950 shadow-2xs"
                              : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                          Dark
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateTickerItem(index, "highlight_text_color", "#ffffff")}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${item.highlight_text_color === "#ffffff"
                              ? "bg-slate-900 text-white shadow-2xs"
                              : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                          White
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Add More Content Button */}
          <button
            type="button"
            onClick={handleAddTickerItem}
            className="w-full py-3 sm:py-3.5 px-4 border-2 border-dashed border-amber-400/80 hover:border-amber-500 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-amber-900 bg-amber-50/50 hover:bg-amber-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Add More Content (Add New Announcement)</span>
          </button>
        </div>
      </div>

      {/* ---------- CONTACT / BUSINESS DETAILS ---------- */}
      <div className="card-surface rounded-2xl border border-brand-border/80 p-4 sm:p-6 md:p-8 space-y-5 overflow-hidden">
        <div>
          <div className="flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-brand-primary shrink-0" />
            <h2 className="font-display text-lg font-bold text-brand-navy">Business & Contact Details</h2>
          </div>
          {/* <p className="text-sm text-brand-muted">Shown across the header, footer, contact page and PDF price list.</p> */}
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {contactFields.map((f) => (
            <div key={f.key} className={f.textarea ? "md:col-span-2 xl:col-span-3" : ""}>
              <label className="block text-sm font-semibold text-brand-navy mb-1">{f.label}</label>
              {f.textarea ? (
                <textarea
                  rows={2}
                  value={form[f.key] || ""}
                  placeholder={f.placeholder}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  className="w-full rounded-xl border border-brand-border px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary"
                />
              ) : (
                <input
                  value={form[f.key] || ""}
                  placeholder={f.placeholder}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  className="w-full rounded-xl border border-brand-border px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary"
                />
              )}
            </div>
          ))}
        </div>

        {saved && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Settings saved successfully! The live site is already updated.</span>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="btn-primary !py-2.5 !px-6 text-sm flex items-center gap-2 disabled:opacity-60"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
