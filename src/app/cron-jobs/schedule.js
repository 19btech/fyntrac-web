/**
 * Schedule maths for Cron Jobs: time zones, next run times and validation. Pure functions so
 * the screens and (later) the service agree on what a schedule means.
 *
 * All instants are epoch milliseconds. A schedule's wall-clock time is resolved in its own IANA
 * time zone, including daylight saving: a time that does not exist on a spring-forward day runs
 * at the first valid minute after it; a time that occurs twice on a fall-back day runs once, at
 * the first occurrence.
 */

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));

export const MONTHLY_RULES = [
  { value: 'monthEnd', label: 'Month-end date' },
  { value: 'beforeMonthEnd', label: 'Days before month-end' },
  { value: 'afterMonthEnd', label: 'Days after month-end' },
];

// Before/after month-end offsets stay within 27 days so a run never lands in a neighbouring
// month's window (February has 28 days).
export const MONTHLY_OFFSET = { min: 1, max: 27 };
export const CLOSE_DAYS = { min: 1, max: 60 };

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

// Used only by browsers without Intl.supportedValuesOf.
const FALLBACK_ZONES = [
  'UTC', 'Pacific/Honolulu', 'America/Anchorage', 'America/Los_Angeles', 'America/Denver', 'America/Phoenix',
  'America/Chicago', 'America/New_York', 'America/Toronto', 'America/Mexico_City', 'America/Bogota', 'America/Sao_Paulo',
  'America/Argentina/Buenos_Aires', 'Atlantic/Azores', 'Europe/London', 'Europe/Dublin', 'Europe/Lisbon', 'Europe/Paris',
  'Europe/Berlin', 'Europe/Madrid', 'Europe/Rome', 'Europe/Amsterdam', 'Europe/Zurich', 'Europe/Stockholm', 'Europe/Warsaw',
  'Europe/Athens', 'Europe/Istanbul', 'Europe/Moscow', 'Africa/Cairo', 'Africa/Johannesburg', 'Africa/Lagos', 'Africa/Nairobi',
  'Asia/Dubai', 'Asia/Riyadh', 'Asia/Tehran', 'Asia/Karachi', 'Asia/Kolkata', 'Asia/Kathmandu', 'Asia/Dhaka', 'Asia/Bangkok',
  'Asia/Jakarta', 'Asia/Singapore', 'Asia/Hong_Kong', 'Asia/Shanghai', 'Asia/Manila', 'Asia/Tokyo', 'Asia/Seoul',
  'Australia/Perth', 'Australia/Adelaide', 'Australia/Brisbane', 'Australia/Sydney', 'Pacific/Auckland', 'Pacific/Fiji',
];

// Browsers list some zones under retired IANA names (ICU keeps them as canonical). Show and store
// the current names so a search for "Kolkata" or "Kyiv" finds them; both spellings are valid.
const MODERN_ZONE_NAMES = {
  'Asia/Calcutta': 'Asia/Kolkata',
  'Asia/Katmandu': 'Asia/Kathmandu',
  'Asia/Saigon': 'Asia/Ho_Chi_Minh',
  'Asia/Rangoon': 'Asia/Yangon',
  'Europe/Kiev': 'Europe/Kyiv',
  'America/Godthab': 'America/Nuuk',
  'Pacific/Enderbury': 'Pacific/Kanton',
  'Atlantic/Faeroe': 'Atlantic/Faroe',
  'America/Buenos_Aires': 'America/Argentina/Buenos_Aires',
  'America/Catamarca': 'America/Argentina/Catamarca',
  'America/Cordoba': 'America/Argentina/Cordoba',
  'America/Jujuy': 'America/Argentina/Jujuy',
  'America/Mendoza': 'America/Argentina/Mendoza',
  'America/Indianapolis': 'America/Indiana/Indianapolis',
  'America/Louisville': 'America/Kentucky/Louisville',
  'Pacific/Truk': 'Pacific/Chuuk',
  'Pacific/Ponape': 'Pacific/Pohnpei',
  'Africa/Asmera': 'Africa/Asmara',
};

