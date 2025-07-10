import React, { useState, useEffect } from 'react'
import { WifiOff, Wifi } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showIndicator, setShowIndicator] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowIndicator(true)
      // Hide success indicator after 3 seconds
      setTimeout(() => setShowIndicator(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowIndicator(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Show indicator initially if offline
    if (!navigator.onLine) {
      setShowIndicator(true)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <AnimatePresence>
      {showIndicator && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-white ${
            isOnline 
              ? 'bg-green-500' 
              : 'bg-red-500'
          }`}
          data-testid={isOnline ? "online-indicator" : "offline-indicator"}
        >
          {isOnline ? (
            <>
              <Wifi className="h-4 w-4" />
              <span>Back online</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4" />
              <span>You're offline</span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function CachedContentIndicator() {
  const [showCached, setShowCached] = useState(false)

  useEffect(() => {
    // Check if we're running from cache
    const checkCacheStatus = async () => {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        // We have a service worker, likely serving cached content
        if (!navigator.onLine) {
          setShowCached(true)
        }
      }
    }

    checkCacheStatus()

    const handleOffline = () => {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        setShowCached(true)
      }
    }

    const handleOnline = () => {
      setShowCached(false)
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  if (!showCached) return null

  return (
    <div 
      className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4"
      data-testid="cached-content"
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700">
            You're viewing cached content. Some features may be limited while offline.
          </p>
        </div>
      </div>
    </div>
  )
}