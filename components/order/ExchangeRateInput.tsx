'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ExchangeRateInputProps {
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  minimumRate: number
  error?: string
  disabled?: boolean
}

export function ExchangeRateInput({
  value,
  onChange,
  onBlur,
  minimumRate,
  error,
  disabled,
}: ExchangeRateInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="exchange-rate" className="text-sm font-medium">
        Exchange rate (SDG per $1)
      </Label>
      <Input
        id="exchange-rate"
        type="number"
        inputMode="numeric"
        min={minimumRate}
        step={1}
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        className={`h-12 text-base font-mono ${error ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
        placeholder={minimumRate.toString()}
      />
      <p className="text-xs text-muted-foreground">
        Minimum rate: {minimumRate.toLocaleString('en-US')} SDG
      </p>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
