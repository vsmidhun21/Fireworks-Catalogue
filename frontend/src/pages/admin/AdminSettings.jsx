import { useEffect, useRef, useState } from "react";
import { Save, CheckCircle2, Loader2, UploadCloud, RotateCcw } from "lucide-react";
import { AdminSettingsService } from "../../services/api";
import { useSettings } from "../../context/SettingsContext";
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
  { key: "announcement_text", label: "Top Announcement Text (optional, shown in the ticker)", textarea: true },
];

const colorFields = [
  { key: "theme_primary_color", label: "Primary Color", hint: "Buttons, links, active states" },
  { key: "theme_secondary_color", label: "Accent / CTA Color", hint: "Call-to-action highlights" },
  { key: "theme_dark_color", label: "Dark / Navy Color", hint: "Header & footer backgrounds" },
  { key: "theme_gold_color", label: "Festive Gold Color", hint: "Badges & festive highlights" },
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
      .then((res) => setForm({ ...DEFAULT_THEME, ...res.data }))
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

  if (loading) {
    return (
      <div className="py-12 text-center text-brand-muted">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-primary" />
        <span>Loading store settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-navy">Website & Business Settings</h1>
        <p className="text-sm text-brand-muted">
          Everything here drives the live website automatically — change the business name, logo, or
          colors below and the header, footer, PDF price list and every page update instantly, with
          zero code changes.
        </p>
      </div>

      {/* ---------- BRANDING ---------- */}
      <div className="card-surface rounded-2xl border border-brand-border/80 p-6 shadow-sm sm:p-8 space-y-6">
        <div>
          <h2 className="font-display text-lg font-bold text-brand-navy">Branding</h2>
          <p className="text-sm text-brand-muted">Your logo and brand colors, used site-wide.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="shrink-0">
            <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-brand-border flex items-center justify-center bg-brand-cream overflow-hidden">
              <img
                src={form.logo_url || liveSettings.logo_url || "/images/logo.png"}
                alt="Current logo"
                className="max-w-full max-h-full object-contain p-2"
              />
            </div>
          </div>
          <div className="flex-1 space-y-2">
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
              PNG or SVG with a transparent background works best, at least 256×256px. Updates
              everywhere immediately: header, footer, admin panel, login screen and the PDF price list.
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
          <p className="text-xs text-brand-muted mt-3">
            Color changes preview live across the site as you pick them. Click "Save Settings" below to
            make them permanent.
          </p>
        </div>
      </div>

      {/* ---------- CONTACT / BUSINESS DETAILS ---------- */}
      <form onSubmit={handleSave} className="card-surface rounded-2xl border border-brand-border/80 p-6 shadow-sm sm:p-8 space-y-5">
        <div>
          <h2 className="font-display text-lg font-bold text-brand-navy">Business & Contact Details</h2>
          <p className="text-sm text-brand-muted">Shown across the header, footer, contact page and PDF price list.</p>
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
      </form>
    </div>
  );
}
