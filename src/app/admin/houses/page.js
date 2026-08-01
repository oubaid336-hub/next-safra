"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getApiBaseUrl } from "@/lib/config";

const STATUS_ORDER = { pending: 0, approved: 1, rejected: 2 };

function sortByStatus(items) {
  return [...items].sort((a, b) => (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3));
}

function buildMeta(item, type) {
  if (type === "house") {
    const price = item.pricePerNight != null ? `$${item.pricePerNight}/night` : "price n/a";
    const rooms = item.rooms != null ? `${item.rooms} rooms` : null;
    const capacity = item.capacity != null ? `sleeps ${item.capacity}` : null;
    return [item.location, price, rooms, capacity].filter(Boolean).join(" - ");
  }
  const price = item.pricePerDay != null ? `$${item.pricePerDay}/day` : "price n/a";
  const year = item.year != null ? `${item.year}` : null;
  const seats = item.seats != null ? `${item.seats} seats` : null;
  const extras = [item.transmission, item.fuelType].filter(Boolean).join("/");
  return [item.location, year, price, seats, extras || null].filter(Boolean).join(" - ");
}

export default function AdminHousesPage() {
  const router = useRouter();
  const [houses, setHouses] = useState(null);
  const [cars, setCars] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyIds, setBusyIds] = useState({});

  const API = getApiBaseUrl();

  async function fetchJson(url) {
    const res = await fetch(url, { credentials: "include" });
    if (res.status === 401 || res.status === 403) {
      router.replace("/admin/login");
      return null;
    }
    if (!res.ok) throw new Error(`Request to ${url} failed with status ${res.status}`);
    return res.json();
  }

  async function loadAll() {
    try {
      const [h, c] = await Promise.all([
        fetchJson(`${API}/api/admin/houses`),
        fetchJson(`${API}/api/admin/cars`),
      ]);
      if (h === null || c === null) return;
      setHouses(h);
      setCars(c);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load listings:", err);
      setError("Something went wrong loading listings. Please try again.");
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setStatus(type, id, action) {
    setBusyIds((prev) => ({ ...prev, [id]: true }));
    setError("");
    const endpointType = type === "house" ? "houses" : "cars";

    try {
      const res = await fetch(`${API}/api/admin/${endpointType}/${id}/${action}`, {
        method: "PUT",
        credentials: "include",
      });

      if (res.status === 401 || res.status === 403) {
        router.replace("/admin/login");
        return;
      }
      if (!res.ok) {
        setError("Something went wrong updating that listing. Please try again.");
        setBusyIds((prev) => ({ ...prev, [id]: false }));
        return;
      }
      await loadAll();
      setBusyIds((prev) => ({ ...prev, [id]: false }));
    } catch (err) {
      console.error(`Failed to ${action} ${type} ${id}:`, err);
      setError("Something went wrong updating that listing. Please try again.");
      setBusyIds((prev) => ({ ...prev, [id]: false }));
    }
  }

  function renderCard(item, type) {
    const busy = !!busyIds[item._id];
    return (
      <div className="admin-listing-card" key={item._id}>
        <div className="admin-listing-thumb">
          {item.photos && item.photos[0] ? (
            <img src={item.photos[0]} alt={item.title || "Listing photo"} />
          ) : (
            "No Photo"
          )}
        </div>
        <div className="admin-listing-info">
          <div className="title">{item.title || "(untitled)"}</div>
          <div className="meta">{buildMeta(item, type)}</div>
        </div>
        <span className={`status-badge ${item.status || "pending"}`}>{item.status || "pending"}</span>
        <div className="listing-actions">
          <button
            className="approve-btn"
            disabled={busy || item.status === "approved"}
            onClick={() => setStatus(type, item._id, "approve")}
          >
            Approve
          </button>
          <button
            className="reject-btn"
            disabled={busy || item.status === "rejected"}
            onClick={() => setStatus(type, item._id, "reject")}
          >
            Reject
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <h1>Manage Houses &amp; Cars</h1>
      <p className="sub">Approve or reject listings submitted by hosts.</p>
      <div className="scope-note">Only approve and reject actions are available here for now.</div>

      {error && <div id="statusBanner" className="show">{error}</div>}
      {loading && <p id="loadingMsg">Loading listings...</p>}

      {!loading && houses && (
        <div>
          <h2 className="admin-section-title first">Houses</h2>
          {houses.length === 0 ? (
            <p className="empty-msg">No houses found.</p>
          ) : (
            sortByStatus(houses).map((h) => renderCard(h, "house"))
          )}
        </div>
      )}

      {!loading && cars && (
        <div>
          <h2 className="admin-section-title">Cars</h2>
          {cars.length === 0 ? (
            <p className="empty-msg">No cars found.</p>
          ) : (
            sortByStatus(cars).map((c) => renderCard(c, "car"))
          )}
        </div>
      )}
    </>
  );
}
