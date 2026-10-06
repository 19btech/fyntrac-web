/**
 * Checks dropped activity files against the chosen activity type before uploading.
 *
 *   Standard activity: CSV files must be transactionactivity / instrumentattribute files, a ZIP's
 *     CSV entries likewise, and an Excel workbook must have a TransactionActivity or
 *     InstrumentAttribute sheet.
 *   Custom activity: none of those standard files, entries or sheets.
 *
 * Excel (.xlsx) and ZIP files are read in the browser (ZIP directory + the workbook's sheet list,
 * using the built-in DecompressionStream). Anything that can't be inspected — legacy .xls, an
 * unusual archive, an older browser — is let through for the service to validate.
 */

const STANDARD_NAME = /(transactionactivity|instrumentattribute)/i;
const isStandardName = (name) => STANDARD_NAME.test(String(name).replace(/[\s_-]/g, ''));
const ext = (name) => String(name).toLowerCase().split('.').pop();

const u16 = (v, o) => v.getUint16(o, true);
const u32 = (v, o) => v.getUint32(o, true);

// Central directory of a ZIP (also .xlsx): [{ name, method, compressedSize, localOffset }].
const readZipEntries = async (file) => {
  const tailSize = Math.min(file.size, 65557);
  const tail = new DataView(await file.slice(file.size - tailSize).arrayBuffer());
  let eocd = -1;
  for (let i = tail.byteLength - 22; i >= 0; i -= 1) {
    if (u32(tail, i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('Not a ZIP file');
  const count = u16(tail, eocd + 10);
  const cdSize = u32(tail, eocd + 12);
  const cdOffset = u32(tail, eocd + 16);
  const cd = new DataView(await file.slice(cdOffset, cdOffset + cdSize).arrayBuffer());
  const decoder = new TextDecoder();
  const entries = [];
  let p = 0;
  for (let n = 0; n < count && p + 46 <= cd.byteLength; n += 1) {
    if (u32(cd, p) !== 0x02014b50) break;
    const nameLen = u16(cd, p + 28);
    entries.push({
      method: u16(cd, p + 10),
      compressedSize: u32(cd, p + 20),
      localOffset: u32(cd, p + 42),
      name: decoder.decode(new Uint8Array(cd.buffer, cd.byteOffset + p + 46, nameLen)),
    });
    p += 46 + nameLen + u16(cd, p + 30) + u16(cd, p + 32);
  }
  return entries;
};

const readZipText = async (file, entry) => {
  const head = new DataView(await file.slice(entry.localOffset, entry.localOffset + 30).arrayBuffer());
  const start = entry.localOffset + 30 + u16(head, 26) + u16(head, 28);
  const raw = file.slice(start, start + entry.compressedSize);
  if (entry.method === 0) return raw.text();
  if (entry.method !== 8 || typeof DecompressionStream === 'undefined') throw new Error('Cannot read entry');
  return new Response(raw.stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
};

const workbookSheets = async (file) => {
  const entries = await readZipEntries(file);
  const workbook = entries.find((e) => e.name === 'xl/workbook.xml');
  if (!workbook) throw new Error('No workbook');
  const xml = await readZipText(file, workbook);
  return [...xml.matchAll(/<(?:\w+:)?sheet\b[^>]*\bname="([^"]*)"/g)].map((m) => m[1]);
};

const STANDARD_MSG = "Standard Activity upload only accepts 'transactionactivity' or 'instrumentattribute' files.";
const CUSTOM_MSG = 'Custom Activity upload does not accept standard activity files. Please select Standard Activity type.';

/** Resolves to an error message, or null when the files fit the activity type. */
export const checkActivityFiles = async (files, standard) => {
  for (const file of files) {
    const type = ext(file.name);
    try {
      if (type === 'csv') {
        if (standard !== isStandardName(file.name)) return standard ? STANDARD_MSG : CUSTOM_MSG;
      } else if (type === 'zip') {
        const csvs = (await readZipEntries(file)).map((e) => e.name.split('/').pop()).filter((n) => ext(n) === 'csv');
        if (standard && csvs.some((n) => !isStandardName(n))) return `${file.name}: ${STANDARD_MSG}`;
        if (!standard && csvs.some(isStandardName)) return `${file.name}: ${CUSTOM_MSG}`;
      } else if (type === 'xlsx') {
        const hasStandardSheet = (await workbookSheets(file)).some(isStandardName);
        if (standard && !hasStandardSheet) return `${file.name} has no TransactionActivity or InstrumentAttribute sheet. ${STANDARD_MSG}`;
        if (!standard && hasStandardSheet) return `${file.name} contains standard activity sheets. ${CUSTOM_MSG}`;
      }
    } catch {
      // Not inspectable here: the service validates it.
    }
  }
  return null;
};
