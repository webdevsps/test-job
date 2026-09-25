import { cn } from '@/lib/utils'

interface BottomBarProps {
  children: React.ReactNode
  className?: string
}

/** Fixed bottom action bar — always visible on mobile without scrolling. */
export function BottomBar({ children, className }: BottomBarProps) {
  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-10',
        'border-t border-border bg-background/95 backdrop-blur-sm',
        'px-4 py-3',
        className
      )}
    >
      <div className="mx-auto w-full max-w-md">{children}</div>
    </div>
  )
}
