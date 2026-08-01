"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getApiBaseUrl } from "@/lib/config";

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("loading"); // loading | success | error
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");

  useEffect(() => {
    async function verify() {
      if (!token) {
        setStatus("error");
        setTitle("Invalid link");
        setSubtitle("No verification token was found in this link.");
        return;
      }
      try {
        const API = getApiBaseUrl();
        const res = await fetch(`${API}/api/auth/verify/${token}`);
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setStatus("error");
          setTitle("Verification failed");
          setSubtitle(data.message || "This link is invalid or has expired.");
          return;
        }

        setStatus("success");
        setTitle("Email verified!");
        setSubtitle("You're all set and logged in. Redirecting...");
        setTimeout(() => {
          window.location.replace("/");
        }, 2000);
      } catch (err) {
        setStatus("error");
        setTitle("Network error");
        setSubtitle("Check your connection and try refreshing this page.");
      }
    }
    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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
          {status === "loading" && (
            <>
              <div className="verify-spinner"></div>
              <h1>Verifying your email...</h1>
              <p className="subtitle">Just a moment</p>
            </>
          )}

          {status !== "loading" && (
            <>
              {status === "error" && <div className="auth-error show">{subtitle}</div>}
              {status === "success" && <div className="auth-success show">{subtitle}</div>}
              <h1>{title}</h1>
              <p className="subtitle">{subtitle}</p>
              {status === "error" && (
                <Link href="/login" className="btn btn-terracotta auth-submit">
                  Go to Login
                </Link>
              )}
            </>
          )}

          <div className="auth-switch">
            <Link href="/signup">Back to signup</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="auth-page"><main className="auth-main"></main></div>}>
      <VerifyEmailInner />
    </Suspense>
  );
}
