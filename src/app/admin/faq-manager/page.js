"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getApiBaseUrl } from "@/lib/config";

export default function AdminFaqManagerPage() {
  const router = useRouter();
  const [faqs, setFaqs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyIds, setBusyIds] = useState({});
  const [edits, setEdits] = useState({});
  const [newFaq, setNewFaq] = useState({ question: "", answer: "", order: "0" });
  const [adding, setAdding] = useState(false);

  const API = getApiBaseUrl();

  async function loadFaqs() {
    try {
      const res = await fetch(`${API}/api/admin/faq`, { credentials: "include" });

      if (res.status === 401 || res.status === 403) {
        router.replace("/admin/login");
        return;
      }
      if (!res.ok) {
        setError("Failed to load FAQs.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setFaqs(data);
      const nextEdits = {};
      data.forEach((f) => {
        nextEdits[f._id] = {
          question: f.question || "",
          answer: f.answer || "",
          order: String(f.order ?? 0),
        };
      });
      setEdits(nextEdits);
      setLoading(false);
    } catch (err) {
      setError("Failed to load FAQs.");
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFaqs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateEdit(id, field, value) {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  async function saveFaq(id) {
    const e = edits[id];
    setBusyIds((prev) => ({ ...prev, [id]: true }));
    try {
      await fetch(`${API}/api/admin/faq/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          question: e.question,
          answer: e.answer,
          order: Number(e.order) || 0,
        }),
      });
      await loadFaqs();
    } finally {
      setBusyIds((prev) => ({ ...prev, [id]: false }));
    }
  }

  async function deleteFaq(id) {
    if (!window.confirm("Delete this FAQ?")) return;
    setBusyIds((prev) => ({ ...prev, [id]: true }));
    try {
      await fetch(`${API}/api/admin/faq/${id}`, { method: "DELETE", credentials: "include" });
      await loadFaqs();
    } finally {
      setBusyIds((prev) => ({ ...prev, [id]: false }));
    }
  }

  async function addFaq() {
    const question = newFaq.question.trim();
    const answer = newFaq.answer.trim();
    const order = Number(newFaq.order) || 0;
    if (!question || !answer) {
      window.alert("Question and answer are required.");
      return;
    }
    setAdding(true);
    try {
      await fetch(`${API}/api/admin/faq`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ question, answer, order }),
      });
      setNewFaq({ question: "", answer: "", order: "0" });
      await loadFaqs();
    } finally {
      setAdding(false);
    }
  }

  return (
    <>
      <h1>Manage FAQ</h1>
      {error && <div id="status">{error}</div>}

      <div id="add-form">
        <h3>Add new FAQ</h3>
        <input
          type="text"
          placeholder="Question"
          value={newFaq.question}
          onChange={(e) => setNewFaq((prev) => ({ ...prev, question: e.target.value }))}
        />
        <textarea
          placeholder="Answer"
          rows={3}
          value={newFaq.answer}
          onChange={(e) => setNewFaq((prev) => ({ ...prev, answer: e.target.value }))}
        />
        <input
          type="number"
          placeholder="Order (e.g. 1)"
          value={newFaq.order}
          onChange={(e) => setNewFaq((prev) => ({ ...prev, order: e.target.value }))}
        />
        <button disabled={adding} onClick={addFaq}>
          Add FAQ
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {!loading && faqs && faqs.length === 0 && <p>No FAQs yet.</p>}

      {!loading && faqs && faqs.length > 0 && (
        <div id="faq-list">
          {faqs.map((f) => {
            const e = edits[f._id] || { question: "", answer: "", order: "0" };
            const busy = !!busyIds[f._id];
            return (
              <div className="faq-card" key={f._id}>
                <input
                  type="text"
                  value={e.question}
                  onChange={(ev) => updateEdit(f._id, "question", ev.target.value)}
                />
                <textarea
                  rows={3}
                  value={e.answer}
                  onChange={(ev) => updateEdit(f._id, "answer", ev.target.value)}
                />
                <input
                  type="number"
                  style={{ width: "100px" }}
                  value={e.order}
                  onChange={(ev) => updateEdit(f._id, "order", ev.target.value)}
                />
                <div className="faq-actions">
                  <button disabled={busy} onClick={() => saveFaq(f._id)}>
                    Save
                  </button>
                  <button disabled={busy} onClick={() => deleteFaq(f._id)}>
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
