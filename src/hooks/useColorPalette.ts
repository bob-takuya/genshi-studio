import { useCallback, useEffect, useState } from 'react'
import { useAppStore } from './useAppStore'

/**
 * Hook to manage color palette without clearing it on color changes
 */
export function useColorPalette() {
  const { 
    colors, 
    activeColor, 
    setActiveColor, 
    setColors, 
    addColor, 
    removeColor 
  } = useAppStore()
  
  // Local state to ensure palette persistence
  const [paletteBackup, setPaletteBackup] = useState<string[]>([])

  // Backup palette on mount
  useEffect(() => {
    if (colors && colors.length > 0 && paletteBackup.length === 0) {
      setPaletteBackup([...colors])
    }
  }, [colors, paletteBackup.length])

  // Restore palette if it gets cleared
  useEffect(() => {
    if (colors.length === 0 && paletteBackup.length > 0) {
      console.warn('Color palette was cleared, restoring from backup')
      setColors(paletteBackup)
    }
  }, [colors.length, paletteBackup, setColors])

  const selectColor = useCallback((color: string) => {
    // Always preserve the palette when changing colors
    const currentPalette = colors.length > 0 ? colors : paletteBackup
    
    // Set active color without modifying palette
    setActiveColor(color)
    
    // If palette was accidentally cleared, restore it
    if (colors.length === 0 && currentPalette.length > 0) {
      setColors(currentPalette)
    }
  }, [colors, paletteBackup, setActiveColor, setColors])

  const addToPalette = useCallback((color: string) => {
    if (!colors.includes(color)) {
      addColor(color)
      // Update backup
      setPaletteBackup(prev => [...prev, color])
    }
  }, [colors, addColor])

  const removeFromPalette = useCallback((color: string) => {
    removeColor(color)
    // Update backup
    setPaletteBackup(prev => prev.filter(c => c !== color))
  }, [removeColor])

  const resetPalette = useCallback(() => {
    const defaultColors = [
      '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
      '#FFFF00', '#FF00FF', '#00FFFF', '#FF8800', '#8800FF',
      '#FF0088', '#00FF88', '#8800FF', '#FF8888', '#88FF88'
    ]
    setColors(defaultColors)
    setPaletteBackup(defaultColors)
  }, [setColors])

  return {
    colors: colors.length > 0 ? colors : paletteBackup,
    activeColor,
    selectColor,
    addToPalette,
    removeFromPalette,
    resetPalette,
    isPaletteEmpty: colors.length === 0 && paletteBackup.length === 0
  }
}