import { Link, useLocation } from 'react-router-dom'
import { Menu, Moon, Sun, Settings, User } from 'lucide-react'
import { useAppStore } from '../../hooks/useAppStore'

export function Header() {
  const location = useLocation()
  const { theme, setTheme, setSidebarOpen } = useAppStore()

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Studio', href: '/studio' },
    { name: 'Gallery', href: '/gallery' },
    { name: 'About', href: '/about' },
    { name: 'Demo', href: '/demo' },
    { name: 'Pressure Test', href: '/pressure-test' }
  ]

  return (
    <header className="h-16 md:h-16 border-b border-border bg-card px-3 md:px-4 flex items-center justify-between">
      <div className="flex items-center gap-2 md:gap-4">
        {/* Menu toggle for mobile */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden p-3 min-h-[44px] min-w-[44px] hover:bg-accent rounded-md transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-lg" data-testid="app-logo">
          <div className="w-8 h-8 md:w-8 md:h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
            G
          </div>
          <span className="hidden sm:inline text-sm md:text-lg">Genshi Studio</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1 ml-4 md:ml-8" aria-label="Main navigation">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 md:px-4 py-2 md:py-2 min-h-[40px] rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent text-foreground'
                }`}
                data-testid={`nav-${item.name.toLowerCase()}`}
              >
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="p-3 md:p-2 min-h-[44px] min-w-[44px] md:min-h-[40px] md:min-w-[40px] hover:bg-accent rounded-md transition-colors"
          aria-label="Toggle theme"
          data-testid="theme-toggle"
        >
          {theme === 'light' ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </button>

        {/* Settings - hide on mobile to save space */}
        <button
          className="hidden md:block p-2 hover:bg-accent rounded-md transition-colors"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </button>

        {/* User menu - hide on mobile to save space */}
        <button
          className="hidden md:block p-2 hover:bg-accent rounded-md transition-colors"
          aria-label="User menu"
        >
          <User className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}