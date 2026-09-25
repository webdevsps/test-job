'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { updateMinimumRate } from '@/lib/actions/settings'

interface MinRateFormProps {
  currentRate: number
}

export function MinRateForm({ currentRate }: MinRateFormProps) {
  const [value, setValue] = useState(currentRate.toString())
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    const rate = parseInt(value, 10)
    if (isNaN(rate) || rate < 1) {
      setError('Please enter a valid positive number')
      return
    }
    setSaving(true)
    setError(null)
    setSuccess(false)

    const result = await updateMinimumRate(rate)
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
        <h2 className="text-base font-semibold">Minimum exchange rate</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Advisers cannot set an exchange rate below this value when creating orders.
          Raise it as the Sudanese pound falls.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="min-rate">Minimum rate (SDG per $1)</Label>
        <div className="flex gap-3">
          <Input
            id="min-rate"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={value}
            onChange={e => setValue(e.target.value)}
            disabled={saving}
            className="h-12 text-base font-mono max-w-[180px]"
          />
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
            {saving ? 'Saving…' : success ? 'Saved' : 'Update rate'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Current value: {currentRate.toLocaleString('en-US')} SDG
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
