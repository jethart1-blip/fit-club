import { NavLink } from 'react-router-dom'

const navLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/today', label: 'Today' },
  { to: '/history', label: 'History' },
  { to: '/progress', label: 'Progress' },
  { to: '/settings', label: 'Settings' },
]

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-pageBg">
      <nav className="sticky top-0 z-10 bg-surface border-b border-surface2">
        <div className="mx-auto max-w-3xl px-4">
          <div className="flex h-14 items-center gap-6">
            {navLinks.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  isActive
                    ? 'border-b-2 border-accent pb-0.5 text-sm font-display font-semibold text-accent tracking-wide uppercase'
                    : 'pb-0.5 text-sm font-display font-medium text-textMuted hover:text-textPrimary tracking-wide uppercase transition-colors'
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  )
}
