"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getApiBaseUrl } from "@/lib/config";

function BookingContent() {
  const searchParams = useSearchParams();
  const houseId = searchParams.get("houseId");
  const carId = searchParams.get("carId");
  const listingType = houseId ? "house" : carId ? "car" : null;
  const id = houseId || carId;

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [listing, setListing] = useState(null);
  const [bookedRanges, setBookedRanges] = useState([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateWarning, setDateWarning] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState(null);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!id || !listingType) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      setNotFound(true);
      return;
    }
    let cancelled = false;
    const API = getApiBaseUrl();

    async function loadListing() {
      try {
        const res = await fetch(`${API}/api/${listingType}s/${id}`, { credentials: "include" });
        if (!res.ok) throw new Error(`Server responded with ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setListing(data[listingType] || data);
        setLoading(false);
      } catch (err) {
        console.error(`Failed to load ${listingType}:`, err);
        if (!cancelled) {
          setNotFound(true);
          setLoading(false);
        }
      }
    }

    async function loadAvailability() {
      try {
        const res = await fetch(
          `${API}/api/bookings/availability?listingId=${id}&listingType=${listingType}`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setBookedRanges(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load availability:", err);
      }
    }

    loadListing();
    loadAvailability();
    return () => {
      cancelled = true;
    };
  }, [id, listingType]);

  function unitsBetween(startStr, endStr) {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const msPerUnit = 1000 * 60 * 60 * 24;
    return Math.round((end - start) / msPerUnit);
  }

  function findConflict(start, end) {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    return bookedRanges.find(
      (r) => startTime < new Date(r.endDate).getTime() && endTime > new Date(r.startDate).getTime()
    );
  }

  function conflictMessage(conflict) {
    const isConfirmed = conflict.status === "confirmed" || conflict.status === "pending-cash-payment";
    return isConfirmed
      ? "Those dates are already booked. Please choose different dates."
      : "Those dates have a pending booking under review \u2014 try different dates or check back shortly.";
  }

  function formatPrice(amount) {
    return `$${amount.toFixed(2)}`;
  }

  useEffect(() => {
    if (!startDate || !endDate || !listing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDateWarning("");
      return;
    }
    const units = unitsBetween(startDate, endDate);
    if (units <= 0) {
      setDateWarning(
        listingType === "house" ? "Check-out must be after check-in." : "Return date must be after pickup date."
      );
      return;
    }
    const conflict = findConflict(startDate, endDate);
    if (conflict) {
      setDateWarning(conflictMessage(conflict));
      return;
    }
    setDateWarning("");
  }, [startDate, endDate, listing, bookedRanges, listingType]);

  const rawPrice =
    listingType === "car"
      ? listing?.pricePerDay ?? listing?.pricePerNight
      : listing?.pricePerNight ?? listing?.pricePerDay;
  const unitPrice = Number(rawPrice) || 0;
  const units = startDate && endDate ? unitsBetween(startDate, endDate) : 0;
  const showBreakdown = startDate && endDate && listing && units > 0 && !dateWarning;
  const total = units * unitPrice;

  async function handleSubmit(e) {
    e.preventDefault();
    setFormMessage(null);

    if (!startDate || !endDate) {
      setFormMessage({
        type: "error",
        text:
          listingType === "house"
            ? "Please choose a check-in and check-out date."
            : "Please choose a pickup and return date.",
      });
      return;
    }

    if (unitsBetween(startDate, endDate) <= 0 || dateWarning) {
      // Already surfaced above the button by the effect above — don't show it twice.
      return;
    }

    setSubmitting(true);
    const API = getApiBaseUrl();

    try {
      const res = await fetch(`${API}/api/bookings`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: id,
          listingType,
          startDate,
          endDate,
        }),
      });

      if (res.status === 401) {
        const redirectTarget = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.assign(`/login?redirect=${redirectTarget}`);
        return;
      }

      if (res.status === 403) {
        const data = await safeJson(res);
        setFormMessage({
          type: "warning",
          text:
            data.message ||
            "Please verify your email before booking. Check your inbox for the verification link.",
        });
        return;
      }

      if (res.status === 409) {
        const data = await safeJson(res);
        setFormMessage({
          type: "warning",
          text: data.message || "Those dates were just booked by someone else. Please choose different dates.",
        });
        const availRes = await fetch(
          `${API}/api/bookings/availability?listingId=${id}&listingType=${listingType}`
        );
        if (availRes.ok) {
          const availData = await availRes.json();
          setBookedRanges(Array.isArray(availData) ? availData : []);
        }
        return;
      }

      if (!res.ok) {
        const data = await safeJson(res);
        setFormMessage({ type: "error", text: data.message || "Something went wrong. Please try again." });
        return;
      }

      const booking = await safeJson(res);
      if (booking && booking._id) {
        window.location.assign(`/payment?bookingId=${booking._id}`);
        return;
      }
      setFormMessage({
        type: "warning",
        text: "Booking created, but something went wrong loading payment options. Check My Bookings.",
      });
    } catch (err) {
      console.error("Booking submission failed:", err);
      setFormMessage({ type: "error", text: "Could not reach the server. Please check your connection and try again." });
    } finally {
      setSubmitting(false);
    }
  }

  async function safeJson(res) {
    try {
      return await res.json();
    } catch {
      return {};
    }
  }

  const isHouse = listingType === "house";
  const startLabel = isHouse ? "Check-in" : "Pickup date";
  const endLabel = isHouse ? "Check-out" : "Return date";
  const unitLabel = isHouse ? "Nights" : "Days";
  const unitPriceLabel = isHouse ? "Price per night" : "Price per day";
  const heading = isHouse ? "Complete Your Booking" : "Complete Your Car Booking";
  const browseHref = isHouse ? "/houses" : "/cars";
  const browseLabel = isHouse ? "Browse Houses" : "Browse Cars";

  return (
    <main className="booking-page">
      <h1>{heading}</h1>

      {loading && <div id="loadingState">Loading {listingType || "listing"} details...</div>}

      {!loading && (notFound || !listing) && (
        <div id="notFoundState">
          <p>We couldn&apos;t find that listing. It may have been removed or the link is incorrect.</p>
          <a href={browseHref} className="btn btn-terracotta">{browseLabel}</a>
        </div>
      )}

      {!loading && !notFound && listing && (
        <div className="booking-layout" id="bookingLayout" style={{ display: "grid" }}>
          <section className="listing-summary card-style">
            {listing.photos && listing.photos.length > 0 ? (
              <img src={listing.photos[0]} alt={listing.title || `${listingType} photo`} />
            ) : (
              <img src="" alt="No photo available yet" />
            )}
            <h2>{listing.title || "Untitled listing"}</h2>
            <p className="location">{listing.location || ""}</p>
            <p>{listing.description || ""}</p>
          </section>

          <section className="card-style">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="startDate">{startLabel}</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  min={today}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="endDate">{endLabel}</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  min={today}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>

              {dateWarning && <div className="form-message warning">{dateWarning}</div>}

              {showBreakdown && (
                <div id="priceBreakdown">
                  <div className="price-line">
                    <span>{unitPriceLabel}</span>
                    <span>{formatPrice(unitPrice)}</span>
                  </div>
                  <div className="price-line">
                    <span>{unitLabel}</span>
                    <span>{units}</span>
                  </div>
                  <div className="price-line total">
                    <span>Estimated total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <p style={{ fontSize: "0.8rem", opacity: 0.65, fontFamily: "'Inter', sans-serif" }}>
                    Final total is calculated by the server when you submit - this is an estimate.
                  </p>
                </div>
              )}

              <button type="submit" className="btn btn-terracotta" id="submitBtn" disabled={submitting || !!dateWarning}>
                {submitting ? "Submitting\u2026" : "Request Booking"}
              </button>

              {formMessage && <div className={`form-message ${formMessage.type}`}>{formMessage.text}</div>}
            </form>
          </section>
        </div>
      )}

      <style jsx>{`
        .booking-page {
          max-width: 960px;
          margin: 0 auto;
          padding: 2rem 1.25rem 4rem;
        }
        .booking-page h1 { color: var(--safra-navy); }

        .booking-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }
        @media (min-width: 800px) {
          .booking-layout { grid-template-columns: 1fr 1fr; align-items: start; }
        }

        .listing-summary img {
          width: 100%;
          aspect-ratio: 4 / 3;
          object-fit: cover;
          border-radius: 12px;
          background: var(--safra-navy);
        }
        .listing-summary h2 {
          margin-top: 1rem;
          font-family: 'Playfair Display', serif;
          color: var(--safra-navy);
        }
        .listing-summary .location { opacity: 0.75; margin-top: 0.25rem; }

        .price-line {
          display: flex;
          justify-content: space-between;
          padding: 0.4rem 0;
          font-family: 'Inter', sans-serif;
        }
        .price-line.total {
          border-top: 1px solid rgba(0, 0, 0, 0.12);
          margin-top: 0.5rem;
          padding-top: 0.75rem;
          font-weight: 600;
          font-size: 1.1rem;
        }

        .form-group { margin-bottom: 1.25rem; }
        .form-group label {
          display: block;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          margin-bottom: 0.4rem;
        }
        .form-group input {
          width: 100%;
          padding: 0.65rem 0.75rem;
          border: 1px solid rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 1rem;
        }

        .form-message {
          margin-top: 1rem;
          padding: 0.85rem 1rem;
          border-radius: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 0.95rem;
        }
        .form-message.error {
          background: #fdeceb;
          color: #9c2b21;
          border: 1px solid #f3c2bd;
        }
        .form-message.success {
          background: #eaf6ee;
          color: #1f6b3a;
          border: 1px solid #bfe3c9;
        }
        .form-message.warning {
          background: #fff6e5;
          color: #8a5b00;
          border: 1px solid #f2d998;
        }

        #loadingState, #notFoundState {
          text-align: center;
          padding: 3rem 1rem;
          font-family: 'Inter', sans-serif;
          opacity: 0.75;
        }
      `}</style>
    </main>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="booking-page"><p>Loading...</p></div>}>
      <BookingContent />
    </Suspense>
  );
}