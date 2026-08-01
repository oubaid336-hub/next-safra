"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getApiBaseUrl } from "@/lib/config";

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  const alwaysSolid = ["/login", "/signup", "/forgot-password"].includes(pathname);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const closeMenu = () => setUserMenuOpen(false);
    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, []);

  useEffect(() => {
    const API = getApiBaseUrl();
    fetch(`${API}/api/auth/me`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user?.name) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async (e) => {
    e.preventDefault();
    const API = getApiBaseUrl();
    try {
      await fetch(`${API}/api/auth/logout`, { method: "POST", credentials: "include" });
    } finally {
      window.location.href = "/login";
    }
  };

  const isActive = (href) => pathname === href;

  if (pathname.startsWith("/admin")) return null;

  return (
    <nav className={`navbar${(scrolled || alwaysSolid) ? " scrolled" : ""}`} id="navbar">
      <div className="container nav-inner">
        <Link href="/" className="nav-logo">
          <div className="nav-logo-badge"><span>S</span></div>
          <span className="nav-logo-text">Safra</span>
        </Link>

        <div className="nav-links">
          <Link href="/" className={`nav-link${isActive("/") ? " active" : ""}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9"/><path d="M9 20v-5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v5"/></svg>
            Home
          </Link>
          <Link href="/houses" className={`nav-link${isActive("/houses") ? " active" : ""}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 21V9l8-6 8 6v12"/><path d="M9 21v-7h6v7"/></svg>
            Houses
          </Link>
          <Link href="/cars" className={`nav-link${isActive("/cars") ? " active" : ""}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 13.5 4.5 8A2 2 0 0 1 6.4 6.5h11.2A2 2 0 0 1 19.5 8L21 13.5"/><path d="M3 13.5h18V17a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3.5Z"/><circle cx="7.5" cy="17" r="1.4"/><circle cx="16.5" cy="17" r="1.4"/></svg>
            Cars
          </Link>
          <Link href="/faq" className={`nav-link${isActive("/faq") ? " active" : ""}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            FAQ
          </Link>
          <Link href="/contact" className={`nav-link${isActive("/contact") ? " active" : ""}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Contact
          </Link>
        </div>

        {user ? (
          <div className="nav-auth">
            <div className="nav-user">
              <button
                type="button"
                className="nav-user-trigger"
                onClick={(e) => { e.stopPropagation(); setUserMenuOpen((o) => !o); }}
              >
                <span className="nav-user-name">{user.name}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              <div className={`nav-user-menu${userMenuOpen ? " open" : ""}`}>
                <Link href="/wishlist">Wishlist</Link>
                <Link href="/my-bookings">My Bookings</Link>
                <a href="#" onClick={handleLogout}>Log out</a>
              </div>
            </div>
          </div>
        ) : (
          <div className="nav-auth">
            <Link href="/login" className={`nav-auth-login${isActive("/login") ? " active" : ""}`}>Login</Link>
            <Link href="/signup" className={`nav-auth-signup${isActive("/signup") ? " active" : ""}`}>Sign Up</Link>
          </div>
        )}

        <button
          className="nav-toggle"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d={menuOpen ? "M6 6l12 12M18 6 6 18" : "M3 6h18M3 12h18M3 18h18"} />
          </svg>
        </button>
      </div>

      <div className="container">
        <div className={`mobile-menu${menuOpen ? " open" : ""}`}>
          <Link href="/">Home</Link>
          <Link href="/houses">Houses</Link>
          <Link href="/cars">Cars</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/contact">Contact</Link>
          <div className="divider"></div>
          {user ? (
            <>
              <div className="mobile-menu-user">{user.name}</div>
              <Link href="/wishlist">Wishlist</Link>
              <Link href="/my-bookings">My Bookings</Link>
              <a href="#" onClick={handleLogout}>Log out</a>
            </>
          ) : (
            <>
              <Link href="/login">Login</Link>
              <Link href="/signup">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
