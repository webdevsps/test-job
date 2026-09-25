import { formatUSD, formatSDG } from '@/components/order/orderLineUtils'

interface OrderSummaryProps {
  totalCents: number
  totalSDG: number
  lineCount: number
}

export function OrderSummary({ totalCents, totalSDG, lineCount }: OrderSummaryProps) {
  if (lineCount === 0) return null

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Order Total
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
  )
}
