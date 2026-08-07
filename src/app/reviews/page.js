"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getApiBaseUrl } from "@/lib/config";

function WriteReviewContent() {
  const searchParams = useSearchParams();
  const listingId = searchParams.get("listingId");
  const listingType = searchParams.get("listingType");

  const [listing, setListing] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formMessage, setFormMessage] = useState({ text: "", type: "" });

  const invalidParams = !listingId || !["house", "car"].includes(listingType);

  const loadListing = useCallback(async () => {
    if (invalidParams) return;
    const API = getApiBaseUrl();
    const path = listingType === "house" ? "houses" : "cars";
    try {
      const res = await fetch(`${API}/api/${path}/${listingId}`);
      if (!res.ok) return;
      const data = await res.json();
      setListing(data.house || data.car || data);
    } catch (err) {
      console.error("Failed to load listing:", err);
    }
  }, [listingId, listingType, invalidParams]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadListing();
  }, [loadListing]);

  async function safeJson(res) {
    try {
      return await res.json();
    } catch {
      return {};
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormMessage({ text: "", type: "" });

    if (!rating) {
      setFormMessage({ text: "Please select a star rating.", type: "error" });
      return;
    }

    setSubmitting(true);
    const API = getApiBaseUrl();

    try {
      const res = await fetch(`${API}/api/reviews`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, listingType, rating, comment }),
      });

      if (res.status === 401) {
        const redirectTarget = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login?redirect=${redirectTarget}`;
        return;
      }

      if (res.status === 403) {
        setFormMessage({ text: "You can only review a listing you've booked and stayed at.", type: "error" });
        return;
      }

      if (res.status === 409) {
        setFormMessage({ text: "You've already reviewed this stay.", type: "error" });
        return;
      }

      if (!res.ok) {
        const data = await safeJson(res);
        setFormMessage({ text: data.message || "Something went wrong. Please try again.", type: "error" });
        return;
      }

      setSubmitted(true);
    } catch (err) {
      console.error("Review submission failed:", err);
      setFormMessage({ text: "Could not reach the server. Please check your connection and try again.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  const detailHref = listingType === "house" ? `/houses/${listingId}` : `/cars/${listingId}`;

  return (
    <main className="review-page">
      <h1>Write a Review</h1>

      {invalidParams ? (
        <div id="error-state">
          <p>We couldn&apos;t tell which listing you want to review. Please go back and try again from the listing page.</p>
          <Link href="/houses" className="btn btn-terracotta">Browse Houses</Link>
        </div>
      ) : submitted ? (
        <div id="success-state" className="card-style">
          <p>Thanks — your review has been posted.</p>
          <Link href={detailHref} className="btn btn-terracotta">Back to Listing</Link>
        </div>
      ) : (
        <>
          {listing && <p className="review-subtitle">Reviewing: {listing.title}</p>}

          <form id="review-form" className="card-style" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Rating</label>
              <div className="star-input">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    type="button"
                    key={n}
                    className={`star-btn${n <= rating ? " is-active" : ""}`}
                    aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    onClick={() => setRating(n)}
                  >
                    &#9733;
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="comment">Comment</label>
              <textarea
                id="comment"
                className="form-input"
                rows={5}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="How was your stay?"
              />
            </div>

            <button type="submit" className="btn btn-terracotta" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit Review"}
            </button>

            {formMessage.text && (
              <div id="form-message" className={`form-message ${formMessage.type}`}>{formMessage.text}</div>
            )}
          </form>
        </>
      )}

      <style jsx>{`
        .review-page { max-width: 600px; margin: 0 auto; padding: 2rem 1.25rem 4rem; }
        .review-page h1 { color: var(--safra-navy); font-family: 'Playfair Display', serif; }
        .review-subtitle { opacity: 0.75; margin: -0.5rem 0 1.5rem; font-family: 'Inter', sans-serif; }
        .form-group { margin-bottom: 1.25rem; }
        .form-group label { display: block; font-family: 'Inter', sans-serif; font-weight: 600; margin-bottom: 0.4rem; }
        .star-input { display: flex; gap: 0.25rem; }
        .star-btn { font-size: 2rem; line-height: 1; background: none; border: none; cursor: pointer; color: rgba(0,0,0,0.2); padding: 0; }
        .star-btn.is-active { color: var(--safra-terracotta); }
        textarea.form-input { width: 100%; padding: 0.65rem 0.75rem; border: 1px solid rgba(0,0,0,0.2); border-radius: 8px; font-family: 'Inter', sans-serif; font-size: 1rem; resize: vertical; }
        .form-message { margin-top: 1rem; padding: 0.85rem 1rem; border-radius: 8px; font-family: 'Inter', sans-serif; font-size: 0.95rem; }
        .form-message.error { background: #fdeceb; color: #9c2b21; border: 1px solid #f3c2bd; }
        #success-state, #error-state { text-align: center; padding: 2rem 1.5rem; }
        #success-state p, #error-state p { font-family: 'Inter', sans-serif; margin-bottom: 1.25rem; }
      `}</style>
    </main>
  );
}

export default function WriteReviewPage() {
  return (
    <Suspense fallback={<div id="loading-state">Loading...</div>}>
      <WriteReviewContent />
    </Suspense>
  );
}