import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { ApproveLineButton } from './ApproveLineButton'
import { formatUSD, formatSDG, discountStatusLabels, lineStatusStyles } from '@/components/order/orderLineUtils'
import { calcDiscountPctX100, formatDiscountPct } from '@/lib/helpers/discount'
import { calcLineValue } from '@/lib/helpers/money'
import type { Order } from '@/lib/supabase/types'

interface PendingOrderCardProps {
  order: Order
}

export function PendingOrderCard({ order }: PendingOrderCardProps) {
  const blockedLines = (order.order_lines ?? []).filter(
    l => l.discount_status === 'blocked' && !l.owner_approved
  )

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Order header */}
      <div className="flex items-start justify-between p-4 border-b border-border">
        <div>
          <p className="font-semibold">{order.customer?.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {order.customer?.city} · Rate: {order.rate_sdg.toLocaleString('en-US')} SDG/$
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(order.created_at).toLocaleDateString('en-US', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </p>
        </div>
        <Link
          href={`/orders/${order.id}`}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          View order <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {/* Blocked lines */}
      <div className="divide-y divide-border">
        {blockedLines.map(line => {
          const lineValue = calcLineValue(line.price_usd_cents, line.quantity)
          const pctX100 = calcDiscountPctX100(line.discount_usd_cents, lineValue)
          const styles = lineStatusStyles['blocked']

          return (
            <div key={line.id} className={`p-4 ${styles.bg}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">{line.product?.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {line.quantity} × {formatUSD(line.price_usd_cents)} ={' '}
                    {formatUSD(lineValue)}
                  </p>
                  <p className="text-xs text-red-600 font-medium mt-1">
                    Discount: {formatUSD(line.discount_usd_cents)} (
                    {formatDiscountPct(pctX100)}) — blocked, requires approval
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Line total after discount: {formatUSD(lineValue - line.discount_usd_cents)}
                  </p>
                </div>
                <ApproveLineButton lineId={line.id} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
