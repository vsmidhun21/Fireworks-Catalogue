import { useEffect, useState } from "react";
import { Save, CheckCircle2, Loader2 } from "lucide-react";
import { AdminSettingsService } from "../../services/api";

const fields = [
  { key: "business_name", label: "Business Name" },
  { key: "phone_primary", label: "Primary Phone" },
  { key: "phone_secondary", label: "Secondary Phone" },
  { key: "whatsapp_number", label: "WhatsApp Number (with country code, no +)", placeholder: "918754066248" },
  { key: "email", label: "Business Email" },
  { key: "address", label: "Address", textarea: true },
  { key: "business_hours", label: "Business Hours" },
  { key: "google_maps_url", label: "Google Maps Embed URL" },
  { key: "facebook_url", label: "Facebook URL" },
  { key: "instagram_url", label: "Instagram URL" },
];

export default function AdminSettings() {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    AdminSettingsService.get()
      .then((res) => setForm(res.data))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await AdminSettingsService.update(form);
      setSaved(true);
    } finally {
      setSaving(false);
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
        <p className="text-sm text-brand-muted">Configure store contact details, addresses, and social links</p>
      </div>

      <form onSubmit={handleSave} className="card-surface rounded-2xl border border-brand-border/80 p-6 shadow-sm sm:p-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {fields.map((f) => (
          <div key={f.key} className={f.textarea ? "md:col-span-2 xl:col-span-3" : ""}>
            <label className="block text-sm font-semibold text-brand-navy mb-1">{f.label}</label>
            {f.textarea ? (
              <textarea
                rows={3}
                value={form[f.key] || ""}
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
            <span>Settings saved successfully!</span>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-5 btn-primary !py-2.5 !px-6 text-sm flex items-center gap-2 disabled:opacity-60"
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