export const modernZoneName = (timeZone) => MODERN_ZONE_NAMES[timeZone] ?? timeZone;

const formatters = new Map();
const partsFormatter = (timeZone) => {
  if (!formatters.has(timeZone)) {
    formatters.set(timeZone, new Intl.DateTimeFormat('en-US', {
      timeZone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric',
    }));
  }
  return formatters.get(timeZone);
};

export const isValidTimeZone = (timeZone) => {
  if (!timeZone || typeof timeZone !== 'string') return false;
  try {
    partsFormatter(timeZone);
    return true;
  } catch {
    formatters.delete(timeZone);
    return false;
  }
};

export const localTimeZone = () => {
  try {
    return modernZoneName(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  } catch {
    return 'UTC';
  }
};

/** Wall-clock parts of an instant in a time zone (month is 0-based). */
export const zonedParts = (ts, timeZone) => {
  const p = {};
  partsFormatter(timeZone).formatToParts(new Date(ts)).forEach(({ type, value }) => { p[type] = Number(value); });
  return { year: p.year, month: p.month - 1, day: p.day, hour: p.hour % 24, minute: p.minute, second: p.second };
};

/** UTC offset of a time zone at an instant, in minutes. */
export const offsetMinutes = (ts, timeZone) => {
  const p = zonedParts(ts, timeZone);
  const asUtc = Date.UTC(p.year, p.month, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - Math.floor(ts / 1000) * 1000) / 60000);
};

/** The instant a wall-clock time occurs in a time zone (see DST notes above). */
export const zonedTimeToUtc = (year, month, day, hour, minute, timeZone) => {
  const guess = Date.UTC(year, month, day, hour, minute);
  const first = offsetMinutes(guess, timeZone);
  const ts = guess - first * 60000;
  const second = offsetMinutes(ts, timeZone);
  if (second === first) return ts;
  const retry = guess - second * 60000;
  // In a spring-forward gap neither offset round-trips; `ts` is the shifted, valid minute.
  return offsetMinutes(retry, timeZone) === second ? retry : ts;
};

