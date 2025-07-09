import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { MainLayout } from './components/layout/MainLayout'
import { StudioPage } from './pages/StudioPage'
import { HomePage } from './pages/HomePage'
import { GalleryPage } from './pages/GalleryPage'
import AboutPage from './pages/AboutPage'
import { useAppStore } from './hooks/useAppStore'
import { ThemeProvider } from './components/providers/ThemeProvider'

function App() {
  const { theme } = useAppStore()

  return (
    <ThemeProvider theme={theme}>
      <div className="app min-h-screen bg-background text-foreground">
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="studio" element={<StudioPage />} />
            <Route path="gallery" element={<GalleryPage />} />
            <Route path="about" element={<AboutPage />} />
          </Route>
        </Routes>
      </div>
    </ThemeProvider>
  )
}

export default App