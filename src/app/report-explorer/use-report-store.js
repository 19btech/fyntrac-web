"use client";

import { useCallback, useEffect, useState } from 'react';
import { useTenant } from '../tenant-context';

/**
 * Favourite reports.
 *
 * There is no backend endpoint for these yet, so they are kept in localStorage,
 * scoped per tenant + user. To move them server-side, replace readStore/writeStore
 * with reportingApi calls — the hook's interface can stay the same.
 */

const readStore = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeStore = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or blocked — favourites simply won't persist
  }
};

export function useReportStore() {
  const { tenant, user } = useTenant();
  const scope = `${tenant || 'default'}:${user?.id || user?.email || 'anon'}`;
  const favKey = `reportExplorer.favorites.${scope}`;

  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    setFavorites(readStore(favKey, []));
  }, [favKey]);

  const toggleFavorite = useCallback(
    (id) => {
      setFavorites((prev) => {
        const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
        writeStore(favKey, next);
        return next;
      });
    },
    [favKey]
  );

  return { favorites, toggleFavorite };
}
