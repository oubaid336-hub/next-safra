"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getApiBaseUrl } from "@/lib/config";

const STATUS_LABELS = {
  pending: "Pending",
  "pending-cash-payment": "Reserved â€” Pay on Arrival",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

const CANCELLABLE_STATUSES = ["pending", "pending-cash-payment", "confirmed"];

export default function MyBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [listings, setListings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  const loadListingsFor = useCallback(async (bookingList) => {
    const API = getApiBaseUrl();
    const unique = new Map();
    bookingList.forEach((b) => {
      const key = `${b.listingType}:${b.listingId}`;
      if (!unique.has(key)) unique.set(key, { listingType: b.listingType, listingId: b.listingId });
    });

    const entries = await Promise.all(
      Array.from(unique.values()).map(async ({ listingType, listingId }) => {
        const path = listingType === "house" ? "houses" : "cars";
        try {
          const res = await fetch(`${API}/api/${path}/${listingId}`, { credentials: "include" });
          if (!res.ok) return [`${listingType}:${listingId}`, null];
          const data = await res.json();
          return [`${listingType}:${listingId}`, data.house || data.car || data];
        } catch {
          return [`${listingType}:${listingId}`, null];
        }
      })
    );

    const map = {};
    entries.forEach(([key, val]) => { map[key] = val; });
    return map;
  }, []);

  const loadBookings = useCallback(async () => {
    const API = getApiBaseUrl();
    try {
      const res = await fetch(`${API}/api/bookings/mine`, { credentials: "include" });

      if (res.status === 401) {
        router.push("/login?redirect=my-bookings");
        return;
      }

      if (!res.ok) throw new Error(`Server responded with ${res.status}`);

      const data = await res.json();
      setBookings(data);

      const listingMap = await loadListingsFor(data);
      setListings(listingMap);
    } catch (err) {
      console.error("Failed to load bookings:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [router, loadListingsFor]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBookings();
  }, [loadBookings]);

  function formatDate(d) {
    if (!d) return "";
    return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function formatPrice(amount) {
    const n = Number(amount) || 0;
    return `$${n.toFixed(2)}`;
  }

  async function handleCancel(booking) {
    if (cancellingId) return;
    const confirmed = window.confirm("Cancel this booking? This can't be undone.");
    if (!confirmed) return;

    setCancellingId(booking._id);
    const API = getApiBaseUrl();

    try {
      const res = await fetch(`${API}/api/bookings/${booking._id}/cancel`, {
        method: "PATCH",
        credentials: "include",
      });

      if (res.status === 401) {
        router.push("/login?redirect=my-bookings");
        return;
      }

      if (res.status === 409) {
        // already cancelled server-side -- just sync local state
        setBookings((prev) => prev.map((b) => (b._id === booking._id ? { ...b, status: "cancelled" } : b)));
        return;
      }

      if (!res.ok) {
        console.error("Cancel failed:", res.status);
        return;
      }

      const updated = await res.json();
      setBookings((prev) => prev.map((b) => (b._id === booking._id ? updated : b)));
    } catch (err) {
      console.error("Cancel request failed:", err);
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <>
      <div className="container listing-header">
        <span className="listing-eyebrow">Your Trips</span>
        <h1>My Bookings</h1>
        <p>Everything you&apos;ve booked with Safra, in one place.</p>
      </div>

      <div className="container">
        {loading ? (
          <div className="listing-grid">
            {Array.from({ length: 3 }).map((_, i) => (
              <div className="skeleton-card" key={i}>
                <div className="skeleton" style={{ aspectRatio: "4/3" }}></div>
                <div style={{ padding: "18px 20px" }}>
                  <div className="skeleton" style={{ height: "16px", width: "70%", marginBottom: "8px", borderRadius: "6px" }}></div>
                  <div className="skeleton" style={{ height: "12px", width: "40%", borderRadius: "6px" }}></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="listing-error">Could not load your bookings right now.</p>
        ) : bookings.length === 0 ? (
          <p className="listing-empty">
            No bookings yet. Browse <Link href="/houses">houses</Link> or <Link href="/cars">cars</Link> to get started.
          </p>
        ) : (
          <div className="bookings-list">
            {bookings.map((booking) => {
              const key = `${booking.listingType}:${booking.listingId}`;
              const listing = listings[key];
              const detailHref = booking.listingType === "house" ? `/houses/${booking.listingId}` : `/cars/${booking.listingId}`;
              const canCancel = CANCELLABLE_STATUSES.includes(booking.status);

              return (
                <div className="booking-card card-style" key={booking._id}>
                  <div className="booking-card-photo">
                    {listing?.photos?.[0] ? (
                      <img src={listing.photos[0]} alt={listing.title || "Listing photo"} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M3 11l9-7 9 7" />
                        <path d="M5 10v10h14V10" />
                      </svg>
                    )}
                  </div>

                  <div className="booking-card-body">
                    <div className="booking-card-top">
                      <Link href={detailHref} className="booking-card-title">
                        {listing?.title || "Listing"}
                      </Link>
                      <span className={`booking-status booking-status-${booking.status}`}>
                        {STATUS_LABELS[booking.status] || booking.status}
                      </span>
                    </div>

                    {listing?.location && <p className="booking-card-location">{listing.location}</p>}

                    <p className="booking-card-dates">
                      {formatDate(booking.startDate)} – {formatDate(booking.endDate)}
                    </p>

                    <p className="booking-card-total">
                      {formatPrice(booking.totalPrice)}
                      {booking.promoApplied && <span className="promo-badge"> (10% promo applied)</span>}
                    </p>

                    <div className="booking-card-actions">
                      {booking.status === "pending" && (
                        <Link href={`/payment?bookingId=${booking._id}`} className="btn btn-terracotta">
                          Finish Payment
                        </Link>
                      )}
                      {canCancel && (
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => handleCancel(booking)}
                          disabled={cancellingId === booking._id}
                        >
                          {cancellingId === booking._id ? "Cancellingâ€¦" : "Cancel Booking"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        .bookings-list { display: grid; gap: 1.25rem; padding-bottom: 3rem; }
        .booking-card { display: grid; grid-template-columns: 140px 1fr; gap: 1.25rem; padding: 1rem; }
        @media (max-width: 560px) { .booking-card { grid-template-columns: 1fr; } }
        .booking-card-photo { aspect-ratio: 4/3; border-radius: 10px; overflow: hidden; background: var(--safra-navy); display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.4); }
        .booking-card-photo svg { width: 32px; height: 32px; }
        .booking-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem; }
        .booking-card-title { font-family: 'Playfair Display', serif; color: var(--safra-navy); font-size: 1.1rem; font-weight: 600; }
        .booking-card-location { opacity: 0.7; font-family: 'Inter', sans-serif; font-size: 0.9rem; margin-top: 0.15rem; }
        .booking-card-dates { font-family: 'Inter', sans-serif; margin-top: 0.5rem; }
        .booking-card-total { font-family: 'Inter', sans-serif; font-weight: 600; margin-top: 0.25rem; }
        .promo-badge { font-weight: 400; opacity: 0.7; font-size: 0.85rem; }
        .booking-status { font-family: 'Inter', sans-serif; font-size: 0.78rem; font-weight: 600; padding: 0.25rem 0.6rem; border-radius: 999px; white-space: nowrap; }
        .booking-status-pending { background: #fff6e5; color: #8a5b00; }
        .booking-status-pending-cash-payment { background: #eaf3ff; color: #1a5aa6; }
        .booking-status-confirmed { background: #eaf6ee; color: #1f6b3a; }
        .booking-status-cancelled { background: rgba(0,0,0,0.06); color: rgba(0,0,0,0.5); }
        .booking-card-actions { display: flex; gap: 0.75rem; margin-top: 0.85rem; flex-wrap: wrap; }
        .btn-outline { background: transparent; border: 1px solid rgba(0,0,0,0.2); }
      `}</style>
    </>
  );
}
