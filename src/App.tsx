import { Routes, Route } from 'react-router-dom'
import { MainLayout } from './components/layout/MainLayout'
import { StudioPageUnified } from './pages/StudioPageUnified'
import { HomePage } from './pages/HomePage'
import { GalleryPage } from './pages/GalleryPage'
import AboutPage from './pages/AboutPage'
import { PressureTestPage } from './pages/PressureTestPage'
import { DemoPage } from './pages/DemoPage'
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
            <Route index element={<HomePage />} />
            <Route path="studio" element={<StudioPageUnified />} />
            <Route path="home" element={<HomePage />} />
            <Route path="gallery" element={<GalleryPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="pressure-test" element={<PressureTestPage />} />
          </Route>
          <Route path="/demo" element={<DemoPage />} />
        </Routes>
        
        {/* PWA and offline functionality */}
        <OfflineIndicator />
      </div>
    </ThemeProvider>
  )
}

export default App