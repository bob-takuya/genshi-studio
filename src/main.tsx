import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/index.css'

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/genshi-studio/sw.js', {
        scope: '/genshi-studio/'
      })
      
      console.log('Service Worker registered successfully:', registration)
      
      // Wait for the service worker to be ready and controlling the page
      await navigator.serviceWorker.ready
      console.log('Service Worker is ready and controlling the page')
      
      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              console.log('New app version available')
            }
          })
        }
      })
      
      // Handle controller change (when SW takes control)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker controller changed')
      })
    } catch (error) {
      console.error('Service Worker registration failed:', error)
    }
  })
}

// Create root element and render the app
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename="/genshi-studio">
      <App />
    </BrowserRouter>
  </React.StrictMode>
)