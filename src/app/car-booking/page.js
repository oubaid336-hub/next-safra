"use client";

import Link from "next/link";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { getApiBaseUrl } from "@/lib/config";

function CarBookingContent() {
  const searchParams = useSearchParams();
  const carId = searchParams.get("carId");

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [car, setCar] = useState(null);
  const [bookedRanges, setBookedRanges] = useState([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [priceBreakdown, setPriceBreakdown] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState({ text: "", type: "" });

  const today = new Date().toISOString().split("T")[0];

  const loadCar = useCallback(async (id) => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/cars/${id}`, { credentials: "include" });
      if (!res.ok) {
        setNotFound(true);
        return;
      }
      const data = await res.json();
      setCar(data.car || data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load car:", err);
      setNotFound(true);
    }
  }, []);

  const loadAvailability = useCallback(async (id) => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/bookings/availability?listingId=${id}&listingType=car`);
      if (!res.ok) return;
      const data = await res.json();
      setBookedRanges(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load availability:", err);
    }
  }, []);

  useEffect(() => {
    if (!carId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      setNotFound(true);
      return;
    }
    loadCar(carId);
    loadAvailability(carId);
  }, [carId, loadCar, loadAvailability]);

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

  function nightsBetween(startStr, endStr) {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const msPerNight = 1000 * 60 * 60 * 24;
    return Math.round((end - start) / msPerNight);
  }

  function formatPrice(amount) {
    return `$${amount.toFixed(2)}`;
  }

  function handleDatesChanged(newStart, newEnd) {
    if (!newStart || !newEnd || !car) {
      setPriceBreakdown(null);
      return;
    }

    const days = nightsBetween(newStart, newEnd);

    if (days <= 0) {
      setPriceBreakdown(null);
      setFormMessage({ text: "Return date must be after pickup date.", type: "warning" });
      return;
    }

    const conflict = findConflict(newStart, newEnd);
    if (conflict) {
      setPriceBreakdown(null);
      setFormMessage({ text: conflictMessage(conflict), type: "warning" });
      return;
    }

    setFormMessage({ text: "", type: "" });

    const pricePerDay = Number(car.pricePerDay) || 0;
    const total = days * pricePerDay;
    setPriceBreakdown({ pricePerDay, days, total });
  }

  function onStartDateChange(e) {
    const v = e.target.value;
    setStartDate(v);
    handleDatesChanged(v, endDate);
  }

  function onEndDateChange(e) {
    const v = e.target.value;
    setEndDate(v);
    handleDatesChanged(startDate, v);
  }

  async function safeJson(res) {
    try {
      return await res.json();
    } catch {
      return {};
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!startDate || !endDate) {
      setFormMessage({ text: "Please choose a pickup and return date.", type: "error" });
      return;
    }

    if (nightsBetween(startDate, endDate) <= 0 || formMessage.type === "warning") {
      // Already surfaced by handleDatesChanged — don't show it twice.
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/bookings`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: carId, listingType: "car", startDate, endDate }),
      });

      if (res.status === 401) {
        const redirectTarget = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login?redirect=${redirectTarget}`;
        return;
      }

      if (res.status === 403) {
        const data = await safeJson(res);
        setFormMessage({
          text: data.message || "Please verify your email before booking. Check your inbox for the verification link.",
          type: "warning",
        });
        return;
      }

      if (res.status === 409) {
        const data = await safeJson(res);
        setFormMessage({
          text: data.message || "Those dates were just booked by someone else. Please choose different dates.",
          type: "warning",
        });
        await loadAvailability(carId);
        return;
      }

      if (!res.ok) {
        const data = await safeJson(res);
        setFormMessage({ text: data.message || "Something went wrong. Please try again.", type: "error" });
        return;
      }

      const booking = await safeJson(res);
      if (booking && booking._id) {
        window.location.href = `/payment?bookingId=${booking._id}`;
        return;
      }
      setFormMessage({ text: "Booking created, but something went wrong loading payment options. Check My Bookings.", type: "warning" });
    } catch (err) {
      console.error("Booking submission failed:", err);
      setFormMessage({ text: "Could not reach the server. Please check your connection and try again.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="booking-page">
      <h1>Complete Your Booking</h1>

      {loading && <div id="loading-state">Loading car details...</div>}

      {!loading && notFound && (
        <div id="not-found-state" style={{ display: "block" }}>
          <p>We couldn&apos;t find that listing. It may have been removed or the link is incorrect.</p>
          <Link href="/cars" className="btn btn-terracotta">Browse Cars</Link>
        </div>
      )}

      {!loading && !notFound && car && (
        <div className="booking-layout" id="booking-layout" style={{ display: "grid" }}>
          <section className="house-summary card-style">
            <img id="car-photo" src={car.photos?.[0] || ""} alt={car.title || "Car photo"} />
            <h2 id="car-title">{car.title || "Untitled listing"}</h2>
            <p className="location" id="car-location">{car.location || ""}</p>
            <p className="specs" id="car-specs">
              {[car.seats ? `${car.seats} seats` : null, car.transmission || null, car.year || null]
                .filter(Boolean)
                .join(" \u00b7 ")}
            </p>
            <p id="car-description">{car.description || ""}</p>
          </section>

          <section className="card-style">
            <form id="booking-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="start-date">Pickup</label>
                <input type="date" id="start-date" name="startDate" required min={today} value={startDate} onChange={onStartDateChange} />
              </div>

              <div className="form-group">
                <label htmlFor="end-date">Return</label>
                <input type="date" id="end-date" name="endDate" required min={today} value={endDate} onChange={onEndDateChange} />
              </div>

              {priceBreakdown && (
                <div id="price-breakdown">
                  <div className="price-line">
                    <span>Price per day</span>
                    <span>{formatPrice(priceBreakdown.pricePerDay)}</span>
                  </div>
                  <div className="price-line">
                    <span>Days</span>
                    <span>{priceBreakdown.days}</span>
                  </div>
                  <div className="price-line total">
                    <span>Estimated total</span>
                    <span>{formatPrice(priceBreakdown.total)}</span>
                  </div>
                  <p style={{ fontSize: "0.8rem", opacity: 0.65, fontFamily: "'Inter',sans-serif" }}>
                    Final total is calculated by the server when you submit - this is an estimate.
                  </p>
                </div>
              )}

              <button type="submit" className="btn btn-terracotta" id="submit-btn" disabled={submitting || formMessage.type === "warning"}>
                {submitting ? "Submitting\u2026" : "Request Booking"}
              </button>

              {formMessage.text && (
                <div id="form-message" className={`form-message ${formMessage.type}`}>{formMessage.text}</div>
              )}
            </form>
          </section>
        </div>
      )}

      <style jsx>{`
        .booking-page { max-width: 960px; margin: 0 auto; padding: 2rem 1.25rem 4rem; }
        .booking-page h1 { color: var(--safra-navy); }
        .booking-layout { display: grid; grid-template-columns: 1fr; gap: 2rem; }
        @media (min-width: 800px) { .booking-layout { grid-template-columns: 1fr 1fr; align-items: start; } }
        .house-summary img { width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 12px; background: var(--safra-navy); }
        .house-summary h2 { margin-top: 1rem; font-family: 'Playfair Display', serif; color: var(--safra-navy); }
        .house-summary .location { opacity: 0.75; margin-top: 0.25rem; }
        .house-summary .specs { opacity: 0.75; margin-top: 0.15rem; font-family: 'Inter', sans-serif; font-size: 0.9rem; }
        .price-line { display: flex; justify-content: space-between; padding: 0.4rem 0; font-family: 'Inter', sans-serif; }
        .price-line.total { border-top: 1px solid rgba(0,0,0,0.12); margin-top: 0.5rem; padding-top: 0.75rem; font-weight: 600; font-size: 1.1rem; }
        .form-group { margin-bottom: 1.25rem; }
        .form-group label { display: block; font-family: 'Inter', sans-serif; font-weight: 600; margin-bottom: 0.4rem; }
        .form-group input { width: 100%; padding: 0.65rem 0.75rem; border: 1px solid rgba(0,0,0,0.2); border-radius: 8px; font-family: 'Inter', sans-serif; font-size: 1rem; }
        .form-message { margin-top: 1rem; padding: 0.85rem 1rem; border-radius: 8px; font-family: 'Inter', sans-serif; font-size: 0.95rem; }
        .form-message.error { background: #fdeceb; color: #9c2b21; border: 1px solid #f3c2bd; }
        .form-message.success { background: #eaf6ee; color: #1f6b3a; border: 1px solid #bfe3c9; }
        .form-message.warning { background: #fff6e5; color: #8a5b00; border: 1px solid #f2d998; }
        #loading-state, #not-found-state { text-align: center; padding: 3rem 1rem; font-family: 'Inter', sans-serif; opacity: 0.75; }
      `}</style>
    </main>
  );
}

export default function CarBookingPage() {
  return (
    <Suspense fallback={<div id="loading-state">Loading car details...</div>}>
      <CarBookingContent />
    </Suspense>
  );
}