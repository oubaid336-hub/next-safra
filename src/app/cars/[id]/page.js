"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getApiBaseUrl } from "@/lib/config";

export default function CarDetailPage() {
  const params = useParams();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [car, setCar] = useState(null);
  const [activePhoto, setActivePhoto] = useState(0);

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState(false);

  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistVisible, setWishlistVisible] = useState(true);
  const [wishlistBusy, setWishlistBusy] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError(true);
      return;
    }
    let cancelled = false;
    const API = getApiBaseUrl();

    async function load() {
      try {
        const res = await fetch(`${API}/api/cars/${id}`, { credentials: "include" });
        if (!res.ok) throw new Error(`Server responded with ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        const carData = data.car || data;
        setCar(carData);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load car:", err);
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!car) return;
    let cancelled = false;
    const API = getApiBaseUrl();

    async function loadReviews() {
      try {
        const res = await fetch(`${API}/api/reviews/car/${id}`, { credentials: "include" });
        if (!res.ok) throw new Error(`Server responded with ${res.status}`);
        const data = await res.json();
        if (cancelled) return;

        const sortedByRating = [...data].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        const best = sortedByRating.slice(0, 2);
        const remaining = sortedByRating.slice(2);
        const normalPick = remaining.length ? remaining[Math.floor(remaining.length / 2)] : null;
        setReviews(normalPick ? [...best, normalPick] : best);
      } catch (err) {
        console.error("Failed to load reviews:", err);
        if (!cancelled) setReviewsError(true);
      } finally {
        if (!cancelled) setReviewsLoading(false);
      }
    }

    loadReviews();
    return () => {
      cancelled = true;
    };
  }, [car, id]);

  useEffect(() => {
    if (!car) return;
    let cancelled = false;
    const API = getApiBaseUrl();

    async function setupWishlist() {
      try {
        const res = await fetch(`${API}/api/wishlist/`, { credentials: "include" });
        if (!res.ok) {
          if (!cancelled) setWishlistVisible(false);
          return;
        }
        const wl = await res.json();
        const allIds = [...(wl.houses || []), ...(wl.cars || [])].map((item) => String(item._id));
        if (!cancelled) setWishlisted(allIds.includes(String(id)));
      } catch (err) {
        if (!cancelled) setWishlistVisible(false);
      }
    }

    setupWishlist();
    return () => {
      cancelled = true;
    };
  }, [car, id]);

  async function toggleWishlist() {
    setWishlistBusy(true);
    const API = getApiBaseUrl();
    try {
      const res = await fetch(`${API}/api/wishlist/${encodeURIComponent(id)}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      setWishlisted((w) => !w);
    } catch (err) {
      console.error("Wishlist toggle failed:", err);
      alert("Could not update wishlist. Please try again.");
    } finally {
      setWishlistBusy(false);
    }
  }

  const photos = car?.photos || [];
  const pricePerDay = car ? Number(car.pricePerDay ?? car.pricePerNight) || 0 : 0;

  return (
    <main className="car-detail-page">
      <Link href="/cars" className="back-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Back to Cars
      </Link>

      {loading && <div id="loadingState">Loading car details...</div>}

      {!loading && (error || !car) && (
        <div id="errorState" style={{ display: "block" }}>
          <h2>Listing not found</h2>
          <p>This car may have been removed or the link is incorrect.</p>
          <Link href="/cars" className="btn btn-terracotta">Back to all cars</Link>
        </div>
      )}

      {!loading && !error && car && (
        <div id="detailLayout" style={{ display: "grid" }}>
          <div className="gallery-wrap">
            <div className="gallery-main" id="galleryMain">
              {photos.length ? (
                <img
                  src={photos[activePhoto]}
                  alt={car.title || "Photo"}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              ) : (
                <div className="gallery-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10.5" r="1.5"/><path d="M21 15l-5-5-4 4-3-3-6 6"/></svg>
                  <p>Photos coming soon</p>
                </div>
              )}
            </div>
            {photos.length > 1 && (
              <div className="gallery-thumbs" id="galleryThumbs">
                {photos.map((p, i) => (
                  <button
                    type="button"
                    key={i}
                    className={`gallery-thumb${i === activePhoto ? " is-active" : ""}`}
                    onClick={() => setActivePhoto(i)}
                  >
                    <img src={p} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="car-body">
            <div className="car-header">
              <h1>{car.title}</h1>
              <span className="car-price">
                ${pricePerDay.toFixed(2)}
                <span> / day</span>
              </span>
            </div>

            <p className="car-location"><span>{car.location}</span></p>

            <div className="car-specs">
              <div className="spec-item">
                <div className="label">Seats</div>
                <div className="value">{car.seats ?? "-"}</div>
              </div>
              <div className="spec-item">
                <div className="label">Transmission</div>
                <div className="value">{car.transmission ?? "-"}</div>
              </div>
              <div className="spec-item">
                <div className="label">Year</div>
                <div className="value">{car.year ?? "-"}</div>
              </div>
            </div>

            <p className="car-description">{car.description || ""}</p>

            <div className="car-actions">
              <Link href={`/booking?carId=${car._id}`} id="bookCarBtn">Book This Car</Link>
              {wishlistVisible && (
                <button type="button" id="wishlistBtn" onClick={toggleWishlist} disabled={wishlistBusy}>
                  {wishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                </button>
              )}
            </div>

            <div className="reviews-section">
              <div className="reviews-header">
                <h3 className="reviews-title">Reviews</h3>
                <Link
                  href={`/reviews?listingId=${encodeURIComponent(car._id || id)}&listingType=car`}
                  className="write-review-link"
                >
                  Write a Review
                </Link>
              </div>
              <div id="reviewsList">
                {reviewsLoading ? (
                  <p className="no-reviews">Loading reviews…</p>
                ) : reviewsError ? (
                  <p className="no-reviews">Could not load reviews.</p>
                ) : reviews.length === 0 ? (
                  <p className="no-reviews">No reviews yet.</p>
                ) : (
                  reviews.map((r, i) => (
                    <div className="review-card" key={i}>
                      <div className="review-head">
                        <span className="review-name">{r.userId && r.userId.name ? r.userId.name : "Guest"}</span>
                        <span className="review-stars">Rating: {r.rating || 0}/5</span>
                      </div>
                      <p className="review-comment">{r.comment || ""}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .car-detail-page {
          max-width: 880px;
          margin: 0 auto;
          padding: 24px 20px 80px;
          position: relative;
          z-index: 1;
        }
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: var(--safra-navy);
          text-decoration: none;
          margin-bottom: 20px;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          border-radius: 999px;
          transition: all 0.2s;
        }
        .back-link:hover {
          background: #fff;
          color: var(--safra-terracotta);
          transform: translateX(-4px);
        }
        .back-link svg { width: 14px; height: 14px; }

        #detailLayout {
          background: #fff;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(15,23,42,.15);
        }

        .gallery-main {
          width: 100%;
          aspect-ratio: 16 / 9;
          background: linear-gradient(135deg, var(--safra-sand), var(--safra-sanddark));
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .gallery-placeholder { text-align: center; color: var(--safra-blue); opacity: .55; }
        .gallery-placeholder svg { width: 56px; height: 56px; margin: 0 auto 10px; }
        .gallery-placeholder p { font-family: 'Playfair Display', serif; font-weight: 700; font-size: .95rem; }

        .gallery-thumbs {
          display: flex;
          gap: 8px;
          padding: 12px 20px;
          overflow-x: auto;
          background: #fff;
        }
        .gallery-thumb {
          flex-shrink: 0;
          width: 64px;
          height: 64px;
          border-radius: 8px;
          overflow: hidden;
          border: 2px solid transparent;
          padding: 0;
          cursor: pointer;
          background: none;
        }
        .gallery-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .gallery-thumb.is-active { border-color: var(--safra-terracotta); }

        .car-body { padding: 32px 36px 40px; }

        .car-header {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 12px;
        }
        .car-header h1 {
          font-family: 'Playfair Display', serif;
          font-weight: 800;
          font-size: 2.2rem;
          color: var(--safra-navy);
          margin: 0;
          line-height: 1.2;
        }

        .car-price {
          font-family: 'Playfair Display', serif;
          font-weight: 800;
          font-size: 1.6rem;
          color: var(--safra-terracotta);
          white-space: nowrap;
          padding: 8px 16px;
          background: rgba(196, 92, 62, 0.08);
          border-radius: 12px;
        }
        .car-price span { font-family: 'Inter', sans-serif; font-weight: 500; font-size: 13px; }

        .car-location {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--safra-gray);
          font-size: 15px;
          font-family: 'Inter', sans-serif;
          margin: 12px 0 28px;
          font-weight: 500;
        }
        .car-location::before {
          content: "";
          display: inline-block;
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          background-color: var(--safra-terracotta);
          -webkit-mask: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2"><path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>') no-repeat center / contain;
          mask: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2"><path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>') no-repeat center / contain;
        }

        .car-specs {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 12px;
          margin: 24px 0 32px;
        }
        .spec-item {
          background: linear-gradient(135deg, var(--safra-sandlight), #fff);
          border: 1px solid var(--safra-sanddark);
          border-radius: 12px;
          padding: 16px 18px;
          font-family: 'Inter', sans-serif;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .spec-item:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(15, 23, 42, .08); }
        .spec-item .label {
          font-size: 11px; font-weight: 600; color: var(--safra-gray);
          text-transform: uppercase; letter-spacing: 0.04em;
        }
        .spec-item .value { font-size: 1.1rem; font-weight: 700; color: var(--safra-navy); margin-top: 4px; text-transform: capitalize; }

        .car-description {
          font-family: 'Inter', sans-serif;
          line-height: 1.8;
          color: var(--safra-gray);
          font-size: 15px;
          margin: 24px 0 32px;
          padding-top: 24px;
          border-top: 1px solid var(--safra-sanddark);
          white-space: pre-line;
        }

        .car-actions { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }

        #bookCarBtn {
          flex: 1; min-width: 200px; display: inline-flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, var(--safra-terracotta), var(--safra-terracottalight));
          color: #fff; font-family: 'Inter', sans-serif; font-weight: 600; font-size: 15px;
          padding: 16px 32px; border-radius: 12px; text-decoration: none;
          box-shadow: 0 8px 20px rgba(196, 92, 62, .3); transition: all .25s ease;
        }
        #bookCarBtn:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(196, 92, 62, .4); }

        #wishlistBtn {
          flex: 1; min-width: 200px; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          background: var(--safra-sandlight); color: var(--safra-navy); font-family: 'Inter', sans-serif;
          font-weight: 600; font-size: 15px; padding: 16px 32px; border-radius: 12px;
          border: 1.5px solid var(--safra-sanddark); cursor: pointer; transition: all 0.2s ease;
        }
        #wishlistBtn:hover { background: var(--safra-sand); border-color: var(--safra-terracotta); color: var(--safra-terracotta); }

        .reviews-section { margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--safra-sanddark); }
        .reviews-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
        .reviews-title {
          font-family: 'Playfair Display', serif; font-weight: 700; font-size: 1.3rem; color: var(--safra-navy);
          margin: 0; display: flex; align-items: center; gap: 8px;
        }
        .reviews-title::before { content: ''; width: 4px; height: 24px; background: var(--safra-terracotta); border-radius: 2px; }
        .write-review-link {
          font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600; color: var(--safra-terracotta);
          text-decoration: none; padding: 6px 12px; border-radius: 8px; transition: background 0.2s;
        }
        .write-review-link:hover { background: rgba(196, 92, 62, 0.08); }
        .review-card { padding: 18px; background: var(--safra-sandlight); border-radius: 12px; margin-bottom: 12px; }
        .review-card:last-child { margin-bottom: 0; }
        .review-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .review-name { font-family: 'Playfair Display', serif; font-weight: 700; color: var(--safra-navy); font-size: 15px; }
        .review-stars { color: var(--safra-yellow); font-size: 14px; letter-spacing: 2px; }
        .review-comment { font-size: 14px; color: var(--safra-gray); line-height: 1.6; }
        .no-reviews {
          color: var(--safra-gray); font-size: 14px; padding: 20px; text-align: center;
          background: var(--safra-sandlight); border-radius: 12px;
        }

        #loadingState, #errorState {
          text-align: center; padding: 4rem 1rem; font-family: 'Inter', sans-serif; color: var(--safra-gray);
        }
        #errorState h2 { font-family: 'Playfair Display', serif; font-weight: 700; font-size: 1.5rem; color: var(--safra-navy); margin-bottom: 12px; }
        #errorState p { margin-bottom: 24px; }

        @media (max-width: 640px) {
          .car-detail-page { padding: 16px 12px 60px; }
          .car-body { padding: 24px 20px 32px; }
          .car-header h1 { font-size: 1.6rem; }
          .car-price { font-size: 1.3rem; }
          .car-actions { flex-direction: column; }
        }
      `}</style>
    </main>
  );
}