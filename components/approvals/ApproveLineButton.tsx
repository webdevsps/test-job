'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { approveOrderLine } from '@/lib/actions/approvals'

interface ApproveLineButtonProps {
  lineId: string
}

export function ApproveLineButton({ lineId }: ApproveLineButtonProps) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleApprove = async () => {
    setLoading(true)
    setError(null)
    const result = await approveOrderLine(lineId)
    if (result.success) {
      setDone(true)
    } else {
      setError(result.error ?? 'Approval failed')
      setLoading(false)
    }
  }

  if (done) {
    return (
      <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
        <CheckCircle2 className="h-4 w-4" />
        Approved
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5 border-green-500 text-green-700 hover:bg-green-50"
        onClick={handleApprove}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <CheckCircle2 className="h-3.5 w-3.5" />
        )}
        {loading ? 'Approving…' : 'Approve discount'}
      </Button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
