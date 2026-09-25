import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PageContainer } from '@/components/layout/PageContainer'
import { MinRateForm } from '@/components/settings/MinRateForm'
import { DiscountThresholdsForm } from '@/components/settings/DiscountThresholdsForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Settings — Shamsy' }

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Admin client for DB queries — bypasses RLS
  const admin = createAdminClient()

  // Owner-only page — server-side enforcement
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'owner') {
    redirect('/orders')
  }

  const { data: settingsRows } = await admin
    .from('settings')
    .select('key, value')

  const settingsMap: Record<string, number> = Object.fromEntries(
    (settingsRows ?? []).map(r => [r.key as string, r.value as number])
  )

  const minimumRate = settingsMap['minimum_rate'] ?? 8000
  const discountSand = settingsMap['discount_threshold_sand'] ?? 300
  const discountRed = settingsMap['discount_threshold_red'] ?? 500

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure platform-wide thresholds and rates.
        </p>
      </div>

      <div className="space-y-6">
        <MinRateForm currentRate={minimumRate} />

        <DiscountThresholdsForm currentSand={discountSand} currentRed={discountRed} />

        <div className="rounded-lg border border-border bg-muted/40 p-4">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> Changes to rates and thresholds only affect new orders
            created after this point. All existing orders keep their original values — they
            are stored permanently on each order and never recalculated.
          </p>
        </div>
      </div>
    </PageContainer>
  )
}
