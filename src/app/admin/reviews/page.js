"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getApiBaseUrl } from "@/lib/config";

export default function AdminReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyIds, setBusyIds] = useState({});

  const API = getApiBaseUrl();

  async function loadReviews() {
    try {
      const res = await fetch(`${API}/api/admin/reviews`, { credentials: "include" });

      if (res.status === 401 || res.status === 403) {
        router.replace("/admin/login");
        return;
      }
      if (!res.ok) {
        setError("Failed to load reviews.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      const sorted = [...data].sort((a, b) => (a.approved === b.approved ? 0 : a.approved ? 1 : -1));
      setReviews(sorted);
      setLoading(false);
    } catch (err) {
      setError("Failed to load reviews.");
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runAction(id, path, method) {
    setBusyIds((prev) => ({ ...prev, [id]: true }));
    try {
      await fetch(`${API}/api/admin/reviews/${id}${path}`, { method, credentials: "include" });
      await loadReviews();
    } finally {
      setBusyIds((prev) => ({ ...prev, [id]: false }));
    }
  }

  async function deleteReview(id) {
    if (!window.confirm("Delete this review?")) return;
    setBusyIds((prev) => ({ ...prev, [id]: true }));
    try {
      await fetch(`${API}/api/admin/reviews/${id}`, { method: "DELETE", credentials: "include" });
      await loadReviews();
    } finally {
      setBusyIds((prev) => ({ ...prev, [id]: false }));
    }
  }

  return (
    <>
      <h1>Reviews</h1>
      {error && <div id="statusBanner" className="show">{error}</div>}
      {loading && <p id="loadingMsg">Loading reviews...</p>}
      {!loading && reviews && reviews.length === 0 && <p id="emptyMsg">No reviews yet.</p>}

      {!loading && reviews && reviews.length > 0 && (
        <div id="reviews-list">
          {reviews.map((r) => {
            const busy = !!busyIds[r._id];
            const date = new Date(r.createdAt).toLocaleString();
            const reviewer = r.userId
              ? `${r.userId.name} (${r.userId.email})`
              : "Unknown user";
            const rating = r.rating || 0;
            const stars = "\u2605".repeat(rating) + "\u2606".repeat(5 - rating);

            return (
              <div className={`review-card${r.approved ? "" : " unapproved"}`} key={r._id}>
                <div className="review-header">
                  <strong>{reviewer}</strong>
                  <span>
                    <span className={`review-badge ${r.approved ? "approved" : "unapproved"}`}>
                      {r.approved ? "Approved" : "Unapproved"}
                    </span>
                    {r.hidden && <span className="review-badge hidden">Hidden</span>}
                  </span>
                </div>
                <p className="review-stars">{stars}</p>
                <p><em>{r.listingType || "listing"}</em></p>
                <p>{r.comment || ""}</p>
                <small>{date}</small>
                <div className="review-actions">
                  {!r.approved && (
                    <button disabled={busy} onClick={() => runAction(r._id, "/approve", "PUT")}>
                      Approve
                    </button>
                  )}
                  {r.hidden ? (
                    <button disabled={busy} onClick={() => runAction(r._id, "/unhide", "PUT")}>
                      Unhide
                    </button>
                  ) : (
                    <button disabled={busy} onClick={() => runAction(r._id, "/hide", "PUT")}>
                      Hide
                    </button>
                  )}
                  <button disabled={busy} onClick={() => deleteReview(r._id)}>
                    Delete
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
