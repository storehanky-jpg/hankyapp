/**
 * Formatting utilities for production quantities and losses in KG / G.
 */

/**
 * Formats a quantity in kg with 'kg' unit, up to 3 decimal places (e.g., "1,25 kg", "10 kg", "0,15 kg").
 */
export function formatKg(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '0 kg';
  }
  const formatted = Number(value).toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
  return `${formatted} kg`;
}

/**
 * Formats a loss quantity with the most readable unit:
 * - If less than 1 kg (and > 0), displayed in grams (e.g. 0.35 kg -> "350 g", 0.15 kg -> "150 g").
 * - If 1 kg or more, displayed in kg (e.g. 1.25 kg -> "1,25 kg").
 * - If 0 or invalid, returns "0 kg".
 */
export function formatLoss(valueInKg: number | undefined | null): string {
  if (valueInKg === undefined || valueInKg === null || isNaN(valueInKg) || valueInKg <= 0) {
    return '0 kg';
  }
  const num = Number(valueInKg);
  if (num < 1) {
    const inGrams = Math.round(num * 1000);
    return `${inGrams.toLocaleString('fr-FR')} g`;
  }
  const formatted = num.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
  return `${formatted} kg`;
}
