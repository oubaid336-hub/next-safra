"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getApiBaseUrl } from "@/lib/config";

export default function AdminContactMessagesPage() {
  const router = useRouter();
  const [messages, setMessages] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyIds, setBusyIds] = useState({});

  const API = getApiBaseUrl();

  async function loadMessages() {
    try {
      const res = await fetch(`${API}/api/admin/contact-messages`, { credentials: "include" });

      if (res.status === 401 || res.status === 403) {
        router.replace("/admin/login");
        return;
      }
      if (!res.ok) {
        setError("Failed to load messages.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      const sorted = [...data].sort((a, b) => (a.handled === b.handled ? 0 : a.handled ? 1 : -1));
      setMessages(sorted);
      setLoading(false);
    } catch (err) {
      setError("Failed to load messages.");
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleHandled(id, handled) {
    setBusyIds((prev) => ({ ...prev, [id]: true }));
    try {
      await fetch(`${API}/api/admin/contact-messages/${id}/handled`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ handled }),
      });
      await loadMessages();
    } finally {
      setBusyIds((prev) => ({ ...prev, [id]: false }));
    }
  }

  async function deleteMessage(id) {
    if (!window.confirm("Delete this message?")) return;
    setBusyIds((prev) => ({ ...prev, [id]: true }));
    try {
      await fetch(`${API}/api/admin/contact-messages/${id}`, { method: "DELETE", credentials: "include" });
      await loadMessages();
    } finally {
      setBusyIds((prev) => ({ ...prev, [id]: false }));
    }
  }

  return (
    <>
      <h1>Contact Messages</h1>
      {error && <div id="status">{error}</div>}

      {loading && <p>Loading...</p>}
      {!loading && messages && messages.length === 0 && <p>No messages yet.</p>}

      {!loading && messages && messages.length > 0 && (
        <div id="messages-list">
          {messages.map((m) => {
            const busy = !!busyIds[m._id];
            const date = new Date(m.createdAt).toLocaleString();
            return (
              <div className={`msg-card${m.handled ? " handled" : ""}`} key={m._id}>
                <div className="msg-header">
                  <strong>{m.name}</strong>
                  <span className={`badge ${m.handled ? "handled" : "new"}`}>
                    {m.handled ? "Handled" : "New"}
                  </span>
                </div>
                <p>{m.email}</p>
                <p>{m.message}</p>
                <small>{date}</small>
                <div className="msg-actions">
                  <button disabled={busy} onClick={() => toggleHandled(m._id, !m.handled)}>
                    {m.handled ? "Mark unhandled" : "Mark handled"}
                  </button>
                  <button disabled={busy} onClick={() => deleteMessage(m._id)}>
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
