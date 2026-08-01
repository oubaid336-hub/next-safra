"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getApiBaseUrl } from "@/lib/config";

export default function AdminSupportSettingsPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    supportEmail: "",
    supportPhone: "",
    supportHours: "",
    whatsappNumber: "",
  });
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const API = getApiBaseUrl();

  async function loadSettings() {
    try {
      const res = await fetch(`${API}/api/admin/support-settings`, { credentials: "include" });

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
        supportEmail: settings.supportEmail || "",
        supportPhone: settings.supportPhone || "",
        supportHours: settings.supportHours || "",
        whatsappNumber: settings.whatsappNumber || "",
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
      await fetch(`${API}/api/admin/support-settings`, {
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
      <h1>Support Settings</h1>
      {status && <div id="status">{status}</div>}
      <form id="settings-form" onSubmit={handleSubmit}>
        <label>Support Email</label>
        <input
          type="email"
          value={form.supportEmail}
          onChange={(e) => updateField("supportEmail", e.target.value)}
        />
        <label>Support Phone</label>
        <input
          type="text"
          value={form.supportPhone}
          onChange={(e) => updateField("supportPhone", e.target.value)}
        />
        <label>Support Hours</label>
        <input
          type="text"
          placeholder="e.g. Mon-Fri 9am-6pm"
          value={form.supportHours}
          onChange={(e) => updateField("supportHours", e.target.value)}
        />
        <label>WhatsApp Number</label>
        <input
          type="text"
          value={form.whatsappNumber}
          onChange={(e) => updateField("whatsappNumber", e.target.value)}
        />
        <button type="submit" id="save-btn" disabled={saving}>
          Save
        </button>
      </form>
    </>
  );
}
