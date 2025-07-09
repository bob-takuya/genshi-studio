import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Layer {
  id: string
  name: string
  visible: boolean
  locked: boolean
  opacity: number
  elements: any[]
}

interface Project {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
  data: any
}

interface AppState {
  // UI State
  theme: 'light' | 'dark'
  sidebarOpen: boolean
  activeTool: string
  zoom: number
  
  // Canvas State
  canvasMode: 'draw' | 'code'
  layers: Layer[]
  activeLayerId: string | null
  
  // Color State
  colors: string[]
  activeColor: string
  
  // Project State
  currentProject: Project | null
  isOnline: boolean
  isSaving: boolean
  
  // Actions
  setTheme: (theme: 'light' | 'dark') => void
  setSidebarOpen: (open: boolean) => void
  setActiveTool: (tool: string) => void
  setZoom: (zoom: number) => void
  setCanvasMode: (mode: 'draw' | 'code') => void
  setActiveColor: (color: string) => void
  addLayer: (layer: Layer) => void
  removeLayer: (id: string) => void
  updateLayer: (id: string, updates: Partial<Layer>) => void
  setActiveLayer: (id: string | null) => void
  setCurrentProject: (project: Project | null) => void
  setOnlineStatus: (online: boolean) => void
  setSavingStatus: (saving: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial UI State
      theme: 'light',
      sidebarOpen: true,
      activeTool: 'layers',
      zoom: 1,
      
      // Initial Canvas State
      canvasMode: 'draw',
      layers: [
        {
          id: 'default',
          name: 'Layer 1',
          visible: true,
          locked: false,
          opacity: 1,
          elements: []
        }
      ],
      activeLayerId: 'default',
      
      // Initial Color State
      colors: [
        '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
        '#FFFF00', '#FF00FF', '#00FFFF', '#FF8800', '#8800FF',
        '#FF0088', '#00FF88', '#8800FF', '#FF8888', '#88FF88'
      ],
      activeColor: '#000000',
      
      // Initial Project State
      currentProject: null,
      isOnline: true,
      isSaving: false,
      
      // Actions
      setTheme: (theme) => set({ theme }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setActiveTool: (activeTool) => set({ activeTool }),
      setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(5, zoom)) }),
      setCanvasMode: (canvasMode) => set({ canvasMode }),
      setActiveColor: (activeColor) => set({ activeColor }),
      
      addLayer: (layer) => set((state) => ({
        layers: [...state.layers, layer],
        activeLayerId: layer.id
      })),
      
      removeLayer: (id) => set((state) => ({
        layers: state.layers.filter(l => l.id !== id),
        activeLayerId: state.activeLayerId === id 
          ? state.layers[0]?.id || null 
          : state.activeLayerId
      })),
      
      updateLayer: (id, updates) => set((state) => ({
        layers: state.layers.map(l => 
          l.id === id ? { ...l, ...updates } : l
        )
      })),
      
      setActiveLayer: (activeLayerId) => set({ activeLayerId }),
      setCurrentProject: (currentProject) => set({ currentProject }),
      setOnlineStatus: (isOnline) => set({ isOnline }),
      setSavingStatus: (isSaving) => set({ isSaving })
    }),
    {
      name: 'genshi-studio-storage',
      partialize: (state) => ({
        theme: state.theme,
        colors: state.colors,
        currentProject: state.currentProject
      })
    }
  )
)