"use client";

import { useEffect, useState } from "react";
import { getApiBaseUrl } from "@/lib/config";

export default function FaqPage() {
  const [faqs, setFaqs] = useState(null);
  const [error, setError] = useState("");
  const [openIds, setOpenIds] = useState({});

  useEffect(() => {
    async function loadFaqs() {
      try {
        const API = getApiBaseUrl();
        const res = await fetch(`${API}/api/faq`);
        if (!res.ok) {
          setError("Could not load FAQs right now. Please try again later.");
          return;
        }
        const data = await res.json();
        let list = data.faqs || data || [];
        list = [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setFaqs(list);
      } catch (err) {
        setError("Could not reach the server. Please try again later.");
      }
    }
    loadFaqs();
  }, []);

  function toggle(id) {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <main className="faq-page">
      <h1>Frequently Asked Questions</h1>

      {faqs === null && !error && <div id="loading-state">Loading…</div>}
      {error && <div id="loading-state">{error}</div>}
      {faqs && faqs.length === 0 && (
        <div id="empty-state" style={{ display: "block" }}>
          No FAQs published yet — check back soon.
        </div>
      )}

      {faqs && faqs.length > 0 && (
        <div id="faq-list" className="faq-list">
          {faqs.map((faq) => {
            const isOpen = !!openIds[faq._id];
            return (
              <div className={`faq-item card-style${isOpen ? " open" : ""}`} key={faq._id}>
                <button type="button" className="faq-question" onClick={() => toggle(faq._id)}>
                  <span>{faq.question || ""}</span>
                  <span className="chevron">▾</span>
                </button>
                <div
                  className="faq-answer"
                  style={{ maxHeight: isOpen ? "500px" : "0" }}
                >
                  {faq.answer || ""}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="contact-cta">
        Still have questions? <a href="/contact">Get in touch</a>.
      </p>
    </main>
  );
}
