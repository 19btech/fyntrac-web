/**
 * Subledger mappings come in pairs: a new mapping is saved together with its opposite entry
 * (sign and debit / credit flipped, same account subtype).
 */

const lower = (v) => String(v ?? '').toLowerCase();

export const flipSign = (sign) => (lower(sign) === 'positive' ? 'NEGATIVE' : 'POSITIVE');
export const flipEntryType = (entryType) => (lower(entryType) === 'debit' ? 'CREDIT' : 'DEBIT');

// The criteria as the dialog shows them.
export const signLabel = (sign) => (lower(sign) === 'positive' ? 'AMOUNT > 0' : lower(sign) === 'negative' ? 'AMOUNT < 0' : (sign ?? ''));

// The opposite entry of a mapping among `rows` (same transaction and subtype, flipped sign and
// entry type), or null.
export const oppositeEntryOf = (mapping, rows) => {
  if (!mapping) return null;
  return (rows || []).find((r) => r.id !== mapping.id
    && lower(r.transactionName) === lower(mapping.transactionName)
    && lower(r.accountSubType) === lower(mapping.accountSubType)
    && lower(r.sign) === lower(flipSign(mapping.sign))
    && lower(r.entryType) === lower(flipEntryType(mapping.entryType))) ?? null;
};
