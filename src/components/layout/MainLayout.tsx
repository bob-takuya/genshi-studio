import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { StatusBar } from './StatusBar'
import { useAppStore } from '../../hooks/useAppStore'

export function MainLayout() {
  const { sidebarOpen, setSidebarOpen } = useAppStore()

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />
        
        {/* Page content */}
        <main className="flex-1 overflow-auto bg-background touch-pan-y">
          <Outlet />
        </main>
        
        {/* Status bar - hide on mobile to save space */}
        <div className="hidden md:block">
          <StatusBar />
        </div>
      </div>
    </div>
  )
}