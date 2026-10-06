import { CLOSE_DAYS, localTimeZone, modernZoneName } from './schedule';

/**
 * Cron Jobs service contract (dataloader, per tenant) — not built yet:
 *
 *   GET    /cron-jobs/model-execution            -> ModelExecution
 *   PUT    /cron-jobs/model-execution            ModelExecution -> ModelExecution
 *
 *   GET    /cron-jobs/accounting-close           -> AccountingClose
 *   PUT    /cron-jobs/accounting-close           AccountingClose -> AccountingClose
 *
 *   ModelExecution:  { enabled, frequency: 'daily' | 'monthly',
 *                      monthlyRule: 'monthEnd' | 'beforeMonthEnd' | 'afterMonthEnd', offsetDays,
 *                      time: 'HH:mm', timeZone (IANA), updatedAt }
 *   AccountingClose: { enabled, time: 'HH:mm', timeZone (IANA), mode: 'same' | 'perMonth',
 *                      days, perMonth: [12 numbers, January first], updatedAt }
 *
 * Each tenant has exactly one of each job: it is configured and switched on or off, never
 * created or deleted.
 *
 * Until the service exists this module keeps the configuration in the browser (per tenant),
 * behind the same async functions, so the screens don't change when it is swapped in.
 */

export const defaultModelExecution = () => ({
  enabled: false,
  frequency: 'daily',
  monthlyRule: 'monthEnd',
  offsetDays: 3,
  time: '18:00',
  timeZone: localTimeZone(),
  updatedAt: null,
});

export const defaultClose = () => ({
  enabled: false,
  time: '01:00',
  timeZone: localTimeZone(),
  mode: 'same',
  days: 5,
  perMonth: Array(12).fill(5),
  updatedAt: null,
});

const memory = new Map(); // fallback when browser storage is unavailable
const keyFor = (tenant) => `fyntrac.cronJobs.${tenant || 'default'}`;

const read = (tenant) => {
  const key = keyFor(tenant);
  let stored = memory.get(key);
  try {
    const raw = window.localStorage.getItem(key);
    if (raw) stored = JSON.parse(raw);
  } catch {
    // storage blocked or corrupt: use what is in memory
  }
  // Earlier builds stored a list of named schedules; the first one becomes the job.
  const legacy = Array.isArray(stored?.modelSchedules) ? stored.modelSchedules[0] : null;
  const { id, name, createdAt, ...legacyJob } = legacy ?? {};
  const modelExecution = { ...defaultModelExecution(), ...legacyJob, ...(stored?.modelExecution ?? {}) };
  const accountingClose = { ...defaultClose(), ...(stored?.accountingClose ?? {}) };
  // Zones saved under a retired name (e.g. Asia/Calcutta) come back under the name the picker lists.
  return {
    modelExecution: { ...modelExecution, timeZone: modernZoneName(modelExecution.timeZone) },
    accountingClose: { ...accountingClose, timeZone: modernZoneName(accountingClose.timeZone) },
  };
};

const write = (tenant, data) => {
  const key = keyFor(tenant);
  memory.set(key, data);
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // kept in memory for this session
  }
};

const settle = () => new Promise((resolve) => { setTimeout(resolve, 150); });

export const fetchModelExecution = async (tenant) => {
  await settle();
  return read(tenant).modelExecution;
};

export const saveModelExecution = async (tenant, config) => {
  await settle();
  const data = read(tenant); // read() already folds in (and so drops) the legacy list
  const saved = { ...config, updatedAt: new Date().toISOString() };
  write(tenant, { ...data, modelExecution: saved });
  return saved;
};

export const fetchAccountingClose = async (tenant) => {
  await settle();
  const close = read(tenant).accountingClose;
  // Guard against a stored config with a short / malformed month list.
  const perMonth = Array.from({ length: 12 }, (_, i) => close.perMonth?.[i] ?? close.days ?? CLOSE_DAYS.min);
  return { ...close, perMonth };
};

export const saveAccountingClose = async (tenant, config) => {
  await settle();
  const data = read(tenant);
  const saved = { ...config, updatedAt: new Date().toISOString() };
  write(tenant, { ...data, accountingClose: saved });
  return saved;
};

export const errorMessage = (err, fallback) => err?.response?.data?.message || err?.message || fallback;
