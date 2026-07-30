"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getApiBaseUrl } from "@/lib/config";

function RequestView() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    const API = getApiBaseUrl();

    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });
      const data = await res.json().catch(() => ({}));

      // Backend intentionally always returns a generic message here
      // (doesn't reveal whether the email is registered) - show it as-is.
      setSuccess(data.message || "If that email is registered, a reset link has been sent.");
      setEmail("");
    } catch (err) {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1>Forgot your password?</h1>
      <p className="subtitle">Enter your email and we&apos;ll send you a reset link</p>

      {error && <div className="form-banner error show">{error}</div>}
      {success && <div className="form-banner success show">{success}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="reqEmail">Email</label>
          <input
            type="email"
            id="reqEmail"
            name="email"
            className="form-input"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className={`btn btn-terracotta auth-submit${loading ? " is-loading" : ""}`}
          disabled={loading}
        >
          Send Reset Link
        </button>
      </form>

      <div className="auth-switch">
        Remembered it? <Link href="/login">Log in</Link>
      </div>
    </>
  );
}

function ResetView({ token }) {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newPassword || newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const API = getApiBaseUrl();

    try {
      const res = await fetch(`${API}/api/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || "This reset link is invalid or has expired.");
        setLoading(false);
        return;
      }

      setSuccess("Password reset successfully. Redirecting to login...");
      setTimeout(() => { router.replace("/login"); }, 2000);
    } catch (err) {
      setError("Network error. Check your connection and try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <h1>Reset your password</h1>
      <p className="subtitle">Choose a new password for your account</p>

      {error && <div className="form-banner error show">{error}</div>}
      {success && <div className="form-banner success show">{success}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="newPassword">New password</label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            className="form-input"
            required
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm new password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            className="form-input"
            required
            autoComplete="new-password"
            placeholder="Repeat your new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className={`btn btn-terracotta auth-submit${loading ? " is-loading" : ""}`}
          disabled={loading}
        >
          Reset Password
        </button>
      </form>

      <div className="auth-switch">
        <Link href="/login">Back to login</Link>
      </div>
    </>
  );
}

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

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
          {token ? <ResetView token={token} /> : <RequestView />}
        </div>
      </main>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
