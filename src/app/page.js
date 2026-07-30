"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getApiBaseUrl } from "@/lib/config";

export default function Home() {
  const router = useRouter();
  const [featuredHouses, setFeaturedHouses] = useState([]);
  const [featuredCar, setFeaturedCar] = useState(null);
  const [ratingSummary, setRatingSummary] = useState({});
  const [bookingCounts, setBookingCounts] = useState({});
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [featuredError, setFeaturedError] = useState(false);

  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const [subscribeMsg, setSubscribeMsg] = useState({ text: "", type: "" });
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const API = getApiBaseUrl();

    async function loadFeatured() {
      try {
        const [featuredRes, ratingRes, countsRes] = await Promise.all([
          fetch(`${API}/api/featured`),
          fetch(`${API}/api/reviews/summary/house`),
          fetch(`${API}/api/bookings/counts/house`),
        ]);
        const data = await featuredRes.json();

        const summary = {};
        if (ratingRes.ok) {
          const r = await ratingRes.json();
          (r || []).forEach((x) => { summary[x.listingId] = x; });
        }
        setRatingSummary(summary);
        setBookingCounts(countsRes.ok ? await countsRes.json() : {});
        setFeaturedHouses(data.houses || []);
        setFeaturedCar(data.car || null);
      } catch (err) {
        console.error("Failed to load featured listings:", err);
        setFeaturedError(true);
      } finally {
        setLoadingFeatured(false);
      }
    }

    async function loadAuthAndSubscription() {
      try {
        const res = await fetch(`${API}/api/auth/me`, { credentials: "include" });
        const data = res.ok ? await res.json() : null;
        if (data?.user?.email) {
          setCurrentUserEmail(data.user.email);
          try {
            const statusRes = await fetch(`${API}/api/subscribers/status?email=${encodeURIComponent(data.user.email)}`);
            const statusData = await statusRes.json();
            setIsSubscribed(!!statusData.subscribed);
          } catch (err) {
            setIsSubscribed(false);
          }
        }
      } catch (err) {
        // logged out, ignore
      } finally {
        setAuthChecked(true);
      }
    }

    loadFeatured();
    loadAuthAndSubscription();
  }, []);

  const handleSubscribeClick = async () => {
    setSubscribeMsg({ text: "", type: "" });

    if (!currentUserEmail) {
      router.push("/login");
      return;
    }

    setSubscribeLoading(true);
    const API = getApiBaseUrl();

    try {
      const endpoint = isSubscribed ? "/api/subscribers/unsubscribe-by-email" : "/api/subscribers";
      const res = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentUserEmail }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSubscribeMsg({ text: data.message || "Something went wrong. Try again.", type: "error" });
      } else {
        setIsSubscribed((prev) => !prev);
        setSubscribeMsg({
          text: !isSubscribed ? "Subscribed! We will email you about new listings." : "You've been unsubscribed.",
          type: "success",
        });
      }
    } catch (err) {
      setSubscribeMsg({ text: "Network error. Check your connection and try again.", type: "error" });
    } finally {
      setSubscribeLoading(false);
    }
  };

  const subscribeLabel = !authChecked
    ? "Subscribe"
    : !currentUserEmail
    ? "Log In to Subscribe"
    : subscribeLoading
    ? (isSubscribed ? "Unsubscribing..." : "Subscribing...")
    : (isSubscribed ? "Unsubscribe" : "Subscribe");

  return (
    <>
      <section className="hero">
        <img
          className="hero-bg"
          src="https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1600&auto=format&fit=crop&q=80"
          alt="Sidi Bou Said, Tunisia"
        />
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Welcome to Tunisia</h1>
          <p>From the white-washed streets of Sidi Bou Said to the golden sands of the Sahara, find your perfect stay and explore with ease.</p>
          <div className="hero-buttons">
            <Link href="/houses" className="btn btn-white">Find a Stay</Link>
            <Link href="/cars" className="btn btn-terracotta">Rent a Car</Link>
          </div>
        </div>
      </section>

      <section className="section destinations-section">
        <div className="container">
          <div className="section-head">
            <h2 className="section-title">Featured Listings</h2>
            <p className="section-sub">A few of the houses and cars available right now on Safra.</p>
          </div>
          <div className={`listing-grid${loadingFeatured ? " featured-loading" : ""}`}>
            {loadingFeatured ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div className="skeleton-card" key={i}>
                  <div className="skeleton" style={{ aspectRatio: "4/3" }}></div>
                </div>
              ))
            ) : featuredError ? (
              <div className="listing-error">Could not load featured listings.</div>
            ) : featuredHouses.length === 0 && !featuredCar ? (
              <div className="listing-empty">No featured listings yet.</div>
            ) : (
              <>
                {featuredHouses.map((h) => {
                  const rating = ratingSummary[String(h._id)];
                  const count = bookingCounts[String(h._id)] ?? 0;
                  const isNew = count <= 2;
                  const discountedPrice = Math.round(h.pricePerNight * 0.9);
                  return (
                    <Link href={`/houses/${h._id}`} className="listing-card" key={h._id}>
                      <div className="listing-thumb" style={{ position: "relative" }}>
                        <img src={h.photos[0]} alt={h.title} />
                        {(isNew || rating) && (
                          <div className="listing-badges-row">
                            {isNew && <span className="listing-badge-new">NEW &middot; 10% OFF</span>}
                            {rating && (
                              <div className="listing-rating-circle">
                                <span className="rc-num">{rating.avgRating}</span>
                                <span className="rc-star">&#9733;</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="listing-body">
                        <div className="listing-title">{h.title}</div>
                        <div className="listing-location">{h.location}</div>
                        <div className="listing-footer-row">
                          <div className="listing-price">
                            {isNew ? (
                              <>
                                <span className="listing-price-old">${h.pricePerNight}</span>${discountedPrice}
                              </>
                            ) : (
                              `$${h.pricePerNight}`
                            )}
                            <span>per night</span>
                          </div>
                          <span className="listing-cta">View Details</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
                {featuredCar && (
                  <Link href={`/cars/${featuredCar._id}`} className="listing-card">
                    <div className="listing-thumb">
                      <img src={featuredCar.photos[0]} alt={featuredCar.title} />
                    </div>
                    <div className="listing-body">
                      <div className="listing-title">{featuredCar.title}</div>
                      <div className="listing-location">{featuredCar.location}</div>
                      <div className="listing-footer-row">
                        <div className="listing-price">${featuredCar.pricePerDay}<span>per day</span></div>
                        <span className="listing-cta">View Details</span>
                      </div>
                    </div>
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2 className="section-title">Why Choose Safra?</h2>
            <p className="section-sub">Experience Tunisia like a local with our curated selection of homes and vehicles.</p>
          </div>
          <div className="features-grid">
            <div className="feature">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 21V9l8-6 8 6v12"/><path d="M9 21v-7h6v7"/></svg>
              </div>
              <h3>Curated Stays</h3>
              <p>Handpicked homes in the most beautiful Tunisian locations.</p>
            </div>
            <div className="feature">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 13.5 4.5 8A2 2 0 0 1 6.4 6.5h11.2A2 2 0 0 1 19.5 8L21 13.5"/><path d="M3 13.5h18V17a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3.5Z"/><circle cx="7.5" cy="17" r="1.4"/><circle cx="16.5" cy="17" r="1.4"/></svg>
              </div>
              <h3>Reliable Cars</h3>
              <p>Well-maintained vehicles for exploring every corner of Tunisia.</p>
            </div>
            <div className="feature">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s7-7.2 7-12a7 7 0 1 0-14 0c0 4.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>
              </div>
              <h3>Local Expertise</h3>
              <p>We know Tunisia inside out and share the best hidden gems.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-banner section">
        <div className="cta-circle-1"></div>
        <div className="cta-circle-2"></div>
        <div className="container">
          <h2>Ready for Your Tunisia Adventure?</h2>
          <p>Whether it&apos;s a beach villa or a desert retreat — we&apos;ve got you covered!</p>
          <Link href="/houses" className="btn btn-white">
            Start Exploring
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6"/></svg>
          </Link>
        </div>
      </section>

      <section className="section newsletter-section">
        <div className="container">
          <div className="newsletter-card">
            <h2>Never Miss a New Listing</h2>
            <p>Get an email the moment a new house or car goes live on Safra.</p>
            <div className="newsletter-form">
              <button type="button" className="btn btn-terracotta" onClick={handleSubscribeClick} disabled={subscribeLoading}>
                {subscribeLabel}
              </button>
            </div>
            {subscribeMsg.text && (
              <div className={`newsletter-msg show ${subscribeMsg.type}`}>{subscribeMsg.text}</div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
