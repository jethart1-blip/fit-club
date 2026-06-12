import { NavLink } from 'react-router-dom'

const navLinks = [
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
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="mx-auto max-w-3xl px-4">
          <div className="flex h-14 items-center gap-6">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  isActive
                    ? 'border-b-2 border-indigo-600 pb-0.5 text-sm font-semibold text-indigo-600'
                    : 'pb-0.5 text-sm font-medium text-gray-500 hover:text-gray-800'
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
