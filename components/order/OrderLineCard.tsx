'use client'

import { X } from 'lucide-react'
import { NativeSelect } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatUSD, formatDiscountPct, formatDiscountBadge, lineStatusStyles } from '@/components/order/orderLineUtils'
import type { Product } from '@/lib/supabase/types'
import type { ComputedLine } from '@/lib/helpers/order'

interface OrderLineCardProps {
  lineId: string
  products: Product[]
  productId: string
  quantity: number
  discountInput: string
  computed: ComputedLine | null
  onProductChange: (id: string) => void
  onQuantityChange: (qty: number) => void
  onDiscountChange: (value: string) => void
  onRemove: () => void
  disabled?: boolean
}

export function OrderLineCard({
  lineId,
  products,
  productId,
  quantity,
  discountInput,
  computed,
  onProductChange,
  onQuantityChange,
  onDiscountChange,
  onRemove,
  disabled,
}: OrderLineCardProps) {
  const status = computed?.discount_status ?? 'none'
  const styles = lineStatusStyles[status]

  return (
    <div className={`rounded-xl border-2 p-4 transition-colors ${styles.border} ${styles.bg}`}>
      {/* Header row: product select + remove */}
      <div className="flex items-start gap-2 mb-3">
        <div className="flex-1">
          <NativeSelect
            value={productId}
            onChange={e => onProductChange(e.target.value)}
            disabled={disabled}
            className="h-11 text-sm"
          >
            <option value="">— Select product —</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </NativeSelect>
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-red-300 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
          aria-label="Remove line"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Unit price (read-only) */}
      {computed && (
        <p className="mb-3 text-xs text-muted-foreground">
          Unit price:{' '}
          <span className="font-medium">{formatUSD(computed.price_usd_cents)}</span>
          {' '}per unit
        </p>
      )}

      {/* Qty + Discount inputs */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor={`qty-${lineId}`} className="text-xs text-muted-foreground">
            Quantity
          </Label>
          <Input
            id={`qty-${lineId}`}
            type="number"
            inputMode="numeric"
            min={1}
            value={quantity}
            onChange={e => onQuantityChange(Math.max(1, parseInt(e.target.value) || 1))}
            disabled={disabled}
            className="h-11 text-base"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={`disc-${lineId}`} className="text-xs text-muted-foreground">
            Discount ($)
          </Label>
          <Input
            id={`disc-${lineId}`}
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={discountInput}
            onChange={e => onDiscountChange(e.target.value)}
            disabled={disabled}
            className="h-11 text-base"
            placeholder="0"
          />
        </div>
      </div>

      {/* Computed summary */}
      {computed && (
        <div className="space-y-1 border-t border-border/50 pt-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Line value</span>
            <span>{formatUSD(computed.line_value_cents)}</span>
          </div>
          {computed.discount_usd_cents > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Discount</span>
              <span>
                −{formatUSD(computed.discount_usd_cents)}{' '}
                <span className="text-xs text-muted-foreground">
                  ({formatDiscountPct(computed.discount_pct_x100)})
                </span>
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Line total</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{formatUSD(computed.line_total_cents)}</span>
              {status !== 'none' && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles.badge}`}>
                  {formatDiscountBadge(status)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
