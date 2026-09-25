'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { updateDiscountThresholds } from '@/lib/actions/settings'

interface DiscountThresholdsFormProps {
  currentSand: number // pctX100, e.g. 300 = 3.00%
  currentRed: number  // pctX100, e.g. 500 = 5.00%
}

export function DiscountThresholdsForm({ currentSand, currentRed }: DiscountThresholdsFormProps) {
  const [sandValue, setSandValue] = useState((currentSand / 100).toString())
  const [redValue, setRedValue] = useState((currentRed / 100).toString())
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    const sandPct = parseFloat(sandValue)
    const redPct = parseFloat(redValue)

    if (isNaN(sandPct) || sandPct <= 0) {
      setError('Sand threshold must be a positive number')
      return
    }
    if (isNaN(redPct) || redPct <= 0) {
      setError('Red threshold must be a positive number')
      return
    }
    if (sandPct >= redPct) {
      setError('Sand threshold must be lower than red threshold')
      return
    }

    const sandPctX100 = Math.round(sandPct * 100)
    const redPctX100 = Math.round(redPct * 100)

    setSaving(true)
    setError(null)
    setSuccess(false)

    const result = await updateDiscountThresholds(sandPctX100, redPctX100)
    setSaving(false)

    if (result.success) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } else {
      setError(result.error ?? 'Update failed')
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div>
        <h2 className="text-base font-semibold">Discount thresholds</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Control how discounts are flagged on order lines. Discounts up to the sand
          threshold show amber, up to the red threshold show red, and above the red
          threshold are blocked until you approve them.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="sand-threshold">Sand threshold (%)</Label>
          <Input
            id="sand-threshold"
            type="number"
            inputMode="decimal"
            min={0.01}
            step={0.01}
            value={sandValue}
            onChange={e => setSandValue(e.target.value)}
            disabled={saving}
            className="h-12 text-base font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Discounts ≤ {sandValue}% shown in amber
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="red-threshold">Block threshold (%)</Label>
          <Input
            id="red-threshold"
            type="number"
            inputMode="decimal"
            min={0.01}
            step={0.01}
            value={redValue}
            onChange={e => setRedValue(e.target.value)}
            disabled={saving}
            className="h-12 text-base font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Above {redValue}% requires approval
          </p>
        </div>
      </div>

      <Button
        type="button"
        className="h-12 gap-2"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : success ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : null}
        {saving ? 'Saving…' : success ? 'Saved' : 'Update thresholds'}
      </Button>

      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
