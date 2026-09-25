/**
 * Discount helpers
 *
 * Thresholds always come from the settings table via DiscountThresholds.
 * No values are hardcoded here — changing a DB row changes behaviour everywhere.
 *
 * Percentages are stored as pctX100 (integer × 100) to avoid floats:
 *   1.94%  → 194
 *   3.00%  → 300
 *   5.00%  → 500
 *   7.25%  → 725
 */

import type { DiscountStatus, DiscountThresholds } from '@/lib/supabase/types'

/**
 * Calculate discount percentage × 100 using integer math.
 * $40 discount on $2,060 line → round((40 × 10000) / 2060) = 194 = 1.94%
 */
export function calcDiscountPctX100(
  discountUsdCents: number,
  lineValueCents: number
): number {
  if (lineValueCents === 0 || discountUsdCents <= 0) return 0
  return Math.round((discountUsdCents * 10000) / lineValueCents)
}

/**
 * Format pctX100 for human display.
 * 194 → "1.94%" | 300 → "3.00%" | 0 → "0%"
 */
export function formatDiscountPct(pctX100: number): string {
  if (pctX100 === 0) return '0%'
  const whole = Math.floor(pctX100 / 100)
  const decimal = pctX100 % 100
  return `${whole}.${decimal.toString().padStart(2, '0')}%`
}

/**
 * Determine discount status from amounts and configurable thresholds.
 * thresholds.sand = 300 means "up to 3.00% is sand"
 * thresholds.red  = 500 means "up to 5.00% is red; above is blocked"
 */
export function getDiscountStatus(
  discountUsdCents: number,
  lineValueCents: number,
  thresholds: DiscountThresholds
): DiscountStatus {
  if (discountUsdCents <= 0 || lineValueCents === 0) return 'none'
  const pctX100 = calcDiscountPctX100(discountUsdCents, lineValueCents)
  if (pctX100 <= thresholds.sand) return 'sand'
  if (pctX100 <= thresholds.red) return 'red'
  return 'blocked'
}

/** True if any line is blocked and has not been owner-approved. */
export function hasBlockedLines(
  lines: Array<{ discount_status: DiscountStatus; owner_approved: boolean }>
): boolean {
  return lines.some(l => l.discount_status === 'blocked' && !l.owner_approved)
}

/** True if the order can be saved (at least one line, no unresolved blocked lines). */
export function isOrderSaveable(
  lines: Array<{ discount_status: DiscountStatus; owner_approved: boolean }>
): boolean {
  if (lines.length === 0) return false
  return !hasBlockedLines(lines)
}
