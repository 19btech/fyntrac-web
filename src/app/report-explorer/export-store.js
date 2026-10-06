"use client";

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { saveBlob } from './report-api';

/**
 * Background CSV exports for the Report Explorer.
 *
 * Jobs run outside React so they keep going while the user switches reports or
 * tabs. Finished files are kept in IndexedDB (per tenant + user) so the
 * "Exported" tab can offer them again later, including after a reload.
 *
 * job: { id, scope, name, reportName, kind: 'page' | 'all', status: 'running' | 'done' | 'failed',
 *        progress (0–1), rowCount, size, createdAt, error }
 */

const DB_NAME = 'fyntrac-report-exports';
const STORE = 'exports';
const MAX_KEPT = 50;

let jobs = [];
let loadedScope = null;
const blobs = new Map(); // id → Blob for files created in this tab (IndexedDB holds the rest)
const listeners = new Set();

const emit = () => listeners.forEach((l) => l());
const setJobs = (next) => {
  jobs = next;
  emit();
};
const patchJob = (id, patch) => setJobs(jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)));

// ---- IndexedDB (best effort: exports still work for this session without it)
const openDb = () =>
  new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB unavailable'));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const store = req.result.createObjectStore(STORE, { keyPath: 'id' });
      store.createIndex('scope', 'scope');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const idb = async (mode, fn) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const result = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(result?.result ?? result);
    tx.onerror = () => reject(tx.error);
  });
};

const persist = (record) => idb('readwrite', (s) => s.put(record)).catch((e) => console.warn('Export not persisted:', e.message));
const unpersist = (id) => idb('readwrite', (s) => s.delete(id)).catch(() => {});

const loadScope = async (scope) => {
  if (loadedScope === scope) return;
  loadedScope = scope;
  try {
    const records = await idb('readonly', (s) => s.index('scope').getAll(scope));
    const stored = (records || []).map(({ blob, ...meta }) => meta);
    // Keep any jobs started in this tab; add stored ones that aren't already listed.
    const known = new Set(jobs.map((j) => j.id));
    setJobs([...jobs.filter((j) => j.scope === scope), ...stored.filter((r) => !known.has(r.id))]
      .sort((a, b) => b.createdAt - a.createdAt));
  } catch {
    setJobs(jobs.filter((j) => j.scope === scope));
  }
};

const readBlob = async (id) => {
  if (blobs.has(id)) return blobs.get(id);
  const record = await idb('readonly', (s) => s.get(id));
  return record?.blob ?? null;
};

/**
 * Start an export. `build(onProgress)` must resolve to { blob, rowCount }.
 * The file downloads automatically when it's ready.
 */
export const startExport = ({ scope, name, reportName, kind, fileName, build }) => {
  const id = `exp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const job = { id, scope, name, reportName, kind, fileName, status: 'running', progress: 0, rowCount: null, size: null, createdAt: Date.now(), error: null };
  setJobs([job, ...jobs]);

  let lastReported = 0;
  const onProgress = (p) => {
    // Throttle re-renders to ~every 5%.
    if (p - lastReported >= 0.05 || p >= 1) {
      lastReported = p;
      patchJob(id, { progress: Math.min(1, p) });
    }
  };

  Promise.resolve()
    .then(() => build(onProgress))
    .then(({ blob, rowCount }) => {
      blobs.set(id, blob);
      const done = { ...jobs.find((j) => j.id === id), status: 'done', progress: 1, rowCount, size: blob.size, finishedAt: Date.now() };
      patchJob(id, done);
      saveBlob(blob, fileName);
      persist({ ...done, blob });
      // Trim old exports.
      jobs.filter((j) => j.scope === scope && j.status !== 'running').slice(MAX_KEPT).forEach((j) => removeExport(j.id));
    })
    .catch((err) => {
      console.error('Export failed:', err);
      patchJob(id, { status: 'failed', error: err?.message || 'Export failed' });
    });
  return id;
};

export const removeExport = (id) => {
  blobs.delete(id);
  setJobs(jobs.filter((j) => j.id !== id));
  unpersist(id);
};

export const downloadExport = async (id) => {
  const job = jobs.find((j) => j.id === id);
  const blob = await readBlob(id);
  if (!job || !blob) throw new Error('This file is no longer available. Export it again.');
  saveBlob(blob, job.fileName);
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const EMPTY = [];

export function useExports(scope) {
  useEffect(() => { loadScope(scope); }, [scope]);
  const all = useSyncExternalStore(subscribe, () => jobs, () => EMPTY);
  const list = all.filter((j) => j.scope === scope);
  const start = useCallback((job) => startExport({ ...job, scope }), [scope]);
  return { exports: list, startExport: start, removeExport, downloadExport };
}
