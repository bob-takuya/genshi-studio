import React, { useEffect, useLayoutEffect } from 'react'

interface ThemeProviderProps {
  theme: 'light' | 'dark'
  children: React.ReactNode
}

export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  // Use useLayoutEffect to apply theme before paint to avoid flash
  useLayoutEffect(() => {
    const root = document.documentElement
    
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  return <>{children}</>
}