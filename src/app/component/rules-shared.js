/**
 * Shared helpers for the Accounting Rules and Journal Mapping screens.
 */

// The server's own message for a failed request, else the fallback.
export const apiErrorMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (Array.isArray(data)) {
    const joined = data.map((e) => e?.message).filter(Boolean).join(' | ');
    if (joined) return joined;
  }
  if (typeof data === 'string' && data.trim()) {
    return data.replace(/<[^>]*>/g, '').trim().replace(/^\[ERR_[A-Z0-9_]+\]\s*/, '').slice(0, 300);
  }
  const message = data?.message || data?.error;
  if (message) return String(message).replace(/^\[ERR_[A-Z0-9_]+\]\s*/, '');
  return error?.response ? fallback : (error?.message || fallback);
};

// Yes/no flags arrive as 1/0 (what the dialogs save) or true/false: both read correctly.
export const flagOn = (value) => value === 1 || value === true || value === '1' || value === 'true';

// Chart of Accounts caches the reclassable attributes (its extra columns) per tenant. Any change to
// attributes clears it, so the columns are rebuilt from the current attributes.
export const attributeMetadataKey = (tenant) => `attributeMetadata_${tenant}`;
export const clearAttributeMetadataCache = (tenant) => {
  try { localStorage.removeItem(attributeMetadataKey(tenant)); } catch { /* storage unavailable */ }
};

// Attribute data types are stored upper case (STRING, NUMBER, DATE, BOOLEAN); older records may
// use "String" etc. Compare through this.
export const normalizeDataType = (type) => String(type || 'STRING').toUpperCase();

// A plural-aware "3 balances" style phrase.
export const countOf = (n, singular, plural = `${singular}s`) => `${n} ${n === 1 ? singular : plural}`;
