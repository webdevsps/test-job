'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { PlusCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CustomerSelect } from './CustomerSelect'
import { ExchangeRateInput } from './ExchangeRateInput'
import { OrderLineCard } from './OrderLineCard'
import { OrderSummary } from './OrderSummary'
import { SaveOrderBar } from './SaveOrderBar'
import { computeLine, calcOrderTotalCents, calcOrderTotalSDG } from '@/lib/helpers/order'
import { hasBlockedLines, isOrderSaveable } from '@/lib/helpers/discount'
import { parseDollarsToCents } from '@/lib/helpers/money'
import { createOrder } from '@/lib/actions/orders'
import type { Product, Customer, DiscountThresholds } from '@/lib/supabase/types'

interface FormLine {
  id: string
  product_id: string
  quantity: number
  discount_input: string
}

interface OrderFormProps {
  products: Product[]
  customers: Customer[]
  minimumRate: number
  thresholds: DiscountThresholds
}

const INITIAL_LINE: FormLine = {
  id: 'line-1',
  product_id: '',
  quantity: 1,
  discount_input: '0',
}

export function OrderForm({
  products,
  customers,
  minimumRate,
  thresholds,
}: OrderFormProps) {
  const router = useRouter()

  const nextLineId = useRef(2)
  const [customerId, setCustomerId] = useState('')
  const [rateInput, setRateInput] = useState(minimumRate.toString())
  const [rateError, setRateError] = useState<string | null>(null)
  const [lines, setLines] = useState<FormLine[]>([INITIAL_LINE])
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // ── Rate helpers ──────────────────────────────────────────
  const rate = parseInt(rateInput, 10) || 0
  const rateTooLow = rateInput !== '' && rate < minimumRate

  const handleRateBlur = useCallback(() => {
    if (rate < minimumRate) {
      setRateInput(minimumRate.toString())
      setRateError(`Rate cannot be lower than ${minimumRate.toLocaleString('en-US')} SDG — reset to minimum`)
      setTimeout(() => setRateError(null), 3000)
    }
  }, [rate, minimumRate])

  // ── Line helpers ──────────────────────────────────────────
  const updateLine = useCallback(
    (id: string, patch: Partial<FormLine>) => {
      setLines(prev => prev.map(l => (l.id === id ? { ...l, ...patch } : l)))
    },
    []
  )

  const removeLine = useCallback((id: string) => {
    setLines(prev => (prev.length > 1 ? prev.filter(l => l.id !== id) : prev))
  }, [])

  const addLine = useCallback(() => {
    const id = `line-${nextLineId.current++}`
    setLines(prev => [...prev, { id, product_id: '', quantity: 1, discount_input: '0' }])
  }, [])

  // ── Compute derived values ────────────────────────────────
  const computedLines = lines.map(line => {
    const product = products.find(p => p.id === line.product_id)
    if (!product) return null
    return computeLine(
      product,
      line.quantity,
      parseDollarsToCents(line.discount_input),
      thresholds
    )
  })

  const validComputedLines = computedLines.filter(Boolean) as NonNullable<(typeof computedLines)[0]>[]
  const orderTotalCents = calcOrderTotalCents(validComputedLines)
  const orderTotalSDG = calcOrderTotalSDG(orderTotalCents, rate)

  const allLinesHaveProduct = lines.every(l => l.product_id !== '')
  const blocked = hasBlockedLines(
    validComputedLines.map(l => ({
      discount_status: l.discount_status,
      owner_approved: l.owner_approved,
    }))
  )
  const canSubmit =
    customerId !== '' &&
    rate >= minimumRate &&
    lines.length > 0 &&
    allLinesHaveProduct

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!canSubmit) return
    setSaving(true)
    setSubmitError(null)

    const result = await createOrder({
      customer_id: customerId,
      rate_sdg: rate,
      lines: lines.map(l => ({
        product_id: l.product_id,
        quantity: l.quantity,
        discount_usd_cents: parseDollarsToCents(l.discount_input),
      })),
    })

    if (result.success && result.orderId) {
      router.push(`/orders/${result.orderId}`)
    } else {
      setSubmitError(result.error ?? 'Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  return (
    <>
      <div className="space-y-6">
        {/* Dealer */}
        <CustomerSelect
          customers={customers}
          value={customerId}
          onChange={setCustomerId}
          disabled={saving}
        />

        {/* Exchange rate */}
        <ExchangeRateInput
          value={rateInput}
          onChange={setRateInput}
          onBlur={handleRateBlur}
          minimumRate={minimumRate}
          error={rateError ?? (rateTooLow ? `Rate must be at least ${minimumRate.toLocaleString('en-US')} SDG` : undefined)}
          disabled={saving}
        />

        {/* Order lines */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Order lines
          </h2>

          {lines.map((line, index) => (
            <OrderLineCard
              key={line.id}
              lineId={line.id}
              products={products}
              productId={line.product_id}
              quantity={line.quantity}
              discountInput={line.discount_input}
              computed={computedLines[index]}
              onProductChange={id => updateLine(line.id, { product_id: id })}
              onQuantityChange={qty => updateLine(line.id, { quantity: qty })}
              onDiscountChange={val => updateLine(line.id, { discount_input: val })}
              onRemove={() => removeLine(line.id)}
              disabled={saving}
            />
          ))}

          <Button
            type="button"
            variant="outline"
            className="h-11 w-full gap-2 border-dashed"
            onClick={addLine}
            disabled={saving}
          >
            <PlusCircle className="h-4 w-4" />
            Add product
          </Button>
        </div>

        {/* Order summary */}
        <OrderSummary
          totalCents={orderTotalCents}
          totalSDG={orderTotalSDG}
          lineCount={validComputedLines.length}
        />

        {/* Submit error */}
        {submitError && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            {submitError}
          </div>
        )}
      </div>

      {/* Fixed bottom save bar */}
      <SaveOrderBar
        hasBlockedLines={blocked}
        canSubmit={canSubmit}
        isSaving={saving}
        onClick={handleSubmit}
      />
    </>
  )
}
