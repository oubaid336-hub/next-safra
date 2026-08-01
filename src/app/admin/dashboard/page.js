"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getApiBaseUrl } from "@/lib/config";

function formatLabel(key) {
  const withSpaces = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  return withSpaces.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const API = getApiBaseUrl();
    async function loadDashboard() {
      try {
        const res = await fetch(`${API}/api/admin/dashboard`, { credentials: "include" });

        if (res.status === 401 || res.status === 403) {
          router.replace("/admin/login");
          return;
        }
        if (!res.ok) {
          setError("Something went wrong loading the dashboard. Please try again.");
          setLoading(false);
          return;
        }
        const json = await res.json();
        setData(json);
        setLoading(false);
      } catch (err) {
        setError("Something went wrong loading the dashboard. Please try again.");
        setLoading(false);
      }
    }
    loadDashboard();
  }, [router]);

  const keys = data ? Object.keys(data) : [];

  return (
    <>
      <h1>Dashboard</h1>
      <p className="sub">Overview of what&apos;s happening on Safra right now.</p>

      {error && <div id="statusBanner" className="show">{error}</div>}
      {loading && <p id="loadingMsg">Loading stats...</p>}
      {!loading && !error && keys.length === 0 && <p id="emptyMsg">No stats returned by the server.</p>}

      {!loading && !error && keys.length > 0 && (
        <div id="statsGrid">
          {keys.map((key) => {
            const value = data[key];

            if (isPlainObject(value)) {
              const subKeys = Object.keys(value);
              return (
                <div className="stat-card nested" key={key}>
                  <div className="stat-label group-label">{formatLabel(key)}</div>
                  {subKeys.map((subKey) => (
                    <div key={subKey}>
                      <div className="stat-value" style={{ fontSize: "22px" }}>{value[subKey]}</div>
                      <div className="stat-label">{formatLabel(subKey)}</div>
                    </div>
                  ))}
                </div>
              );
            }

            if (Array.isArray(value)) {
              return (
                <div className="stat-card" key={key}>
                  <div className="stat-value">{value.length}</div>
                  <div className="stat-label">{formatLabel(key)} (list)</div>
                </div>
              );
            }

            return (
              <div className="stat-card" key={key}>
                <div className="stat-value">{String(value)}</div>
                <div className="stat-label">{formatLabel(key)}</div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
