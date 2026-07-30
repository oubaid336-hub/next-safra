'use client';

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../lib/config';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE_URL}/api/auth/me`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data && data.user && data.user.name) {
          setUser(data.user);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function logout() {
    return fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).finally(() => {
      window.location.href = '/login';
    });
  }

  return { user, checked, logout };
}
