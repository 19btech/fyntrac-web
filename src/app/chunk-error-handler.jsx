'use client';
import { useEffect } from 'react';

/**
 * Silently reloads the page when a ChunkLoadError is detected.
 * This happens when the browser has cached old chunk URLs but the dev server
 * has recompiled with new hashes. A single reload fetches fresh chunks.
 * A 15-second guard prevents infinite reload loops if the server is down.
 */
export default function ChunkErrorHandler() {
  useEffect(() => {
    const handleError = (event) => {
      const isChunkError =
        event.error?.name === 'ChunkLoadError' ||
        (event.message?.includes('Loading chunk') && event.message?.includes('failed'));

      if (!isChunkError) return;

      // Guard: only reload once per 15 seconds to avoid infinite loops
      const lastReload = sessionStorage.getItem('_chunk_reload_at');
      const now = Date.now();
      if (lastReload && now - parseInt(lastReload, 10) < 15000) return;

      console.warn('[ChunkErrorHandler] Stale chunk detected — reloading...');
      sessionStorage.setItem('_chunk_reload_at', String(now));
      window.location.reload();
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  return null;
}
