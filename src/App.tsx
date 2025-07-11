import { Routes, Route } from 'react-router-dom'
import { MainLayout } from './components/layout/MainLayout'
import { StudioPage } from './pages/StudioPage'
import { HomePage } from './pages/HomePage'
import { GalleryPage } from './pages/GalleryPage'
import AboutPage from './pages/AboutPage'
import { PressureTestPage } from './pages/PressureTestPage'
import { useAppStore } from './hooks/useAppStore'
import { ThemeProvider } from './components/providers/ThemeProvider'
import { OfflineIndicator } from './components/OfflineIndicator'

function App() {
  const { theme } = useAppStore()

  return (
    <ThemeProvider theme={theme}>
      <div className="app min-h-screen bg-background text-foreground">
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<StudioPage />} />
            <Route path="home" element={<HomePage />} />
            <Route path="gallery" element={<GalleryPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="pressure-test" element={<PressureTestPage />} />
          </Route>
        </Routes>
        
        {/* PWA and offline functionality */}
        <OfflineIndicator />
      </div>
    </ThemeProvider>
  )
}

export default App