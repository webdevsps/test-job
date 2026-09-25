'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function updateMinimumRate(
  rate: number
): Promise<{ success: boolean; error?: string }> {
  // Auth client — only used to verify who the user is
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Admin client — bypasses RLS, server code controls access
  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'owner') {
    return { success: false, error: 'Only the owner can update settings' }
  }

  if (!Number.isInteger(rate) || rate < 1) {
    return { success: false, error: 'Rate must be a positive whole number' }
  }

  const { error } = await admin
    .from('settings')
    .update({ value: rate })
    .eq('key', 'minimum_rate')

  if (error) return { success: false, error: error.message }

  revalidatePath('/settings')
  revalidatePath('/orders/new')

  return { success: true }
}

export async function updateDiscountThresholds(
  sandPctX100: number,
  redPctX100: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'owner') {
    return { success: false, error: 'Only the owner can update settings' }
  }

  if (!Number.isInteger(sandPctX100) || sandPctX100 < 1) {
    return { success: false, error: 'Sand threshold must be a positive whole number' }
  }
  if (!Number.isInteger(redPctX100) || redPctX100 < 1) {
    return { success: false, error: 'Red threshold must be a positive whole number' }
  }
  if (sandPctX100 >= redPctX100) {
    return { success: false, error: 'Sand threshold must be lower than red threshold' }
  }

  // Upsert both thresholds
  const { error: sandError } = await admin
    .from('settings')
    .upsert({ key: 'discount_threshold_sand', value: sandPctX100 }, { onConflict: 'key' })

  if (sandError) return { success: false, error: sandError.message }

  const { error: redError } = await admin
    .from('settings')
    .upsert({ key: 'discount_threshold_red', value: redPctX100 }, { onConflict: 'key' })

  if (redError) return { success: false, error: redError.message }

  revalidatePath('/settings')
  revalidatePath('/orders/new')

  return { success: true }
}
