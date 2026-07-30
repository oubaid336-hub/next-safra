"use client";

import { useState } from "react";
import Link from "next/link";
import { getApiBaseUrl } from "@/lib/config";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resendStatus, setResendStatus] = useState("");
  const [resendLoading, setResendLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) return setError("Please enter your name.");
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return setError("Please enter a valid email address.");
    }
    if (password.length < 8) {
      return setError("Password must be at least 8 characters.");
    }

    setLoading(true);
    const API = getApiBaseUrl();

    try {
      const res = await fetch(`${API}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: trimmedName, email: trimmedEmail, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data.message || data.error || "";
        if (/email.*exists|already.*use|duplicate/i.test(msg)) {
          setError("An account with that email already exists. Try logging in.");
        } else if (msg) {
          setError(msg);
        } else {
          setError(`Signup failed (${res.status}). Please try again.`);
        }
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError("Network error. Check your connection and try again.");
      setLoading(false);
    }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    setResendLoading(true);
    const API = getApiBaseUrl();
    try {
      await fetch(`${API}/api/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      setResendStatus("If needed, a new link has been sent.");
    } catch (err) {
      setResendStatus("Network error, try again.");
    }
    setResendLoading(false);
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
          {!success ? (
            <>
              <h1>Create your account</h1>
              <p className="subtitle">Start exploring Tunisia in minutes</p>

              {error && <div className="form-banner error show">{error}</div>}

              <form onSubmit={handleSubmit} noValidate>
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="form-input"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-input"
                    required
                    autoComplete="email"
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
                    autoComplete="new-password"
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <div className="hint">At least 8 characters</div>
                </div>

                <button
                  type="submit"
                  className={`btn btn-terracotta auth-submit${loading ? " is-loading" : ""}`}
                  disabled={loading}
                >
                  Sign Up
                </button>
              </form>

              <div className="auth-switch">
                Already have an account? <Link href="/login">Login</Link>
              </div>
            </>
          ) : (
            <div className="auth-success show">
              <div className="check">✓</div>
              <h2>Check your email</h2>
              <p>
                We sent a verification link to <strong>{email.trim()}</strong>. Click it to activate your account, then come back to log in.
              </p>
              <Link href="/login" className="btn btn-terracotta auth-submit">Go to Login</Link>
              <div className="auth-switch">
                Didn&apos;t get it?{" "}
                <a href="#" onClick={handleResend}>
                  {resendLoading ? "Sending..." : "Resend verification email"}
                </a>
              </div>
              {resendStatus && <div className="auth-switch">{resendStatus}</div>}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
