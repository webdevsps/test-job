import type { DiscountStatus } from '@/lib/supabase/types'
import { formatUSD as formatUSDCents, formatSDG as formatSDGPounds } from '@/lib/helpers/money'
import { formatDiscountPct as formatPctHelper } from '@/lib/helpers/discount'

// Re-export helpers so components import from one place
export { formatUSDCents as formatUSD, formatSDGPounds as formatSDG }
export { formatPctHelper as formatDiscountPct }

export const lineStatusStyles: Record<
  DiscountStatus,
  { border: string; bg: string; badge: string }
> = {
  none:    { border: 'border-border',  bg: 'bg-card',      badge: '' },
  sand:    { border: 'border-amber-400', bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-800' },
  red:     { border: 'border-red-400',   bg: 'bg-red-50',   badge: 'bg-red-100 text-red-700' },
  blocked: { border: 'border-red-600',   bg: 'bg-red-100',  badge: 'bg-red-600 text-white' },
}

export const discountStatusLabels: Record<DiscountStatus, string> = {
  none:    '',
  sand:    'Small discount',
  red:     'Large discount',
  blocked: 'Awaiting approval',
}

export function formatDiscountBadge(status: DiscountStatus): string {
  return discountStatusLabels[status]
}
