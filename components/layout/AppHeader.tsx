import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { LogoutButton } from './LogoutButton'
import Link from 'next/link'
import type { UserRole } from '@/lib/supabase/types'

interface AppHeaderProps {
  title?: string
}

export async function AppHeader({ title }: AppHeaderProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let fullName = user?.email ?? ''
  let role: UserRole = 'adviser'

  if (user) {
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single()

    if (profile) {
      fullName = profile.full_name ?? user.email ?? ''
      role = profile.role as UserRole
    }
  }

  const navLinks =
    role === 'owner'
      ? [
          { href: '/orders', label: 'Orders' },
          { href: '/approvals', label: 'Approvals' },
          { href: '/settings', label: 'Settings' },
        ]
      : [
          { href: '/orders', label: 'My Orders' },
          { href: '/orders/new', label: 'New Order' },
        ]

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-md items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/orders" className="text-lg font-bold tracking-tight">
            Shamsy
          </Link>
          {navLinks.length > 1 && (
            <nav className="hidden sm:flex items-center gap-3">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium leading-none">{fullName}</p>
            <p className="text-xs text-muted-foreground capitalize">{role}</p>
          </div>
          <LogoutButton />
        </div>
      </div>

      {/* Mobile nav */}
      {navLinks.length > 1 && (
        <nav className="flex sm:hidden border-t border-border">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="flex-1 py-2 text-center text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
