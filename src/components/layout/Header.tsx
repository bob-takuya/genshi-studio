import { Link, useLocation } from 'react-router-dom'
import { Menu, Moon, Sun, Settings, User } from 'lucide-react'
import { useAppStore } from '../../hooks/useAppStore'

export function Header() {
  const location = useLocation()
  const { theme, setTheme, setSidebarOpen } = useAppStore()

  const navigation = [
    { name: 'Studio', href: '/' },
    { name: 'Gallery', href: '/gallery' },
    { name: 'Pressure Test', href: '/pressure-test' },
    { name: 'About', href: '/about' }
  ]

  return (
    <header className="h-16 border-b border-border bg-card px-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Menu toggle for mobile */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 hover:bg-accent rounded-md transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-lg" data-testid="app-logo">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
            G
          </div>
          <span className="hidden sm:inline">Genshi Studio</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1 ml-8" aria-label="Main navigation">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent text-foreground'
                }`}
              >
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="p-2 hover:bg-accent rounded-md transition-colors"
          aria-label="Toggle theme"
          data-testid="theme-toggle"
        >
          {theme === 'light' ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </button>

        {/* Settings */}
        <button
          className="p-2 hover:bg-accent rounded-md transition-colors"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </button>

        {/* User menu */}
        <button
          className="p-2 hover:bg-accent rounded-md transition-colors"
          aria-label="User menu"
        >
          <User className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}