"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getApiBaseUrl } from "@/lib/config";

export default function CarsPage() {
  const router = useRouter();
  const [allCars, setAllCars] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [ratingSummary, setRatingSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [locationFilter, setLocationFilter] = useState("");
  const [transmission, setTransmission] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    const API = getApiBaseUrl();

    async function loadMyWishlist() {
      try {
        const meRes = await fetch(`${API}/api/auth/me`, { credentials: "include" });
        if (!meRes.ok) return [];
        const wishRes = await fetch(`${API}/api/wishlist`, { credentials: "include" });
        if (!wishRes.ok) return [];
        const data = await wishRes.json();
        const houseIds = (data.houses || []).map((h) => String(h._id));
        const carIds = (data.cars || []).map((c) => String(c._id));
        return [...houseIds, ...carIds];
      } catch (err) {
        return [];
      }
    }

    async function loadRatings() {
      try {
        const res = await fetch(`${API}/api/reviews/summary/car`);
        if (!res.ok) return {};
        const data = await res.json();
        const summary = {};
        (data || []).forEach((r) => { summary[r.listingId] = r; });
        return summary;
      } catch (err) {
        return {};
      }
    }

    async function loadCars() {
      try {
        const [wish, ratings] = await Promise.all([loadMyWishlist(), loadRatings()]);
        setWishlist(wish);
        setRatingSummary(ratings);

        const res = await fetch(`${API}/api/cars`);
        if (!res.ok) throw new Error(`Server responded with ${res.status}`);
        const cars = await res.json();
        setAllCars(cars);
      } catch (err) {
        console.error("Failed to load cars:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadCars();
  }, []);

  const filteredCars = useMemo(() => {
    const loc = locationFilter.trim().toLowerCase();
    const maxP = parseFloat(maxPrice);

    return allCars.filter((c) => {
      const matchesLocation = !loc || (c.location || "").toLowerCase().includes(loc);
      const matchesTransmission = !transmission || c.transmission === transmission;
      const matchesMaxPrice = isNaN(maxP) || c.pricePerDay <= maxP;
      return matchesLocation && matchesTransmission && matchesMaxPrice;
    });
  }, [allCars, locationFilter, transmission, maxPrice]);

  const toggleWishlist = async (id) => {
    const API = getApiBaseUrl();
    try {
      const res = await fetch(`${API}/api/wishlist/${encodeURIComponent(id)}`, {
        method: "POST",
        credentials: "include",
      });
      if (res.status === 401) {
        router.push("/login?redirect=cars");
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      setWishlist((data.wishlist || []).map(String));
    } catch (err) {
      console.error("Wishlist toggle failed:", err);
    }
  };

  return (
    <>
      <div className="container listing-header">
        <span className="listing-eyebrow">Fleet</span>
        <h1>Available Cars</h1>
        <p>Reliable rentals across Tunisia, city runabouts to desert-ready 4x4s.</p>
      </div>

      <div className="container">
        <div className="filter-bar">
          <input
            className="form-input"
            type="text"
            placeholder="Search location..."
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          />
          <select
            className="form-input"
            value={transmission}
            onChange={(e) => setTransmission(e.target.value)}
          >
            <option value="">Any transmission</option>
            <option value="automatic">Automatic</option>
            <option value="manual">Manual</option>
          </select>
          <input
            className="form-input"
            type="number"
            placeholder="Max $/day"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>

        <div className="listing-grid">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div className="skeleton-card" key={i}>
                <div className="skeleton" style={{ aspectRatio: "4/3" }}></div>
                <div style={{ padding: "18px 20px" }}>
                  <div className="skeleton" style={{ height: "16px", width: "70%", marginBottom: "8px", borderRadius: "6px" }}></div>
                  <div className="skeleton" style={{ height: "12px", width: "40%", borderRadius: "6px" }}></div>
                </div>
              </div>
            ))
          ) : error ? (
            <p className="listing-error">Could not load cars right now.</p>
          ) : filteredCars.length === 0 ? (
            <p className="listing-empty">
              {allCars.length === 0 ? "No cars available right now." : "No cars match your search."}
            </p>
          ) : (
            filteredCars.map((car) => {
              const rating = ratingSummary[String(car._id)];
              const isActive = wishlist.includes(String(car._id));

              return (
                <div className="listing-card-wrap" style={{ position: "relative" }} key={car._id}>
                  <button
                    type="button"
                    className={`card-wishlist${isActive ? " is-active" : ""}`}
                    aria-label="Toggle wishlist"
                    onClick={(e) => { e.preventDefault(); toggleWishlist(car._id); }}
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
                      {car.year && <span className="listing-badge-corner">{car.year}</span>}
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
                      <div className="listing-meta">
                        {rating && (
                          <span className="listing-meta-item">&#9733; {rating.avgRating} ({rating.count})</span>
                        )}
                        {car.seats ? (
                          <span className="listing-meta-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            {car.seats} seats
                          </span>
                        ) : null}
                        {car.transmission ? (
                          <span className="listing-meta-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <circle cx="12" cy="12" r="3" />
                              <path d="M12 1v6m0 10v6m11-11h-6M7 12H1m17.36-6.36-4.24 4.24m-6.24 6.24-4.24 4.24m14.72 0-4.24-4.24M7.05 7.05 2.81 2.81" />
                            </svg>
                            {car.transmission}
                          </span>
                        ) : null}
                      </div>
                      <div className="listing-footer-row">
                        <div className="listing-price">${car.pricePerDay}<span>per day</span></div>
                        <span className="listing-cta">View Details</span>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
