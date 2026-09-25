/**
 * Money helpers
 *
 * All USD amounts are integers in cents:  $515.00 → 51500
 * All SDG amounts are integers in pounds: 8,200 SDG → 8200
 * Rates are integers: 8200 SDG per 1 USD → 8200
 *
 * No floating-point arithmetic. Math.round used for any division.
 */

/** Add thousand separators: 29274000 → "29,274,000" — deterministic, no locale dependency */
function addCommas(n: number): string {
  const s = n.toString()
  const result: string[] = []
  for (let i = s.length - 1, count = 0; i >= 0; i--, count++) {
    if (count > 0 && count % 3 === 0) result.push(',')
    result.push(s[i])
  }
  return result.reverse().join('')
}

/** Format USD cents for display: 51500 → "$515" or 51550 → "$515.50" */
export function formatUSD(cents: number): string {
  const abs = Math.abs(cents)
  const dollars = Math.floor(abs / 100)
  const remaining = abs % 100
  const sign = cents < 0 ? '-' : ''
  if (remaining === 0) {
    return `${sign}$${addCommas(dollars)}`
  }
  return `${sign}$${addCommas(dollars)}.${remaining.toString().padStart(2, '0')}`
}

/** Format SDG pounds for display: 29274000 → "29,274,000 SDG" */
export function formatSDG(pounds: number): string {
  return `${addCommas(Math.abs(pounds))} SDG`
}

/**
 * Parse a dollar-amount string to cents.
 * "40" → 4000 | "40.50" → 4050 | "" → 0 | "-1" → 0
 */
export function parseDollarsToCents(value: string): number {
  const trimmed = value.trim()
  if (!trimmed || trimmed === '0') return 0
  const num = parseFloat(trimmed)
  if (isNaN(num) || num < 0) return 0
  return Math.round(num * 100)
}

/**
 * Convert USD cents to SDG using integer math.
 * ($515 = 51500 cents) × (8200 rate) / 100 = 4,223,000 SDG
 */
export function usdCentsToSDG(usdCents: number, rateSdgPerUsd: number): number {
  return Math.round((usdCents * rateSdgPerUsd) / 100)
}

/** Line value before discount: price × quantity */
export function calcLineValue(priceUsdCents: number, quantity: number): number {
  return priceUsdCents * quantity
}
