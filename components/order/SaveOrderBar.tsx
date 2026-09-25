'use client'

import { Loader2, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BottomBar } from '@/components/layout/BottomBar'

interface SaveOrderBarProps {
  hasBlockedLines: boolean
  canSubmit: boolean
  isSaving: boolean
  onClick: () => void
}

export function SaveOrderBar({
  hasBlockedLines,
  canSubmit,
  isSaving,
  onClick,
}: SaveOrderBarProps) {
  const isDisabled = !canSubmit || isSaving

  if (hasBlockedLines) {
    return (
      <BottomBar>
        <Button
          type="button"
          className="h-12 w-full gap-2 bg-amber-600 hover:bg-amber-700 text-white"
          disabled={isDisabled}
          onClick={onClick}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldAlert className="h-4 w-4" />
          )}
          {isSaving ? 'Submitting…' : 'Submit for owner approval'}
        </Button>
        <p className="mt-1.5 text-center text-xs text-muted-foreground">
          Order will be saved as draft — owner must approve the blocked line(s)
        </p>
      </BottomBar>
    )
  }

  return (
    <BottomBar>
      <Button
        type="button"
        className="h-12 w-full gap-2"
        disabled={isDisabled}
        onClick={onClick}
      >
        {isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle2 className="h-4 w-4" />
        )}
        {isSaving ? 'Saving…' : 'Save Order'}
      </Button>
    </BottomBar>
  )
}
