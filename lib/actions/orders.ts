'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { calcLineValue } from '@/lib/helpers/money'
import { getDiscountStatus, hasBlockedLines } from '@/lib/helpers/discount'
import type { DiscountThresholds } from '@/lib/supabase/types'

export interface OrderLineInput {
  product_id: string
  quantity: number
  discount_usd_cents: number
}

export interface CreateOrderInput {
  customer_id: string
  rate_sdg: number
  lines: OrderLineInput[]
}

export interface CreateOrderResult {
  success: boolean
  orderId?: string
  hasBlockedLines?: boolean
  error?: string
}

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  // Auth client — only used to verify who the user is
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Admin client — bypasses RLS, server code controls access
  const admin = createAdminClient()

  // Only advisers can create orders
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'owner') {
    return { success: false, error: 'Owners cannot create orders — only advisers can' }
  }

  // Read all thresholds from DB — never hardcoded in application code
  const { data: settingsRows } = await admin
    .from('settings')
    .select('key, value')

  const settings: Record<string, number> = Object.fromEntries(
    (settingsRows ?? []).map(r => [r.key as string, r.value as number])
  )

  const minimumRate: number = settings['minimum_rate'] ?? 8000
  const thresholds: DiscountThresholds = {
    sand: settings['discount_threshold_sand'] ?? 300,
    red: settings['discount_threshold_red'] ?? 500,
  }

  // Validate rate against DB minimum — server enforces this, not just the UI
  if (input.rate_sdg < minimumRate) {
    return {
      success: false,
      error: `Exchange rate must be at least ${minimumRate.toLocaleString()} SDG per dollar`,
    }
  }

  if (!input.customer_id) {
    return { success: false, error: 'Please select a dealer' }
  }

  if (input.lines.length === 0) {
    return { success: false, error: 'Add at least one product' }
  }

  // Fetch product prices from DB — never trust prices submitted by the client
  const productIds = [...new Set(input.lines.map(l => l.product_id))]
  const { data: products, error: productsError } = await admin
    .from('products')
    .select('id, price_usd_cents')
    .in('id', productIds)
    .eq('active', true)

  if (productsError || !products || products.length !== productIds.length) {
    return { success: false, error: 'One or more products not found' }
  }

  const priceMap: Record<string, number> = Object.fromEntries(
    products.map(p => [p.id as string, p.price_usd_cents as number])
  )

  // Compute all lines server-side with DB prices and DB thresholds
  const computedLines = input.lines.map(line => {
    const priceUsdCents = priceMap[line.product_id]
    const lineValue = calcLineValue(priceUsdCents, line.quantity)
    const discountStatus = getDiscountStatus(line.discount_usd_cents, lineValue, thresholds)
    return {
      product_id: line.product_id,
      quantity: line.quantity,
      price_usd_cents: priceUsdCents,
      discount_usd_cents: line.discount_usd_cents,
      discount_status: discountStatus,
      owner_approved: false,
    }
  })

  // Draft if any blocked lines; confirmed if all clear
  const blocked = hasBlockedLines(
    computedLines.map(l => ({
      discount_status: l.discount_status,
      owner_approved: l.owner_approved,
    }))
  )
  const orderStatus = blocked ? 'draft' : 'confirmed'

  // Insert order — rate_sdg is stored here and never recalculated
  const { data: order, error: orderError } = await admin
    .from('orders')
    .insert({
      customer_id: input.customer_id,
      adviser_id: user.id,
      rate_sdg: input.rate_sdg,
      status: orderStatus,
    })
    .select('id')
    .single()

  if (orderError || !order) {
    return { success: false, error: orderError?.message ?? 'Failed to create order' }
  }

  // Insert lines with price snapshot
  const { error: linesError } = await admin
    .from('order_lines')
    .insert(computedLines.map(l => ({ ...l, order_id: order.id })))

  if (linesError) {
    // Roll back the order if lines failed
    await admin.from('orders').delete().eq('id', order.id)
    return { success: false, error: linesError.message }
  }

  revalidatePath('/orders')
  revalidatePath('/approvals')

  return { success: true, orderId: order.id as string, hasBlockedLines: blocked }
}
