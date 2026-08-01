"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getApiBaseUrl } from "@/lib/config";

const ADMIN_LINKS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/houses", label: "Houses & Cars" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/faq-manager", label: "FAQ" },
  { href: "/admin/contact-messages", label: "Contact Messages" },
  { href: "/admin/support-settings", label: "Support Settings" },
  { href: "/admin/site-settings", label: "Site Settings" },
  { href: "/admin/featured", label: "Featured Listings" },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    const API = getApiBaseUrl();
    try {
      await fetch(`${API}/api/auth/logout`, { method: "POST", credentials: "include" });
    } catch (err) {
      // ignore, log out client-side regardless
    } finally {
      router.push("/admin/login");
    }
  };

  return (
    <div className="admin-shell">
      <div className="admin-topbar">
        <div className="brand">Safra <span>Admin</span></div>
        <button id="logoutBtn" onClick={handleLogout}>Log Out</button>
      </div>
      <nav className="admin-nav">
        {ADMIN_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className={pathname === link.href ? "active" : ""}>
            {link.label}
          </Link>
        ))}
        <Link href="/">Back to Site</Link>
      </nav>
      <main className="admin-main">{children}</main>
    </div>
  );
}
