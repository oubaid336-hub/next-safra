"use client";

import { useState } from "react";
import { getApiBaseUrl } from "@/lib/config";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [banner, setBanner] = useState({ type: "", text: "" });
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const errors = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName) errors.name = "Please enter your name.";

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail) {
      errors.email = "Please enter your email.";
    } else if (!emailPattern.test(trimmedEmail)) {
      errors.email = "Please enter a valid email address.";
    }

    if (!trimmedMessage) {
      errors.message = "Please enter a message.";
    } else if (trimmedMessage.length < 10) {
      errors.message = "Message should be at least 10 characters.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0
      ? { name: trimmedName, email: trimmedEmail, message: trimmedMessage }
      : null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBanner({ type: "", text: "" });

    const data = validate();
    if (!data) return;

    setSubmitting(true);
    try {
      const API = getApiBaseUrl();
      const res = await fetch(`${API}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setBanner({
          type: "success",
          text: "Thanks - your message has been sent. We'll get back to you soon.",
        });
        setName("");
        setEmail("");
        setMessage("");
        setFieldErrors({});
      } else if (res.status === 400) {
        setBanner({ type: "error", text: "Please check your details and try again." });
      } else {
        setBanner({
          type: "error",
          text: "Something went wrong sending your message. Please try again in a moment.",
        });
      }
    } catch (err) {
      setBanner({
        type: "error",
        text: "Something went wrong sending your message. Please try again in a moment.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className="contact-hero">
        <h1>Get in Touch</h1>
        <p>Questions about a booking, a listing, or anything else? Send us a message and we&apos;ll get back to you.</p>
      </section>

      <main className="contact-wrap">
        {banner.text && (
          <div className={`form-banner show ${banner.type}`} role="alert" aria-live="polite">
            {banner.text}
          </div>
        )}

        <form className="contact-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="field-error">{fieldErrors.name || ""}</div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="field-error">{fieldErrors.email || ""}</div>
          </div>

          <div className="form-group">
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              name="message"
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <div className="field-error">{fieldErrors.message || ""}</div>
          </div>

          <button type="submit" className="contact-submit" disabled={submitting}>
            {submitting ? "Sending..." : "Send Message"}
          </button>
        </form>
      </main>
    </>
  );
}
