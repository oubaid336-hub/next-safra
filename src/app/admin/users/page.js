"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getApiBaseUrl } from "@/lib/config";

function isUserBlocked(user) {
  if (typeof user.isBlocked === "boolean") return user.isBlocked;
  if (typeof user.blocked === "boolean") return user.blocked;
  if (typeof user.status === "string") return user.status === "blocked";
  return false;
}

function getDisplayName(user) {
  return user.name || user.email || "Unknown user";
}

function sortUsers(users) {
  const roleOrder = { admin: 0, customer: 1 };
  return [...users].sort((a, b) => {
    const roleDiff = (roleOrder[a.role] ?? 2) - (roleOrder[b.role] ?? 2);
    if (roleDiff !== 0) return roleDiff;
    return getDisplayName(a).localeCompare(getDisplayName(b));
  });
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState(null);
  const [currentAdminId, setCurrentAdminId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyIds, setBusyIds] = useState({});

  const API = getApiBaseUrl();

  async function loadCurrentAdminId() {
    try {
      const res = await fetch(`${API}/api/auth/me`, { credentials: "include" });
      if (!res.ok) return null;
      const data = await res.json();
      const user = data.user || data;
      return user._id || user.id || null;
    } catch (err) {
      console.error("Failed to load current admin identity:", err);
      return null;
    }
  }

  async function loadAll() {
    try {
      const [me, res] = await Promise.all([
        currentAdminId ? Promise.resolve(currentAdminId) : loadCurrentAdminId(),
        fetch(`${API}/api/admin/users`, { credentials: "include" }),
      ]);
      setCurrentAdminId(me);

      if (res.status === 401 || res.status === 403) {
        router.replace("/admin/login");
        return;
      }
      if (!res.ok) {
        setError("Something went wrong loading users. Please try again.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setUsers(sortUsers(data || []));
      setLoading(false);
    } catch (err) {
      console.error("Failed to load users:", err);
      setError("Something went wrong loading users. Please try again.");
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setBlockedState(id, action) {
    setBusyIds((prev) => ({ ...prev, [id]: true }));
    setError("");

    try {
      const res = await fetch(`${API}/api/admin/users/${id}/${action}`, {
        method: "PUT",
        credentials: "include",
      });

      if (res.status === 401 || res.status === 403) {
        router.replace("/admin/login");
        return;
      }
      if (!res.ok) {
        setError("Something went wrong updating that user. Please try again.");
        setBusyIds((prev) => ({ ...prev, [id]: false }));
        return;
      }
      await loadAll();
      setBusyIds((prev) => ({ ...prev, [id]: false }));
    } catch (err) {
      console.error(`Failed to ${action} user ${id}:`, err);
      setError("Something went wrong updating that user. Please try again.");
      setBusyIds((prev) => ({ ...prev, [id]: false }));
    }
  }

  async function deleteUser(id, name) {
    const confirmed = window.confirm(`Delete "${name}" permanently? This can't be undone.`);
    if (!confirmed) return;

    setBusyIds((prev) => ({ ...prev, [id]: true }));
    setError("");

    try {
      const res = await fetch(`${API}/api/admin/users/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.status === 401 || res.status === 403) {
        router.replace("/admin/login");
        return;
      }
      if (!res.ok) {
        setError("Something went wrong deleting that user. Please try again.");
        setBusyIds((prev) => ({ ...prev, [id]: false }));
        return;
      }
      await loadAll();
      setBusyIds((prev) => ({ ...prev, [id]: false }));
    } catch (err) {
      console.error(`Failed to delete user ${id}:`, err);
      setError("Something went wrong deleting that user. Please try again.");
      setBusyIds((prev) => ({ ...prev, [id]: false }));
    }
  }

  return (
    <>
      <h1>Manage Users</h1>
      <p className="sub">Block, unblock, or remove accounts.</p>
      <div className="scope-note">
        <strong>Blocking or deleting a user takes effect on their next login, not instantly.</strong>
        Existing sessions stay active until they log out or the cookie expires.
      </div>

      {error && <div id="statusBanner" className="show">{error}</div>}
      {loading && <p id="loadingMsg">Loading users...</p>}
      {!loading && users && users.length === 0 && <p id="emptyMsg">No users found.</p>}

      {!loading && users && users.length > 0 && (
        <div id="usersList">
          {users.map((user) => {
            const busy = !!busyIds[user._id];
            const isSelf = currentAdminId && user._id === currentAdminId;
            const blocked = isUserBlocked(user);
            const showEmailSeparately = user.name && user.email;

            return (
              <div className="user-card" key={user._id}>
                <div className="user-info">
                  <div className="name-line">{getDisplayName(user)}</div>
                  {showEmailSeparately && <div className="meta">{user.email}</div>}
                </div>

                <div className="tag-row">
                  <span className={`tag ${user.role === "admin" ? "role-admin" : "role-customer"}`}>
                    {user.role || "customer"}
                  </span>
                  <span className={`tag ${blocked ? "status-blocked" : "status-active"}`}>
                    {blocked ? "blocked" : "active"}
                  </span>
                  {user.verified === false && <span className="tag unverified">unverified</span>}
                  {isSelf && <span className="tag self-tag">you</span>}
                </div>

                <div className="user-actions">
                  <button
                    className={blocked ? "unblock-btn" : "block-btn"}
                    disabled={busy || isSelf}
                    onClick={() => setBlockedState(user._id, blocked ? "unblock" : "block")}
                  >
                    {blocked ? "Unblock" : "Block"}
                  </button>
                  <button
                    className="delete-btn"
                    disabled={busy || isSelf}
                    onClick={() => deleteUser(user._id, getDisplayName(user))}
                  >
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
