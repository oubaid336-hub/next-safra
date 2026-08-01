"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getApiBaseUrl } from "@/lib/config";

export default function WishlistPage() {
  const router = useRouter();
  const [houses, setHouses] = useState([]);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const API = getApiBaseUrl();

    async function loadWishlist() {
      try {
        const res = await fetch(`${API}/api/wishlist`, { credentials: "include" });
        if (res.status === 401) {
          router.push("/login?redirect=wishlist");
          return;
        }
        if (!res.ok) throw new Error(`Server responded with ${res.status}`);
        const data = await res.json();
        setHouses(data.houses || []);
        setCars(data.cars || []);
      } catch (err) {
        console.error("Failed to load wishlist:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadWishlist();
  }, [router]);

  const removeFromWishlist = async (id, type) => {
    const API = getApiBaseUrl();
    try {
      const res = await fetch(`${API}/api/wishlist/${encodeURIComponent(id)}`, {
        method: "POST",
        credentials: "include",
      });
      if (res.status === 401) {
        router.push("/login?redirect=wishlist");
        return;
      }
      if (!res.ok) return;
      if (type === "house") {
        setHouses((prev) => prev.filter((h) => String(h._id) !== String(id)));
      } else {
        setCars((prev) => prev.filter((c) => String(c._id) !== String(id)));
      }
    } catch (err) {
      console.error("Wishlist remove failed:", err);
    }
  };

  const isEmpty = !loading && !error && houses.length === 0 && cars.length === 0;

  return (
    <>
      <div className="container listing-header">
        <span className="listing-eyebrow">Saved</span>
        <h1>Your Wishlist</h1>
        <p>Houses and cars you&apos;ve saved for later.</p>
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
          <p className="listing-error">Could not load your wishlist right now.</p>
        ) : isEmpty ? (
          <p className="listing-empty">
            Nothing saved yet. Browse <Link href="/houses">houses</Link> or <Link href="/cars">cars</Link> and tap the heart to save them here.
          </p>
        ) : (
          <>
            {houses.length > 0 && (
              <>
                <h2 className="wishlist-section-title">Houses</h2>
                <div className="listing-grid">
                  {houses.map((house) => (
                    <div className="listing-card-wrap" style={{ position: "relative" }} key={house._id}>
                      <button
                        type="button"
                        className="card-wishlist is-active"
                        aria-label="Remove from wishlist"
                        onClick={(e) => { e.preventDefault(); removeFromWishlist(house._id, "house"); }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
                        </svg>
                      </button>
                      <Link className="listing-card" href={`/houses/${house._id}`}>
                        <div className="listing-thumb">
                          {house.photos && house.photos[0] ? (
                            <img src={house.photos[0]} alt={house.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M3 11l9-7 9 7" />
                              <path d="M5 10v10h14V10" />
                            </svg>
                          )}
                        </div>
                        <div className="listing-body">
                          <div className="listing-title">{house.title}</div>
                          <div className="listing-location">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            <span>{house.location}</span>
                          </div>
                          <div className="listing-footer-row">
                            <div className="listing-price">${house.pricePerNight}<span>per night</span></div>
                            <span className="listing-cta">View Details</span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </>
            )}

            {cars.length > 0 && (
              <>
                <h2 className="wishlist-section-title">Cars</h2>
                <div className="listing-grid">
                  {cars.map((car) => (
                    <div className="listing-card-wrap" style={{ position: "relative" }} key={car._id}>
                      <button
                        type="button"
                        className="card-wishlist is-active"
                        aria-label="Remove from wishlist"
                        onClick={(e) => { e.preventDefault(); removeFromWishlist(car._id, "car"); }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
                        </svg>
                      </button>
                      <Link className="listing-card" href={`/cars/${car._id}`}>
                        <div className="listing-thumb">
                          {car.photos && car.photos[0] ? (
                            <img src={car.photos[0]} alt={car.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M5 17h14M5 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm14 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0zM3 17V9l2-5h14l2 5v8" />
                            </svg>
                          )}
                        </div>
                        <div className="listing-body">
                          <div className="listing-title">{car.title}</div>
                          <div className="listing-location">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            <span>{car.location}</span>
                          </div>
                          <div className="listing-footer-row">
                            <div className="listing-price">${car.pricePerDay}<span>per day</span></div>
                            <span className="listing-cta">View Details</span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .wishlist-section-title {
          font-family: 'Playfair Display', serif;
          color: var(--safra-navy);
          margin: 2rem 0 1rem;
        }
        .wishlist-section-title:first-of-type {
          margin-top: 0;
        }
      `}</style>
    </>
  );
}
