import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PageContainer } from '@/components/layout/PageContainer'
import { formatUSD, formatSDG, lineStatusStyles, discountStatusLabels } from '@/components/order/orderLineUtils'
import { calcLineValue, usdCentsToSDG } from '@/lib/helpers/money'
import { calcDiscountPctX100, formatDiscountPct } from '@/lib/helpers/discount'
import { calcOrderTotalCents } from '@/lib/helpers/order'
import { CheckCircle2, Clock } from 'lucide-react'
import type { Order, OrderLine, DiscountStatus } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Order — Shamsy' }

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function OrderPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Admin client for DB queries — bypasses RLS
  const admin = createAdminClient()

  const { data: order } = await admin
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
    .eq('id', id)
    .single()

  if (!order) notFound()

  const typedOrder = order as unknown as Order
  const lines = (typedOrder.order_lines ?? []) as OrderLine[]

  // Compute order total using the STORED rate — never the current rate
  const computedLines = lines.map(line => ({
    line_total_cents: calcLineValue(line.price_usd_cents, line.quantity) - line.discount_usd_cents,
  }))
  const totalCents = calcOrderTotalCents(computedLines)
  const totalSDG = usdCentsToSDG(totalCents, typedOrder.rate_sdg)

  const pendingApproval = lines.some(l => l.discount_status === 'blocked' && !l.owner_approved)

  return (
    <PageContainer>
      {/* Status banner */}
      <div
        className={`mb-6 flex items-start gap-3 rounded-xl p-4 ${
          typedOrder.status === 'confirmed'
            ? 'bg-green-50 border border-green-200'
            : 'bg-amber-50 border border-amber-200'
        }`}
      >
        {typedOrder.status === 'confirmed' ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
        ) : (
          <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
        )}
        <div>
          <p className={`font-semibold ${typedOrder.status === 'confirmed' ? 'text-green-800' : 'text-amber-800'}`}>
            {typedOrder.status === 'confirmed' ? 'Order confirmed' : 'Awaiting approval'}
          </p>
          {pendingApproval && (
            <p className="text-sm text-amber-700 mt-0.5">
              One or more lines need owner approval before this order is confirmed.
            </p>
          )}
        </div>
      </div>

      {/* Order header */}
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold">Order</h1>
        <p className="text-sm text-muted-foreground">
          {new Date(typedOrder.created_at).toLocaleDateString('en-US', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
          })}
        </p>
      </div>

      {/* Dealer + Rate */}
      <div className="mb-6 rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Dealer</span>
          <div className="text-right">
            <p className="text-sm font-medium">{typedOrder.customer?.name}</p>
            <p className="text-xs text-muted-foreground">{typedOrder.customer?.city}</p>
          </div>
        </div>
        <div className="flex justify-between border-t border-border pt-3">
          <span className="text-sm text-muted-foreground">Exchange rate</span>
          <div className="text-right">
            <p className="text-sm font-mono font-semibold">
              {typedOrder.rate_sdg.toLocaleString('en-US')} SDG / $1
            </p>
            <p className="text-xs text-muted-foreground">Stored at time of order — immutable</p>
          </div>
        </div>
      </div>

      {/* Order lines */}
      <div className="mb-6 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Order lines
        </h2>

        {lines.map(line => {
          const lineValue = calcLineValue(line.price_usd_cents, line.quantity)
          const lineTotal = lineValue - line.discount_usd_cents
          const pctX100 = calcDiscountPctX100(line.discount_usd_cents, lineValue)
          const status = line.discount_status as DiscountStatus
          const styles = lineStatusStyles[status]

          return (
            <div
              key={line.id}
              className={`rounded-xl border-2 p-4 ${styles.border} ${styles.bg}`}
            >
              <div className="flex items-start justify-between mb-2">
                <p className="font-medium text-sm">{line.product?.name}</p>
                {status !== 'none' && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles.badge}`}>
                    {line.owner_approved ? 'Approved' : discountStatusLabels[status]}
                  </span>
                )}
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {line.quantity} × {formatUSD(line.price_usd_cents)}
                  </span>
                  <span>{formatUSD(lineValue)}</span>
                </div>
                {line.discount_usd_cents > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Discount ({formatDiscountPct(pctX100)})
                    </span>
                    <span>−{formatUSD(line.discount_usd_cents)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium border-t border-border/50 pt-1">
                  <span>Line total</span>
                  <span>{formatUSD(lineTotal)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Order totals — uses stored rate, never recalculated */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Order total
        </h3>
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">In US dollars</span>
          <span className="text-2xl font-bold">{formatUSD(totalCents)}</span>
        </div>
        <div className="flex items-baseline justify-between border-t border-border pt-2">
          <span className="text-sm text-muted-foreground">In Sudanese pounds</span>
          <span className="text-lg font-semibold">{formatSDG(totalSDG)}</span>
        </div>
      </div>
    </PageContainer>
  )
}
