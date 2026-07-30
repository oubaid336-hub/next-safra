"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getApiBaseUrl } from "@/lib/config";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    const API = getApiBaseUrl();

    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: trimmedEmail, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = (data.message || data.error || "").toLowerCase();
        if (res.status === 403 && /blocked/i.test(msg)) {
          setError("This account has been blocked. Please contact support.");
        } else if (/verify/i.test(msg)) {
          setError("Please verify your email first. Check your inbox for the verification link.");
        } else if (/invalid|credentials|password|email/i.test(msg)) {
          setError("Invalid email or password.");
        } else if (msg) {
          setError(data.message || data.error);
        } else {
          setError(`Login failed (${res.status}). Please try again.`);
        }
        setLoading(false);
        return;
      }

      router.replace("/");
    } catch (err) {
      setError("Network error. Check your connection and try again.");
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <main className="auth-main">
        <img
          className="auth-bg"
          src="https://images.unsplash.com/photo-1565073185544-0fe2d7e7eb1d?w=1920&q=80"
          alt="Sidi Bou Said, Tunisia"
        />
        <div className="auth-overlay"></div>

        <div className="auth-card">
          <h1>Welcome back</h1>
          <p className="subtitle">Log in to continue your Tunisia journey</p>

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
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group with-link">
              <label htmlFor="password">Password</label>
              <Link href="/forgot-password" className="forgot-link">Forgot password?</Link>
              <input
                type="password"
                id="password"
                name="password"
                className="form-input"
                required
                autoComplete="current-password"
                placeholder="••••••••"
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

          <div className="auth-switch">
            Don&apos;t have an account? <Link href="/signup">Sign Up</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
