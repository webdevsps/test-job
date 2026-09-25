import { cn } from '@/lib/utils'

interface PageContainerProps {
  children: React.ReactNode
  className?: string
  /** Add bottom padding for the fixed save bar */
  withBottomBar?: boolean
}

export function PageContainer({
  children,
  className,
  withBottomBar = false,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-md px-4 py-6',
        withBottomBar && 'pb-28',
        className
      )}
    >
      {children}
    </div>
  )
}
