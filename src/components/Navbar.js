'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const pathname = usePathname();
  const { user, checked, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 40);
    }
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    function handleOutsideClick(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  function handleLogoutClick(e) {
    e.preventDefault();
    logout();
  }

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`} id="navbar">
      <div className="container nav-inner">
        <Link href="/" className="nav-logo">
          <div className="nav-logo-badge"><span>S</span></div>
          <span className="nav-logo-text">Safra</span>
        </Link>

        <div className="nav-links">
          <Link href="/" className={`nav-link${pathname === '/' ? ' active' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9"/><path d="M9 20v-5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v5"/></svg>
            Home
          </Link>
          <Link href="/houses" className={`nav-link${pathname.startsWith('/houses') ? ' active' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 21V9l8-6 8 6v12"/><path d="M9 21v-7h6v7"/></svg>
            Houses
          </Link>
          <Link href="/cars" className={`nav-link${pathname.startsWith('/cars') ? ' active' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 13.5 4.5 8A2 2 0 0 1 6.4 6.5h11.2A2 2 0 0 1 19.5 8L21 13.5"/><path d="M3 13.5h18V17a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3.5Z"/><circle cx="7.5" cy="17" r="1.4"/><circle cx="16.5" cy="17" r="1.4"/></svg>
            Cars
          </Link>
        </div>

        <div className="nav-auth">
          {!checked ? null : user ? (
            <div className="nav-user" ref={userMenuRef}>
              <button
                type="button"
                className="nav-user-trigger"
                onClick={() => setUserMenuOpen((open) => !open)}
              >
                <span className="nav-user-name">{user.name}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              <div className={`nav-user-menu${userMenuOpen ? ' open' : ''}`}>
                <Link href="/wishlist">Wishlist</Link>
                <Link href="/my-bookings">My Bookings</Link>
                <a href="#" onClick={handleLogoutClick}>Log out</a>
              </div>
            </div>
          ) : (
            <>
              <Link href="/login" className="nav-auth-login">Login</Link>
              <Link href="/signup" className="nav-auth-signup">Sign Up</Link>
            </>
          )}
        </div>

        <button
          className="nav-toggle"
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((open) => !open)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d={mobileOpen ? 'M6 6l12 12M18 6 6 18' : 'M3 6h18M3 12h18M3 18h18'} />
          </svg>
        </button>
      </div>

      <div className="container">
        <div className={`mobile-menu${mobileOpen ? ' open' : ''}`}>
          <Link href="/" onClick={closeMobile}>Home</Link>
          <Link href="/houses" onClick={closeMobile}>Houses</Link>
          <Link href="/cars" onClick={closeMobile}>Cars</Link>
          <div className="divider"></div>
          {!checked ? null : user ? (
            <>
              <div className="mobile-menu-user">{user.name}</div>
              <Link href="/wishlist" onClick={closeMobile}>Wishlist</Link>
              <Link href="/my-bookings" onClick={closeMobile}>My Bookings</Link>
              <a href="#" onClick={handleLogoutClick}>Log out</a>
            </>
          ) : (
            <>
              <Link href="/login" onClick={closeMobile}>Login</Link>
              <Link href="/signup" onClick={closeMobile}>Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
