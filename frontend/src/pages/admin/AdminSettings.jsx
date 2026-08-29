import { useEffect, useState } from "react";
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

  if (loading) return <p className="text-brand-muted">Loading...</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-brand-navy mb-6">Website Settings</h1>
      <form onSubmit={handleSave} className="card-surface p-6 space-y-4">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="block text-sm font-semibold text-brand-navy mb-1">{f.label}</label>
            {f.textarea ? (
              <textarea
                rows={2}
                value={form[f.key] || ""}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm"
              />
            ) : (
              <input
                value={form[f.key] || ""}
                placeholder={f.placeholder}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm"
              />
            )}
          </div>
        ))}
        {saved && <p className="text-sm text-brand-success">Settings saved successfully.</p>}
        <button type="submit" disabled={saving} className="btn-primary !py-2 !px-6 text-sm disabled:opacity-60">
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
