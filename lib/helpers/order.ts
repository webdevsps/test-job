import { calcLineValue, usdCentsToSDG } from './money'
import { getDiscountStatus, calcDiscountPctX100 } from './discount'
import type { DiscountStatus, DiscountThresholds, Product } from '@/lib/supabase/types'

export interface ComputedLine {
  product_id: string
  product: Product
  quantity: number
  price_usd_cents: number
  discount_usd_cents: number
  line_value_cents: number    // price × quantity (before discount)
  line_total_cents: number    // line_value - discount
  discount_pct_x100: number  // e.g. 194 = 1.94%
  discount_status: DiscountStatus
  owner_approved: boolean
}

/** Compute all derived values for a single order line. */
export function computeLine(
  product: Product,
  quantity: number,
  discountUsdCents: number,
  thresholds: DiscountThresholds,
  ownerApproved = false
): ComputedLine {
  const lineValue = calcLineValue(product.price_usd_cents, quantity)
  const discountStatus = getDiscountStatus(discountUsdCents, lineValue, thresholds)
  const pctX100 = calcDiscountPctX100(discountUsdCents, lineValue)

  return {
    product_id: product.id,
    product,
    quantity,
    price_usd_cents: product.price_usd_cents,
    discount_usd_cents: discountUsdCents,
    line_value_cents: lineValue,
    line_total_cents: lineValue - discountUsdCents,
    discount_pct_x100: pctX100,
    discount_status: discountStatus,
    owner_approved: ownerApproved,
  }
}

/** Sum of all line totals in cents. */
export function calcOrderTotalCents(lines: Array<{ line_total_cents: number }>): number {
  return lines.reduce((sum, l) => sum + l.line_total_cents, 0)
}

/** Convert order total cents to SDG. */
export function calcOrderTotalSDG(totalCents: number, rateSdgPerUsd: number): number {
  return usdCentsToSDG(totalCents, rateSdgPerUsd)
}
