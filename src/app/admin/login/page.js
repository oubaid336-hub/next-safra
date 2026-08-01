"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getApiBaseUrl } from "@/lib/config";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const API = getApiBaseUrl();
    async function checkAlreadyAdmin() {
      try {
        const res = await fetch(`${API}/api/admin/dashboard`, {
          credentials: "include",
        });
        if (res.ok) {
          router.replace("/admin/dashboard");
          return;
        }
      } catch (err) {
        // not logged in / network error - show the form as normal
      }
      setChecking(false);
    }
    checkAlreadyAdmin();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    const API = getApiBaseUrl();

    try {
      const loginRes = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      if (!loginRes.ok) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }

      const dashboardRes = await fetch(`${API}/api/admin/dashboard`, {
        credentials: "include",
      });

      if (dashboardRes.status === 403) {
        setError("This account doesn't have admin access.");
        setLoading(false);
        return;
      }

      if (!dashboardRes.ok) {
        setError("Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      router.push("/admin/dashboard");
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (checking) {
    return <div className="admin-page"></div>;
  }

  return (
    <div className="admin-page">
      <div className="auth-card">
        <h1>Safra Admin</h1>
        <p className="subtitle">Staff sign-in only</p>

        {error && <div className="form-banner error show">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-input"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className={`btn btn-terracotta auth-submit${loading ? " is-loading" : ""}`}
            disabled={loading}
          >
            Log In
          </button>
        </form>
      </div>
    </div>
  );
}
