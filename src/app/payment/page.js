"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getApiBaseUrl } from "@/lib/config";

function PaymentContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");

  const [status, setStatus] = useState(bookingId ? "idle" : "noBooking");
  const [summary, setSummary] = useState(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!bookingId) return;
    let cancelled = false;
    const API = getApiBaseUrl();

    async function loadBookingSummary() {
      try {
        const res = await fetch(`${API}/api/bookings/${bookingId}`, { credentials: "include" });
        if (!res.ok) return;
        const booking = await res.json();

        const endpoint = booking.listingType === "car" ? "cars" : "houses";
        const listingRes = await fetch(`${API}/api/${endpoint}/${booking.listingId}`, {
          credentials: "include",
        });
        const listing = listingRes.ok ? await listingRes.json() : null;

        const opts = { month: "short", day: "numeric", year: "numeric" };
        const start = new Date(booking.startDate).toLocaleDateString(undefined, opts);
        const end = new Date(booking.endDate).toLocaleDateString(undefined, opts);

        if (cancelled) return;
        setSummary({
          title: listing?.title || "Your booking",
          dates: `${start} \u2013 ${end}`,
          price: `$${Number(booking.totalPrice).toFixed(2)} total`,
        });
      } catch (err) {
        console.error("Could not load booking summary:", err);
      }
    }

    loadBookingSummary();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  async function confirmBooking(method) {
    if (method !== "arrival" || !bookingId) return;

    setConfirming(true);
    const API = getApiBaseUrl();

    try {
      const res = await fetch(`${API}/api/bookings/${bookingId}/confirm-cash`, {
        method: "PATCH",
        credentials: "include",
      });

      if (!res.ok) {
        setConfirming(false);
        alert("Something went wrong confirming your booking. Please try again.");
        return;
      }

      setStatus("confirmed");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setConfirming(false);
      alert("Could not reach the server. Please check your connection and try again.");
    }
  }

  const showGridAndStrip = status === "idle";
  const confirmTitle = status === "noBooking" ? "No booking found" : "Booking confirmed";
  const confirmText =
    status === "noBooking"
      ? "We could not find a booking to pay for. Please start a new booking from a listing page."
      : "We've reserved your booking. Bring cash to pay the full amount when you arrive \u2014 see you soon!";

  return (
    <>
      <div className="pay-header">
        <h1>Choose how to pay</h1>
        <p>Choose how you&apos;d like to pay below — no hidden charges, ever. You&apos;ll get a confirmation once it&apos;s approved.</p>
      </div>

      {summary && (
        <div className="booking-summary">
          <div className="summary-label">Booking summary</div>
          <div className="summary-title">{summary.title}</div>
          <div className="summary-row">
            <span>{summary.dates}</span>
            <span className="summary-price">{summary.price}</span>
          </div>
        </div>
      )}

      {showGridAndStrip && (
        <div className="trust-strip">
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Secure &amp; encrypted
          </span>
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            No hidden fees
          </span>
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Instant confirmation
          </span>
        </div>
      )}

      {showGridAndStrip && (
        <div className="pay-grid">
          <div className="pay-card recommended">
            <div className="pay-badge">Available now</div>
            <div className="pay-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            </div>
            <h3>Pay on arrival</h3>
            <p>Reserve now, pay in cash when you check in or pick up. No card needed, no online payment required.</p>
            <div className="price-note">100% due on arrival</div>
            <button
              type="button"
              className="pay-btn primary"
              onClick={() => confirmBooking("arrival")}
              disabled={confirming}
            >
              {confirming ? "Confirming\u2026" : "Confirm booking"}
            </button>
          </div>

          <div className="pay-card">
            <div className="pay-badge soon">Coming soon</div>
            <div className="pay-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <h3>Pay 25% deposit</h3>
            <p>Secure your booking with a small deposit by card now, pay the remaining 75% in cash on arrival.</p>
            <div className="price-note">25% now, 75% on arrival</div>
            <button type="button" className="pay-btn disabled" disabled>Coming soon</button>
          </div>

          <div className="pay-card">
            <div className="pay-badge soon">Coming soon</div>
            <div className="pay-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/><line x1="6" y1="15" x2="9" y2="15"/></svg>
            </div>
            <h3>Pay in full by card</h3>
            <p>Pay your entire booking online by card in one step, secured by Stripe.</p>
            <div className="price-note">100% now, securely by card</div>
            <button type="button" className="pay-btn disabled" disabled>Coming soon</button>
          </div>
        </div>
      )}

      {!showGridAndStrip && (
        <div className="pay-confirm show">
          <div className="check">✓</div>
          <h2>{confirmTitle}</h2>
          <p>{confirmText}</p>
        </div>
      )}

      <style jsx>{`
        .pay-header { margin-top: 24px; padding: 24px 0 8px; text-align: center; }
        .pay-header h1 {
          font-family: 'Playfair Display', serif; font-weight: 800; font-size: 2rem;
          color: var(--safra-navy); margin-bottom: 8px;
        }
        .pay-header p { color: var(--safra-gray); max-width: 480px; margin: 0 auto; }

        .booking-summary {
          max-width: 560px; margin: 0 auto 32px; background: #fff; border-radius: 16px;
          padding: 20px 24px; box-shadow: 0 6px 18px rgba(15,23,42,.08);
        }
        .summary-label { font-family: 'Inter', sans-serif; font-size: 13px; color: var(--safra-gray); margin-bottom: 4px; }
        .summary-title {
          font-family: 'Playfair Display', serif; font-weight: 700; color: var(--safra-navy);
          font-size: 1.15rem; margin-bottom: 8px;
        }
        .summary-row {
          font-family: 'Inter', sans-serif; font-size: 14px; color: var(--safra-gray);
          display: flex; justify-content: space-between; margin-bottom: 4px;
        }
        .summary-price { font-weight: 700; color: var(--safra-terracotta); }

        .trust-strip {
          display: flex; flex-wrap: wrap; justify-content: center; gap: 24px;
          padding: 20px 0 40px; color: var(--safra-gray); font-size: 13px;
        }
        .trust-strip span { display: flex; align-items: center; gap: 6px; }
        .trust-strip svg { width: 16px; height: 16px; color: var(--safra-terracotta); flex-shrink: 0; }

        .pay-grid { display: grid; grid-template-columns: 1fr; gap: 20px; padding-bottom: 80px; }
        @media (min-width: 860px) { .pay-grid { grid-template-columns: repeat(3, 1fr); } }

        .pay-card {
          position: relative; background: #fff; border-radius: 18px; padding: 28px 24px;
          box-shadow: 0 6px 18px rgba(15,23,42,.08); border: 2px solid transparent;
          display: flex; flex-direction: column;
        }
        .pay-card.recommended { border-color: var(--safra-terracotta); }
        .pay-badge {
          position: absolute; top: -12px; left: 24px; background: var(--safra-terracotta); color: #fff;
          font-size: 11px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
          padding: 5px 12px; border-radius: 999px;
        }
        .pay-badge.soon { background: var(--safra-navy); }
        .pay-icon {
          width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
          background: var(--safra-sandlight); color: var(--safra-navy); margin-bottom: 16px;
        }
        .pay-card h3 { font-family: 'Playfair Display', serif; font-weight: 700; color: var(--safra-navy); font-size: 1.2rem; margin-bottom: 8px; }
        .pay-card p { color: var(--safra-gray); font-size: 14px; line-height: 1.5; margin-bottom: 20px; flex: 1; }
        .pay-card .price-note { font-size: 13px; font-weight: 600; color: var(--safra-terracotta); margin-bottom: 16px; }
        .pay-btn {
          width: 100%; padding: 12px; border-radius: 10px; font-weight: 600; font-size: 14px;
          text-align: center; cursor: pointer; border: none; font-family: 'Inter', sans-serif;
        }
        .pay-btn.primary { background: var(--safra-terracotta); color: #fff; }
        .pay-btn.primary:hover { opacity: .92; }
        .pay-btn.disabled { background: var(--safra-sandlight); color: var(--safra-graylight); cursor: not-allowed; }

        .pay-confirm {
          max-width: 560px; margin: 0 auto 80px; background: #fff; border-radius: 18px;
          padding: 32px; text-align: center; box-shadow: 0 6px 18px rgba(15,23,42,.08);
        }
        .pay-confirm .check {
          width: 56px; height: 56px; border-radius: 50%; background: var(--safra-terracotta); color: #fff;
          font-size: 26px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;
        }
        .pay-confirm h2 { font-family: 'Playfair Display', serif; font-weight: 700; color: var(--safra-navy); font-size: 1.3rem; margin-bottom: 8px; }
        .pay-confirm p { color: var(--safra-gray); font-size: 14px; }
      `}</style>
    </>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="pay-header"><p>Loading...</p></div>}>
      <PaymentContent />
    </Suspense>
  );
}