export const formatOffset = (minutes) => {
  const sign = minutes < 0 ? '-' : '+'; // ASCII so "-05" finds it in the zone search
  const abs = Math.abs(minutes);
  return `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
};

export const zoneLabel = (timeZone) => String(timeZone).replace(/_/g, ' ');

let zoneCache = null;
/** Every IANA time zone the browser knows, sorted by current UTC offset: [{ value, label }]. */
export const timeZoneOptions = () => {
  if (zoneCache) return zoneCache;
  let ids = [];
  try {
    ids = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [];
  } catch {
    ids = [];
  }
  if (!ids.length) ids = FALLBACK_ZONES;
  const set = new Set(ids.map(modernZoneName));
  set.add('UTC'); // not in every browser's list
  set.add(localTimeZone()); // may be an alias missing from the list
  const now = Date.now();
  zoneCache = [...set]
    .filter(isValidTimeZone)
    .map((id) => ({ id, offset: offsetMinutes(now, id) }))
    .sort((a, b) => a.offset - b.offset || a.id.localeCompare(b.id))
    .map(({ id, offset }) => ({ value: id, label: `(${formatOffset(offset)}) ${zoneLabel(id)}` }));
  return zoneCache;
};

export const isValidTime = (time) => TIME.test(String(time || ''));

/** "18:30" → "6:30 PM" in the viewer's locale. */
export const formatClock = (time) => {
  if (!isValidTime(time)) return '—';
  const [h, m] = time.split(':').map(Number);
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(new Date(Date.UTC(2000, 0, 1, h, m)));
};

/** An instant shown in a time zone, e.g. "Fri, Oct 31, 2026, 6:00 PM EDT". */
export const formatInstant = (ts, timeZone, { weekday = true, year = true } = {}) => {
  if (ts == null) return '—';
  const opts = { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' };
  if (weekday) opts.weekday = 'short';
  if (year) opts.year = 'numeric';
  try {
    return new Intl.DateTimeFormat(undefined, { ...opts, timeZone }).format(new Date(ts));
  } catch {
    return new Date(ts).toISOString();
  }
};

/** A calendar date (UTC-midnight timestamp) as "Feb 5, 2027". */
export const formatDate = (utcMidnight, { year = true } = {}) => new Intl.DateTimeFormat(undefined, {
  month: 'short', day: 'numeric', ...(year ? { year: 'numeric' } : {}), timeZone: 'UTC',
}).format(new Date(utcMidnight));

export const parseWhole = (value) => {
  const text = String(value ?? '').trim();
  return /^\d+$/.test(text) ? Number(text) : NaN;
};

// ---------------------------------------------------------------------------------------------
// Model execution (one job per tenant)
//   { enabled, frequency: 'daily' | 'monthly',
//     monthlyRule: 'monthEnd' | 'beforeMonthEnd' | 'afterMonthEnd', offsetDays,
//     time: 'HH:mm', timeZone, updatedAt }

/** The calendar day (UTC-midnight timestamp) a monthly schedule runs for the month-end of (year, month). */
const monthlyRunDate = (year, month, rule, offsetDays) => {
  if (rule === 'beforeMonthEnd') return Date.UTC(year, month + 1, -offsetDays);
  if (rule === 'afterMonthEnd') return Date.UTC(year, month + 1, offsetDays);
  return Date.UTC(year, month + 1, 0);
};

const atTime = (utcMidnight, time, timeZone) => {
  const d = new Date(utcMidnight);
  const [h, m] = time.split(':').map(Number);
  return zonedTimeToUtc(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), h, m, timeZone);
};

/** Problems with a model schedule draft: { field: message }. Empty when it can be saved. */
export const validateModelSchedule = (draft) => {
  const errors = {};

  if (!['daily', 'monthly'].includes(draft.frequency)) errors.frequency = 'Choose how often it runs.';
  if (draft.frequency === 'monthly') {
    if (!MONTHLY_RULES.some((r) => r.value === draft.monthlyRule)) errors.monthlyRule = 'Choose which day of the month it runs.';
    else if (draft.monthlyRule !== 'monthEnd') {
      const n = parseWhole(draft.offsetDays);
      if (!Number.isInteger(n) || n < MONTHLY_OFFSET.min || n > MONTHLY_OFFSET.max) {
        errors.offsetDays = `Enter a whole number from ${MONTHLY_OFFSET.min} to ${MONTHLY_OFFSET.max}.`;
      }
    }
  }
  if (!isValidTime(draft.time)) errors.time = 'Enter a valid time.';
  if (!isValidTimeZone(draft.timeZone)) errors.timeZone = 'Choose a time zone.';
  return errors;
};

/** Normalised schedule from a draft (assumes it validated). */
export const toModelSchedule = (draft) => ({
  ...draft,
  monthlyRule: draft.frequency === 'monthly' ? draft.monthlyRule : 'monthEnd',
  offsetDays: draft.frequency === 'monthly' && draft.monthlyRule !== 'monthEnd' ? parseWhole(draft.offsetDays) : 0,
});

/** Next `count` run instants after `now` (empty when the schedule is incomplete). */
export const nextModelRuns = (s, now = Date.now(), count = 3) => {
  if (!s || !isValidTime(s.time) || !isValidTimeZone(s.timeZone)) return [];
  const today = zonedParts(now, s.timeZone);
  const runs = [];
  if (s.frequency === 'daily') {
    for (let i = 0; runs.length < count && i < count + 3; i += 1) {
      const ts = atTime(Date.UTC(today.year, today.month, today.day + i), s.time, s.timeZone);
      if (ts > now) runs.push(ts);
    }
    return runs;
  }
  const offset = s.monthlyRule === 'monthEnd' ? 0 : parseWhole(s.offsetDays);
  if (!Number.isInteger(offset)) return [];
  // Start a month back: an "after month-end" run for last month can still be ahead of us.
  for (let i = -1; runs.length < count && i < count + 3; i += 1) {
    const ts = atTime(monthlyRunDate(today.year, today.month + i, s.monthlyRule, offset), s.time, s.timeZone);
    if (ts > now) runs.push(ts);
  }
  return runs;
};

// ---------------------------------------------------------------------------------------------
// Accounting close
//   { enabled, time: 'HH:mm', timeZone, mode: 'same' | 'perMonth', days, perMonth: [12], updatedAt }
// The period for month M closes `days[M]` days after M's last calendar day, at `time`.

export const closeDaysFor = (config, month) => (config.mode === 'perMonth' ? parseWhole(config.perMonth?.[month]) : parseWhole(config.days));

/** The calendar day (UTC-midnight timestamp) the period (year, month) closes on. */
export const closeDate = (year, month, days) => Date.UTC(year, month + 1, days);

/** Problems with an accounting close draft: { field | `perMonth.${i}` | order: message }. */
export const validateClose = (draft) => {
  const errors = {};
  const range = `Enter a whole number from ${CLOSE_DAYS.min} to ${CLOSE_DAYS.max}.`;
  const valid = (n) => Number.isInteger(n) && n >= CLOSE_DAYS.min && n <= CLOSE_DAYS.max;
  if (!isValidTime(draft.time)) errors.time = 'Enter a valid time.';
  if (!isValidTimeZone(draft.timeZone)) errors.timeZone = 'Choose a time zone.';
  if (draft.mode === 'perMonth') {
    for (let m = 0; m < 12; m += 1) {
      if (!valid(parseWhole(draft.perMonth?.[m]))) errors[`perMonth.${m}`] = range;
    }
    if (!Object.keys(errors).some((k) => k.startsWith('perMonth.'))) {
      // Periods must close in order. Check a common and a leap year (February's length matters).
      outer: for (const year of [2027, 2028]) {
        for (let m = 0; m < 12; m += 1) {
          const next = (m + 1) % 12;
          if (closeDate(year, m + 1, closeDaysFor(draft, next)) < closeDate(year, m, closeDaysFor(draft, m))) {
            errors.order = `${MONTHS[next]} would close before ${MONTHS[m]}. Shorten ${MONTHS[m]}'s delay or lengthen ${MONTHS[next]}'s so periods close in order.`;
            errors[`perMonth.${m}`] = `Closes after ${MONTHS[next]}.`;
            break outer;
          }
        }
      }
    }
  } else if (draft.mode === 'same') {
    if (!valid(parseWhole(draft.days))) errors.days = range;
  } else {
    errors.mode = 'Choose how the delay is set.';
  }
  return errors;
};

/** Next `count` closes after `now`: [{ year, month, at }] (period month is 0-based). */
export const nextCloses = (config, now = Date.now(), count = 6) => {
  if (!isValidTime(config.time) || !isValidTimeZone(config.timeZone)) return [];
  const today = zonedParts(now, config.timeZone);
  const closes = [];
  // Look back far enough for the longest delay (60 days ≈ 2 months) so pending closes show.
  for (let i = -3; closes.length < count && i < count + 3; i += 1) {
    const period = new Date(Date.UTC(today.year, today.month + i, 1));
    const year = period.getUTCFullYear();
    const month = period.getUTCMonth();
    const days = closeDaysFor(config, month);
    if (!Number.isInteger(days)) continue;
    const at = atTime(closeDate(year, month, days), config.time, config.timeZone);
    if (at > now) closes.push({ year, month, at });
  }
  return closes.sort((a, b) => a.at - b.at);
};
