/**
 * Date and time formatting utilities strictly producing Latin/Western numerals (0, 1, 2, 3, 4, 5, 6, 7, 8, 9).
 * Ensures that even when the user's browser or system locale is Arabic ('ar', 'ar-SA', 'ar-EG'),
 * no Eastern Arabic-Indic numerals (٠, ١, ٢, ٣, ٤, ٥, ٦, ٧, ٨, ٩) are output for timestamps.
 */

// Mapping from Eastern Arabic-Indic numerals and Persian numerals to Western Latin numerals
const EASTERN_TO_LATIN_MAP: Record<string, string> = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
};

/**
 * Replaces any Eastern Arabic-Indic numerals in a string with standard Latin digits (0-9).
 */
export function forceLatinDigits(str: string): string {
  if (!str) return '';
  return str.replace(/[٠-٩۰-۹]/g, (char) => EASTERN_TO_LATIN_MAP[char] || char);
}

/**
 * Format time in HH:mm:ss format strictly using Latin digits (e.g. "14:25:08")
 */
export function formatLatinTime(timestamp: number | Date = Date.now(), includeSeconds = true): string {
  const d = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
  if (isNaN(d.getTime())) return '00:00:00';
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return includeSeconds ? `${hours}:${minutes}:${seconds}` : `${hours}:${minutes}`;
}

/**
 * Format date in YYYY-MM-DD format strictly using Latin digits (e.g. "2026-10-26")
 */
export function formatLatinDate(timestamp: number | Date = Date.now()): string {
  const d = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
  if (isNaN(d.getTime())) return '2026-01-01';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format full date & time strictly using Latin digits (e.g. "2026-10-26 14:25:08")
 */
export function formatLatinDateTime(timestamp: number | Date = Date.now()): string {
  return `${formatLatinDate(timestamp)} ${formatLatinTime(timestamp)}`;
}

/**
 * Format user-friendly transmission timestamp (e.g. "2026-10-26 | 14:25:08")
 */
export function formatTransmissionStamp(timestamp: number | Date = Date.now()): string {
  return `${formatLatinDate(timestamp)} | ${formatLatinTime(timestamp)}`;
}
