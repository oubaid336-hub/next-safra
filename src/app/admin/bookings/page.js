"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getApiBaseUrl } from "@/lib/config";

const STATUS_ORDER = { pending: 0, confirmed: 1, cancelled: 2 };

function sortByStatus(items) {
  return [...items].sort((a, b) => (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3));
}

function formatDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

// Guest identity: populated object first, raw id fallback second.
// Not confirmed against real Booking response shape - see plan Section 4.
function getGuestLabel(booking) {
  const candidate = booking.user || booking.guest || booking.customer || booking.userId;
  if (candidate && typeof candidate === "object") {
    if (candidate.name && candidate.email) return `${candidate.name} (${candidate.email})`;
    if (candidate.name) return candidate.name;
    if (candidate.email) return candidate.email;
  }
  const rawId =
    booking.customerId ||
    (typeof booking.userId === "string" ? booking.userId : null) ||
    (typeof booking.user === "string" ? booking.user : null);
  if (rawId) return `Guest ID: ${rawId}`;
  return "Guest info unavailable";
}

// Tries known date field-name pairs in order - not confirmed, same
// caveat as getGuestLabel above.
function getDatesLabel(booking) {
  const pairs = [
    ["checkIn", "checkOut"],
    ["startDate", "endDate"],
    ["dateFrom", "dateTo"],
  ];
  for (const [fromKey, toKey] of pairs) {
    const from = formatDate(booking[fromKey]);
    const to = formatDate(booking[toKey]);
    if (from && to) return `${from} \u2192 ${to}`;
  }
  return null;
}

function getListingType(booking) {
  return booking.listingType === "house" || booking.listingType === "car" ? booking.listingType : null;
}

function getListingId(booking) {
  return booking.listingId || booking.listing || null;
}

export default function AdminBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState(null);
  const [titles, setTitles] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyIds, setBusyIds] = useState({});

  const API = getApiBaseUrl();

  async function fetchListingTitle(booking) {
    const type = getListingType(booking);
    const id = getListingId(booking);
    if (!type || !id) return "Listing unavailable";

    const endpoint = type === "house" ? "houses" : "cars";
    try {
      const res = await fetch(`${API}/api/${endpoint}/${id}`, { credentials: "include" });
      if (!res.ok) return "Listing unavailable";
      const data = await res.json();
      return data.title || "Listing unavailable";
    } catch (err) {
      console.error(`Failed to fetch ${type} ${id} for booking:`, err);
      return "Listing unavailable";
    }
  }

  async function loadAll() {
    try {
      const res = await fetch(`${API}/api/admin/bookings`, { credentials: "include" });

      if (res.status === 401 || res.status === 403) {
        router.replace("/admin/login");
        return;
      }
      if (!res.ok) {
        setError("Something went wrong loading bookings. Please try again.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      const sorted = sortByStatus(data || []);
      setBookings(sorted);

      const titleList = await Promise.all(sorted.map(fetchListingTitle));
      const titleMap = {};
      sorted.forEach((b, i) => { titleMap[b._id] = titleList[i]; });
      setTitles(titleMap);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load bookings:", err);
      setError("Something went wrong loading bookings. Please try again.");
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setBookingStatus(id, action) {
    setBusyIds((prev) => ({ ...prev, [id]: true }));
    setError("");

    try {
      const res = await fetch(`${API}/api/admin/bookings/${id}/${action}`, {
        method: "PUT",
        credentials: "include",
      });

      if (res.status === 401 || res.status === 403) {
        router.replace("/admin/login");
        return;
      }
      if (!res.ok) {
        setError("Something went wrong updating that booking. Please try again.");
        setBusyIds((prev) => ({ ...prev, [id]: false }));
        return;
      }
      await loadAll();
      setBusyIds((prev) => ({ ...prev, [id]: false }));
    } catch (err) {
      console.error(`Failed to ${action} booking ${id}:`, err);
      setError("Something went wrong updating that booking. Please try again.");
      setBusyIds((prev) => ({ ...prev, [id]: false }));
    }
  }

  return (
    <>
      <h1>Manage Bookings</h1>
      <p className="sub">Confirm or cancel bookings submitted by guests.</p>
      <div className="scope-note">Confirm and cancel actions are available here. Guest details may not display for every booking.</div>

      {error && <div id="statusBanner" className="show">{error}</div>}
      {loading && <p id="loadingMsg">Loading bookings...</p>}
      {!loading && bookings && bookings.length === 0 && <p id="emptyMsg">No bookings found.</p>}

      {!loading && bookings && bookings.length > 0 && (
        <div id="bookingsList">
          {bookings.map((booking) => {
            const busy = !!busyIds[booking._id];
            const type = getListingType(booking);
            const price = booking.totalPrice != null ? `$${booking.totalPrice}` : "price n/a";
            const dates = getDatesLabel(booking);
            const bookedOnDate = formatDate(booking.createdAt);

            return (
              <div className="booking-card" key={booking._id}>
                <div className="booking-info">
                  <div className="title">
                    {titles[booking._id] || "Loading..."}
                    {type && <span className="type-tag">{type}</span>}
                  </div>
                  <div className="meta">
                    {[getGuestLabel(booking), dates, price].filter(Boolean).join(" \u00b7 ")}
                  </div>
                  {bookedOnDate && <div className="booked-on">Booked on {bookedOnDate}</div>}
                </div>
                <span className={`status-badge ${booking.status || "pending"}`}>{booking.status || "pending"}</span>
                <div className="booking-actions">
                  <button
                    className="confirm-btn"
                    disabled={busy || booking.status === "confirmed" || booking.status === "cancelled"}
                    onClick={() => setBookingStatus(booking._id, "confirm")}
                  >
                    Confirm
                  </button>
                  <button
                    className="cancel-btn"
                    disabled={busy || booking.status === "cancelled"}
                    onClick={() => setBookingStatus(booking._id, "cancel")}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
