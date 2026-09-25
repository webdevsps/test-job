'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function approveOrderLine(
  lineId: string
): Promise<{ success: boolean; error?: string }> {
  // Auth client — only used to verify who the user is
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Admin client — bypasses RLS, server code controls access
  const admin = createAdminClient()

  // Server-side role check — bypassing the UI must still be rejected
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'owner') {
    return { success: false, error: 'Only the owner can approve discounts' }
  }

  // Approve the line
  const { data: updatedLine, error: updateError } = await admin
    .from('order_lines')
    .update({ owner_approved: true })
    .eq('id', lineId)
    .select('order_id')
    .single()

  if (updateError || !updatedLine) {
    return { success: false, error: updateError?.message ?? 'Update failed' }
  }

  const orderId = updatedLine.order_id as string

  // If all blocked lines are now approved → confirm the order automatically
  const { data: remainingBlocked } = await admin
    .from('order_lines')
    .select('id')
    .eq('order_id', orderId)
    .eq('discount_status', 'blocked')
    .eq('owner_approved', false)

  if (!remainingBlocked || remainingBlocked.length === 0) {
    await admin
      .from('orders')
      .update({ status: 'confirmed' })
      .eq('id', orderId)
  }

  revalidatePath('/approvals')
  revalidatePath(`/orders/${orderId}`)

  return { success: true }
}
