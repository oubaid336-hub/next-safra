import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">
              <div className="footer-brand-badge"><span>S</span></div>
              <span className="footer-brand-name">Safra</span>
            </div>
            <p className="desc">Discover Tunisia&apos;s beauty with curated stays and reliable car rentals. Your journey starts here.</p>
          </div>
          <div>
            <h3>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/></svg>
              Quick Links
            </h3>
            <div className="footer-links">
              <Link href="/houses">Houses</Link>
              <Link href="/cars">Cars</Link>
              <Link href="/">Home</Link>
              <Link href="/faq">FAQ</Link>
            </div>
          </div>
          <div>
            <h3>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
              Contact
            </h3>
            <div className="footer-links">
              <Link href="/contact">Contact Us</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">&copy; 2026 Safra. Discover Tunisia, Your Way.</div>
      </div>
    </footer>
  );
}
