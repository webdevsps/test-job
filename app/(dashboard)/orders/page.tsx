import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PageContainer } from '@/components/layout/PageContainer'
import { formatUSD } from '@/lib/helpers/money'
import { calcOrderTotalCents } from '@/lib/helpers/order'
import { calcLineValue } from '@/lib/helpers/money'
import Link from 'next/link'
import { CheckCircle2, Clock, Plus, Package } from 'lucide-react'
import type { Order, OrderLine, UserRole } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Orders — Shamsy' }

export default async function OrdersPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = (profile?.role ?? 'adviser') as UserRole

  // Adviser sees only their own orders; owner sees all
  const query = admin
    .from('orders')
    .select(`
      *,
      customer:customers(*),
      order_lines(
        id,
        price_usd_cents,
        quantity,
        discount_usd_cents,
        discount_status,
        owner_approved
      )
    `)
    .order('created_at', { ascending: false })

  if (role === 'adviser') {
    query.eq('adviser_id', user.id)
  }

  const { data: orders } = await query

  const typedOrders = (orders ?? []) as unknown as Order[]

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {role === 'adviser' ? 'My Orders' : 'All Orders'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {role === 'adviser'
              ? 'Orders you have created.'
              : 'All orders across all advisers.'}
          </p>
        </div>
        {role === 'adviser' && (
          <Link
            href="/orders/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New
          </Link>
        )}
      </div>

      {typedOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16 px-4 text-center">
          <Package className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium">No orders yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            {role === 'adviser'
              ? 'Create your first order to get started.'
              : 'No orders have been created yet.'}
          </p>
          {role === 'adviser' && (
            <Link
              href="/orders/new"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              New Order
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {typedOrders.map(order => {
            const lines = (order.order_lines ?? []) as OrderLine[]
            const computedLines = lines.map(line => ({
              line_total_cents: calcLineValue(line.price_usd_cents, line.quantity) - line.discount_usd_cents,
            }))
            const totalCents = calcOrderTotalCents(computedLines)
            const isConfirmed = order.status === 'confirmed'
            const pendingApproval = lines.some(
              l => l.discount_status === 'blocked' && !l.owner_approved
            )

            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block rounded-xl border border-border bg-card p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {order.customer?.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {order.customer?.city} · {lines.length} item{lines.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatUSD(totalCents)}</p>
                    <div className="flex items-center gap-1 justify-end mt-1">
                      {isConfirmed ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                          <span className="text-xs text-green-700 font-medium">Confirmed</span>
                        </>
                      ) : pendingApproval ? (
                        <>
                          <Clock className="h-3.5 w-3.5 text-amber-600" />
                          <span className="text-xs text-amber-700 font-medium">Awaiting approval</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground font-medium">Draft</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </PageContainer>
  )
}
