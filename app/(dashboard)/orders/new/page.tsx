import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PageContainer } from '@/components/layout/PageContainer'
import { OrderForm } from '@/components/order/OrderForm'
import type { Product, Customer, DiscountThresholds } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'New Order — Shamsy' }

export default async function NewOrderPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Admin client for DB queries — bypasses RLS
  const admin = createAdminClient()

  // Only advisers can create orders — owners manage approvals and settings
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'owner') {
    redirect('/orders')
  }

  // Fetch everything the form needs in parallel
  const [productsRes, customersRes, settingsRes] = await Promise.all([
    admin.from('products').select('*').eq('active', true).order('name'),
    admin.from('customers').select('*').order('name'),
    admin.from('settings').select('key, value'),
  ])

  const products = (productsRes.data ?? []) as Product[]
  const customers = (customersRes.data ?? []) as Customer[]

  const settingsMap: Record<string, number> = Object.fromEntries(
    (settingsRes.data ?? []).map(r => [r.key as string, r.value as number])
  )

  const minimumRate: number = settingsMap['minimum_rate'] ?? 8000
  const thresholds: DiscountThresholds = {
    sand: settingsMap['discount_threshold_sand'] ?? 300,
    red: settingsMap['discount_threshold_red'] ?? 500,
  }

  return (
    <PageContainer withBottomBar>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">New Order</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Fill in the details below and save when ready.
        </p>
      </div>

      <OrderForm
        products={products}
        customers={customers}
        minimumRate={minimumRate}
        thresholds={thresholds}
      />
    </PageContainer>
  )
}
