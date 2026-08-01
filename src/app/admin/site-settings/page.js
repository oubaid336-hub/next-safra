"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getApiBaseUrl } from "@/lib/config";

export default function AdminSiteSettingsPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    siteName: "Safra",
    logoText: "S",
    currency: "TND",
    maintenanceMode: false,
  });
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const API = getApiBaseUrl();

  async function loadSettings() {
    try {
      const res = await fetch(`${API}/api/admin/site-settings`, { credentials: "include" });

      if (res.status === 401 || res.status === 403) {
        router.replace("/admin/login");
        return;
      }
      if (!res.ok) {
        setStatus("Failed to load settings.");
        setLoading(false);
        return;
      }

      const settings = await res.json();
      setForm({
        siteName: settings.siteName || "Safra",
        logoText: settings.logoText || "S",
        currency: settings.currency || "TND",
        maintenanceMode: !!settings.maintenanceMode,
      });
      setLoading(false);
    } catch (err) {
      setStatus("Failed to load settings.");
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setStatus("");
    try {
      await fetch(`${API}/api/admin/site-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      setStatus("Saved.");
    } catch (err) {
      setStatus("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <>
      <h1>Site Settings</h1>
      {status && <div id="status">{status}</div>}
      <form id="settings-form" onSubmit={handleSubmit}>
        <label>Site Name</label>
        <input
          type="text"
          value={form.siteName}
          onChange={(e) => updateField("siteName", e.target.value)}
        />

        <label>Logo Badge Letter</label>
        <input
          type="text"
          maxLength={2}
          value={form.logoText}
          onChange={(e) => updateField("logoText", e.target.value)}
        />
        <div id="badge-preview">
          <span id="badge-letter">{form.logoText || "S"}</span>
        </div>

        <label>Currency</label>
        <select value={form.currency} onChange={(e) => updateField("currency", e.target.value)}>
          <option value="USD">USD ($)</option>
          <option value="EUR">EUR (€)</option>
          <option value="TND">Dinar Tunisien (TND)</option>
        </select>

        <div className="checkbox-row">
          <input
            type="checkbox"
            checked={form.maintenanceMode}
            onChange={(e) => updateField("maintenanceMode", e.target.checked)}
          />
          <label style={{ margin: 0 }}>Maintenance Mode</label>
        </div>

        <button type="submit" id="save-btn" disabled={saving}>
          Save
        </button>
      </form>
    </>
  );
}
