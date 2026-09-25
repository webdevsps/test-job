import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PageContainer } from '@/components/layout/PageContainer'
import { PendingOrderCard } from '@/components/approvals/PendingOrderCard'
import { ShieldCheck } from 'lucide-react'
import type { Order } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Approvals — Shamsy' }

export default async function ApprovalsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Admin client for DB queries — bypasses RLS
  const admin = createAdminClient()

  // Owner-only page
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'owner') {
    redirect('/orders')
  }

  // Fetch all draft orders that have blocked+unapproved lines
  const { data: orders } = await admin
    .from('orders')
    .select(`
      *,
      customer:customers(*),
      adviser:profiles(*),
      order_lines(
        *,
        product:products(*)
      )
    `)
    .eq('status', 'draft')
    .order('created_at', { ascending: false })

  // Filter to only orders that have pending blocked lines
  const pendingOrders = ((orders ?? []) as unknown as Order[]).filter(order =>
    (order.order_lines ?? []).some(
      l => l.discount_status === 'blocked' && !l.owner_approved
    )
  )

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Discount approvals</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Orders with discounts above the block threshold that need your approval.
        </p>
      </div>

      {pendingOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16 px-4 text-center">
          <ShieldCheck className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium">All caught up</p>
          <p className="text-sm text-muted-foreground mt-1">
            No orders are waiting for discount approval.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingOrders.map(order => (
            <PendingOrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </PageContainer>
  )
}
