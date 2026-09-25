'use client'

import { NativeSelect } from '@/components/ui/select'
import type { Customer } from '@/lib/supabase/types'

interface CustomerSelectProps {
  customers: Customer[]
  value: string
  onChange: (id: string) => void
  disabled?: boolean
}

export function CustomerSelect({
  customers,
  value,
  onChange,
  disabled,
}: CustomerSelectProps) {
  return (
    <NativeSelect
      label="Select dealer"
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
    >
      <option value="">— Choose a dealer —</option>
      {customers.map(c => (
        <option key={c.id} value={c.id}>
          {c.name} · {c.city}
        </option>
      ))}
    </NativeSelect>
  )
}
