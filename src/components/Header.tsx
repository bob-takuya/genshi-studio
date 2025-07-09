import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store/appStore'
import { 
  Menu, 
  X, 
  Sun, 
  Moon, 
  Settings,
  User,
  HelpCircle,
  LogOut
} from 'lucide-react'

export default function Header() {
  const location = useLocation()
  const { theme, toggleTheme, sidebarOpen, setSidebarOpen } = useAppStore()

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/studio', label: 'Studio' },
    { path: '/gallery', label: 'Gallery' },
    { path: '/about', label: 'About' },
  ]

  return (
    <header className="relative z-10 flex items-center justify-between px-6 py-4 bg-surface border-b border-border">
      {/* Logo and Nav */}
      <div className="flex items-center space-x-8">
        {/* Menu Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-background transition-colors"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg"
          />
          <span className="text-xl font-bold gradient-text">Genshi Studio</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                location.pathname === item.path
                  ? 'bg-primary text-white'
                  : 'hover:bg-background text-text-secondary hover:text-text-primary'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-background transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* User Menu */}
        <div className="relative group">
          <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-background transition-colors">
            <User size={20} />
            <span className="hidden md:inline text-sm">Guest User</span>
          </button>

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 py-2 bg-surface border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
            <button className="w-full px-4 py-2 text-left text-sm hover:bg-background transition-colors flex items-center space-x-2">
              <Settings size={16} />
              <span>Settings</span>
            </button>
            <button className="w-full px-4 py-2 text-left text-sm hover:bg-background transition-colors flex items-center space-x-2">
              <HelpCircle size={16} />
              <span>Help & Support</span>
            </button>
            <hr className="my-2 border-border" />
            <button className="w-full px-4 py-2 text-left text-sm hover:bg-background transition-colors flex items-center space-x-2 text-red-400">
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}