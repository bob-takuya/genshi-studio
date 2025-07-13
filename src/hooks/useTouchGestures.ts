import { useCallback, useRef, useEffect } from 'react'

interface TouchGestureConfig {
  onPinch?: (scale: number, center: { x: number; y: number }) => void
  onPan?: (deltaX: number, deltaY: number) => void
  onTap?: (point: { x: number; y: number }) => void
  onDoubleTap?: (point: { x: number; y: number }) => void
  onLongPress?: (point: { x: number; y: number }) => void
  panThreshold?: number
  doubleTapThreshold?: number
  longPressThreshold?: number
  element?: HTMLElement | null
}

interface TouchState {
  lastTouches: Touch[]
  lastDistance: number
  lastCenter: { x: number; y: number }
  isPinching: boolean
  isPanning: boolean
  isLongPress: boolean
  tapCount: number
  lastTapTime: number
  longPressTimer: number | null
}

export function useTouchGestures(config: TouchGestureConfig) {
  const {
    onPinch,
    onPan,
    onTap,
    onDoubleTap,
    onLongPress,
    panThreshold = 10,
    doubleTapThreshold = 300,
    longPressThreshold = 500,
    element
  } = config

  const touchState = useRef<TouchState>({
    lastTouches: [],
    lastDistance: 0,
    lastCenter: { x: 0, y: 0 },
    isPinching: false,
    isPanning: false,
    isLongPress: false,
    tapCount: 0,
    lastTapTime: 0,
    longPressTimer: null
  })

  const handleTouchStart = useCallback((e: TouchEvent) => {
    e.preventDefault()
    const touches = Array.from(e.touches)
    const state = touchState.current

    // Clear any existing long press timer
    if (state.longPressTimer) {
      clearTimeout(state.longPressTimer)
      state.longPressTimer = null
    }

    if (touches.length === 1) {
      // Single touch
      const touch = touches[0]
      const point = { x: touch.clientX, y: touch.clientY }
      
      state.lastTouches = touches
      state.isPinching = false
      state.isPanning = false
      state.isLongPress = false

      // Start long press timer
      if (onLongPress) {
        state.longPressTimer = window.setTimeout(() => {
          state.isLongPress = true
          onLongPress(point)
        }, longPressThreshold)
      }

      // Handle tap detection
      const now = Date.now()
      if (now - state.lastTapTime < doubleTapThreshold) {
        state.tapCount++
      } else {
        state.tapCount = 1
      }
      state.lastTapTime = now

    } else if (touches.length === 2) {
      // Two finger gesture
      const touch1 = touches[0]
      const touch2 = touches[1]
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
      const center = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2
      }

      state.lastTouches = touches
      state.lastDistance = distance
      state.lastCenter = center
      state.isPinching = true
      state.isPanning = false
      
      // Clear long press timer
      if (state.longPressTimer) {
        clearTimeout(state.longPressTimer)
        state.longPressTimer = null
      }
    }
  }, [onLongPress, doubleTapThreshold, longPressThreshold])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault()
    const touches = Array.from(e.touches)
    const state = touchState.current

    if (touches.length === 1 && state.lastTouches.length === 1) {
      // Single touch movement
      const touch = touches[0]
      const lastTouch = state.lastTouches[0]
      
      const deltaX = touch.clientX - lastTouch.clientX
      const deltaY = touch.clientY - lastTouch.clientY
      const distance = Math.hypot(deltaX, deltaY)

      if (distance > panThreshold && !state.isLongPress) {
        if (!state.isPanning) {
          state.isPanning = true
          // Clear long press timer when panning starts
          if (state.longPressTimer) {
            clearTimeout(state.longPressTimer)
            state.longPressTimer = null
          }
        }
        
        if (onPan) {
          onPan(deltaX, deltaY)
        }
      }

      state.lastTouches = touches

    } else if (touches.length === 2 && state.isPinching) {
      // Two finger pinch/zoom
      const touch1 = touches[0]
      const touch2 = touches[1]
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
      const center = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2
      }

      if (state.lastDistance > 0 && onPinch) {
        const scale = distance / state.lastDistance
        onPinch(scale, center)
      }

      state.lastDistance = distance
      state.lastCenter = center
      state.lastTouches = touches
    }
  }, [onPan, onPinch, panThreshold])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    e.preventDefault()
    const state = touchState.current

    // Clear long press timer
    if (state.longPressTimer) {
      clearTimeout(state.longPressTimer)
      state.longPressTimer = null
    }

    // Handle tap gestures if not panning or long pressing
    if (!state.isPanning && !state.isLongPress && state.lastTouches.length === 1) {
      const touch = state.lastTouches[0]
      const point = { x: touch.clientX, y: touch.clientY }

      if (state.tapCount === 1) {
        // Single tap - wait to see if it becomes a double tap
        setTimeout(() => {
          if (state.tapCount === 1 && onTap) {
            onTap(point)
          }
          state.tapCount = 0
        }, doubleTapThreshold)
      } else if (state.tapCount === 2 && onDoubleTap) {
        // Double tap
        onDoubleTap(point)
        state.tapCount = 0
      }
    }

    // Reset state
    state.lastTouches = []
    state.lastDistance = 0
    state.isPinching = false
    state.isPanning = false
    state.isLongPress = false
  }, [onTap, onDoubleTap, doubleTapThreshold])

  // Attach event listeners
  useEffect(() => {
    const targetElement = element || document

    if (targetElement) {
      targetElement.addEventListener('touchstart', handleTouchStart, { passive: false })
      targetElement.addEventListener('touchmove', handleTouchMove, { passive: false })
      targetElement.addEventListener('touchend', handleTouchEnd, { passive: false })

      return () => {
        targetElement.removeEventListener('touchstart', handleTouchStart)
        targetElement.removeEventListener('touchmove', handleTouchMove)
        targetElement.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [element, handleTouchStart, handleTouchMove, handleTouchEnd])

  return {
    touchState: touchState.current
  }
}