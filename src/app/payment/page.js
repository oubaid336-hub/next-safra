"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { getApiBaseUrl } from "@/lib/config";

function PaymentContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [booking, setBooking] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [formMessage, setFormMessage] = useState({ text: "", type: "" });

  const loadBooking = useCallback(async (id) => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/bookings/${id}`, { credentials: "include" });

      if (res.status === 401) {
        const redirectTarget = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login?redirect=${redirectTarget}`;
        return;
      }

      if (!res.ok) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const data = await res.json();
      const b = data.booking || data;
      setBooking(b);
      if (b.status === "pending-cash-payment" || b.status === "confirmed") {
        setConfirmed(true);
      }
      setLoading(false);
    } catch (err) {
      console.error("Failed to load booking:", err);
      setNotFound(true);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    loadBooking(bookingId);
  }, [bookingId, loadBooking]);

  function formatDate(d) {
    if (!d) return "";
    return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function formatPrice(amount) {
    const n = Number(amount) || 0;
    return `$${n.toFixed(2)}`;
  }

  async function safeJson(res) {
    try {
      return await res.json();
    } catch {
      return {};
    }
  }

  async function handleConfirmCash() {
    if (!bookingId || confirming || confirmed) return;
    setConfirming(true);
    setFormMessage({ text: "", type: "" });

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/bookings/${bookingId}/confirm-cash`, {
        method: "PATCH",
        credentials: "include",
      });

      if (res.status === 401) {
        const redirectTarget = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login?redirect=${redirectTarget}`;
        return;
      }

      if (!res.ok) {
        const data = await safeJson(res);
        setFormMessage({ text: data.message || "Something went wrong confirming your booking. Please try again.", type: "error" });
        return;
      }

      setConfirmed(true);
    } catch (err) {
      console.error("Confirm-cash failed:", err);
      setFormMessage({ text: "Could not reach the server. Please check your connection and try again.", type: "error" });
    } finally {
      setConfirming(false);
    }
  }

  const listingTitle = booking?.listing?.title || booking?.listingTitle || "Your booking";
  const totalPrice = booking?.totalPrice ?? booking?.priceBreakdown?.total;

  return (
    <main className="payment-page">
      <h1>Choose How You&apos;d Like to Pay</h1>
      <p className="subtitle">You&apos;ll get a confirmation once it&apos;s approved.</p>

      {loading && <div id="loading-state">Loading booking details...</div>}

      {!loading && notFound && (
        <div id="not-found-state">
          <p>We couldn&apos;t find that booking. It may have been removed or the link is incorrect.</p>
          <a href="/my-bookings" className="btn btn-terracotta">My Bookings</a>
        </div>
      )}

      {!loading && !notFound && booking && (
        <>
          <section className="booking-summary card-style">
            <h2>{listingTitle}</h2>
            <p className="dates">
              {formatDate(booking.startDate)} ? {formatDate(booking.endDate)}
            </p>
            {totalPrice != null && (
              <p className="total">Total: {formatPrice(totalPrice)}</p>
            )}
          </section>

          <section className="payment-options">
            <div className="payment-option card-style">
              <h3>Pay on arrival (cash)</h3>
              <p>Reserve now, pay the full amount in cash when you arrive.</p>
              {confirmed ? (
                <p className="option-status success">Reservation requested — you&apos;ll get a confirmation once it&apos;s approved.</p>
              ) : (
                <button
                  type="button"
                  className="btn btn-terracotta"
                  onClick={handleConfirmCash}
                  disabled={confirming}
                >
                  {confirming ? "Confirming…" : "Reserve — Pay on Arrival"}
                </button>
              )}
              {formMessage.text && (
                <div id="form-message" className={`form-message ${formMessage.type}`}>{formMessage.text}</div>
              )}
            </div>

            <div className="payment-option card-style disabled">
              <h3>Pay 25% deposit by card</h3>
              <p>Pay a deposit now, the rest on arrival.</p>
              <span className="coming-soon">Coming soon</span>
            </div>

            <div className="payment-option card-style disabled">
              <h3>Pay in full by card</h3>
              <p>Pay the entire booking online now.</p>
              <span className="coming-soon">Coming soon</span>
            </div>
          </section>
        </>
      )}

      <style jsx>{`
        .payment-page { max-width: 720px; margin: 0 auto; padding: 2rem 1.25rem 4rem; }
        .payment-page h1 { color: var(--safra-navy); }
        .subtitle { opacity: 0.75; margin-top: -0.5rem; margin-bottom: 1.5rem; font-family: 'Inter', sans-serif; }
        .booking-summary { margin-bottom: 1.5rem; }
        .booking-summary h2 { font-family: 'Playfair Display', serif; color: var(--safra-navy); margin-bottom: 0.4rem; }
        .booking-summary .dates { opacity: 0.75; font-family: 'Inter', sans-serif; }
        .booking-summary .total { font-weight: 600; margin-top: 0.5rem; font-family: 'Inter', sans-serif; }
        .payment-options { display: grid; gap: 1.25rem; }
        .payment-option h3 { font-family: 'Playfair Display', serif; color: var(--safra-navy); margin-bottom: 0.4rem; }
        .payment-option p { font-family: 'Inter', sans-serif; opacity: 0.8; margin-bottom: 0.75rem; }
        .payment-option.disabled { opacity: 0.6; }
        .coming-soon { display: inline-block; font-family: 'Inter', sans-serif; font-size: 0.85rem; font-weight: 600; padding: 0.3rem 0.7rem; border-radius: 999px; background: rgba(0,0,0,0.06); }
        .option-status { font-family: 'Inter', sans-serif; font-weight: 600; }
        .option-status.success { color: #1f6b3a; }
        .form-message { margin-top: 1rem; padding: 0.85rem 1rem; border-radius: 8px; font-family: 'Inter', sans-serif; font-size: 0.95rem; }
        .form-message.error { background: #fdeceb; color: #9c2b21; border: 1px solid #f3c2bd; }
        #loading-state, #not-found-state { text-align: center; padding: 3rem 1rem; font-family: 'Inter', sans-serif; opacity: 0.75; }
      `}</style>
    </main>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div id="loading-state">Loading booking details...</div>}>
      <PaymentContent />
    </Suspense>
  );
}
