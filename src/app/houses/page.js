"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getApiBaseUrl } from "@/lib/config";

export default function HousesPage() {
  const router = useRouter();
  const [allHouses, setAllHouses] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [ratingSummary, setRatingSummary] = useState({});
  const [bookingCounts, setBookingCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [locationFilter, setLocationFilter] = useState("");
  const [maxGuests, setMaxGuests] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    const API = getApiBaseUrl();

    async function loadMyWishlist() {
      try {
        const meRes = await fetch(`${API}/api/auth/me`, { credentials:"include" });
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
        const res = await fetch(`${API}/api/reviews/summary/house`);
        if (!res.ok) return {};
        const data = await res.json();
        const summary = {};
        (data || []).forEach((r) => { summary[r.listingId] = r; });
        return summary;
      } catch (err) {
        return {};
      }
    }

    async function loadBookingCounts() {
      try {
        const res = await fetch(`${API}/api/bookings/counts/house`);
        if (!res.ok) return {};
        return await res.json();
      } catch (err) {
        return {};
      }
    }

    async function loadHouses() {
      try {
        const [wish, ratings, counts] = await Promise.all([
          loadMyWishlist(),
          loadRatings(),
          loadBookingCounts(),
        ]);
        setWishlist(wish);
        setRatingSummary(ratings);
        setBookingCounts(counts);

        const res = await fetch(`${API}/api/houses`);
        if (!res.ok) throw new Error(`Server responded with ${res.status}`);
        const houses = await res.json();
        setAllHouses(houses);
      } catch (err) {
        console.error("Failed to load houses:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadHouses();
  }, []);

  const locationOptions = useMemo(() => {
    const set = new Set(allHouses.map((h) => h.location).filter(Boolean));
    return Array.from(set).sort();
  }, [allHouses]);

  const filteredHouses = useMemo(() => {
    const maxG = parseFloat(maxGuests);
    const minP = parseFloat(minPrice);
    const maxP = parseFloat(maxPrice);

    return allHouses.filter((h) => {
      const matchesLocation = !locationFilter || h.location === locationFilter;
      const matchesMaxGuests = isNaN(maxG) || (h.capacity || 0) <= maxG;
      const matchesMinPrice = isNaN(minP) || h.pricePerNight >= minP;
      const matchesMaxPrice = isNaN(maxP) || h.pricePerNight <= maxP;
      return matchesLocation && matchesMaxGuests && matchesMinPrice && matchesMaxPrice;
    });
  }, [allHouses, locationFilter, maxGuests, minPrice, maxPrice]);

  const toggleWishlist = async (id) => {
    const API = getApiBaseUrl();
    try {
      const res = await fetch(`${API}/api/wishlist/${encodeURIComponent(id)}`, {
        method: "POST",
        credentials: "include",
      });
      if (res.status === 401) {
        router.push("/login?redirect=houses");
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
        <span className="listing-eyebrow">Accommodations</span>
        <h1>Available Houses</h1>
        <p>Handpicked stays across Tunisia, from Sidi Bou Said to the Sahara.</p>
      </div>

      <div className="container">
        <div className="filter-bar">
          <select
            className="form-input"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            <option value="">All Locations</option>
            {locationOptions.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
          <input
            className="form-input"
            type="number"
            placeholder="Max guests"
            value={maxGuests}
            onChange={(e) => setMaxGuests(e.target.value)}
          />
          <input
            className="form-input"
            type="number"
            placeholder="Min $/night"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <input
            className="form-input"
            type="number"
            placeholder="Max $/night"
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
            <p className="listing-error">Could not load houses right now.</p>
          ) : filteredHouses.length === 0 ? (
            <p className="listing-empty">
              {allHouses.length === 0 ? "No houses available right now." : "No houses match your search."}
            </p>
          ) : (
            filteredHouses.map((house) => {
              const rating = ratingSummary[String(house._id)];
              const count = bookingCounts[String(house._id)] ?? 0;
              const isNew = count <= 2;
              const discountedPrice = Math.round(house.pricePerNight *0.9);
              const isActive = wishlist.includes(String(house._id));

              return (
                <div className="listing-card-wrap" style={{ position: "relative" }} key={house._id}>
                  <button
                    type="button"
                    className={`card-wishlist${isActive ? " is-active": ""}`}
                    aria-label="Toggle wishlist"
                    onClick={(e) => { e.preventDefault(); toggleWishlist(house._id); }}
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
                      {isNew && <span className="listing-badge-new">NEW &middot; 10% OFF</span>}
                      {rating && (
                        <div className="listing-rating-circle">
                          <span className="rc-num">{rating.avgRating}</span>
                          <span className="rc-star">&#9733;</span>
                        </div>
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
                      <div className="listing-meta">
                        {house.capacity ? (
                          <span className="listing-meta-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 00 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            {house.capacity} guests
                          </span>
                        ) : null}
                        {house.rooms ? (
                          <span className="listing-meta-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <path d="M2 4v16" />
                              <path d="M2 8h18a2 2 0 0 1 2 2v10" />
                              <path d="M2 17h20" />
                              <path d="M6 8v9" />
                            </svg>
                            {house.rooms} rooms
                          </span>
                        ) : null}
                      </div>
                      <div className="listing-footer-row">
                        <div className="listing-price">
                          {isNew ? (
                            <>
                              <span className="listing-price-old">${house.pricePerNight}</span>${discountedPrice}
                            </>
                          ) : (
                            `$${house.pricePerNight}`
                          )}
                          <span>per night</span>
                        </div>
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