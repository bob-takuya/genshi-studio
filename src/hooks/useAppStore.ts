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

interface Bookmark {
  id: string
  name: string
  projectData: any
  timestamp: Date
}

interface Preset {
  id: string
  name: string
  description?: string
  patternType: string
  parameters: any
  preview?: string
}

interface AppState {
  // UI State
  theme: 'light' | 'dark'
  sidebarOpen: boolean
  activeTool: string
  zoom: number
  
  // Canvas State
  canvasMode: 'draw' | 'code' | 'parametric' | 'growth'
  layers: Layer[]
  activeLayerId: string | null
  
  // Color State
  colors: string[]
  activeColor: string
  
  // Project State
  currentProject: Project | null
  isOnline: boolean
  isSaving: boolean
  
  // Toolbar State
  toolbarMode: 'draw' | 'select' | 'text' | 'shape' | 'erase'
  setToolbarMode: (mode: AppState['toolbarMode']) => void
  
  // Dialog States
  exportDialogOpen: boolean
  setExportDialogOpen: (open: boolean) => void
  presetDialogOpen: boolean
  setPresetDialogOpen: (open: boolean) => void
  bookmarkDialogOpen: boolean
  setBookmarkDialogOpen: (open: boolean) => void
  
  // Bookmarks
  bookmarks: Bookmark[]
  saveBookmark: (bookmark: Bookmark) => void
  loadBookmark: (id: string) => void
  deleteBookmark: (id: string) => void
  
  // Presets
  presets: Preset[]
  loadPreset: (id: string) => void
  createPreset: (preset: Preset) => void
  deletePreset: (id: string) => void
  
  // Canvas Actions
  resetCanvas: () => void
  saveProject: (data: any) => void
  
  // Actions
  setTheme: (theme: 'light' | 'dark') => void
  setSidebarOpen: (open: boolean) => void
  setActiveTool: (tool: string) => void
  setZoom: (zoom: number) => void
  setCanvasMode: (mode: 'draw' | 'code' | 'parametric' | 'growth') => void
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
      
      // Initial Toolbar State
      toolbarMode: 'select',
      
      // Initial Dialog States
      exportDialogOpen: false,
      presetDialogOpen: false,
      bookmarkDialogOpen: false,
      
      // Initial Bookmarks
      bookmarks: [],
      
      // Initial Presets
      presets: [
        {
          id: 'geometric-waves',
          name: 'Geometric Waves',
          description: 'Flowing wave patterns with geometric elements',
          patternType: 'waves',
          parameters: { amplitude: 50, frequency: 0.1, complexity: 3 }
        },
        {
          id: 'organic-flow',
          name: 'Organic Flow',
          description: 'Natural flowing patterns inspired by nature',
          patternType: 'flow',
          parameters: { density: 0.7, smoothness: 0.8, variation: 0.5 }
        },
        {
          id: 'maze-classic',
          name: 'Classic Maze',
          description: 'Traditional maze pattern with clean lines',
          patternType: 'maze',
          parameters: { cellSize: 20, complexity: 0.6, deadEnds: true }
        }
      ],
      
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
      setSavingStatus: (isSaving) => set({ isSaving }),
      
      // Toolbar Actions
      setToolbarMode: (toolbarMode) => set({ toolbarMode }),
      
      // Dialog Actions
      setExportDialogOpen: (exportDialogOpen) => set({ exportDialogOpen }),
      setPresetDialogOpen: (presetDialogOpen) => set({ presetDialogOpen }),
      setBookmarkDialogOpen: (bookmarkDialogOpen) => set({ bookmarkDialogOpen }),
      
      // Bookmark Actions
      saveBookmark: (bookmark) => set((state) => ({ 
        bookmarks: [...state.bookmarks, bookmark] 
      })),
      loadBookmark: (id) => set((state) => {
        const bookmark = state.bookmarks.find(b => b.id === id)
        if (bookmark && state.currentProject) {
          return {
            currentProject: {
              ...state.currentProject,
              data: bookmark.projectData,
              updatedAt: new Date()
            }
          }
        }
        return state
      }),
      deleteBookmark: (id) => set((state) => ({ 
        bookmarks: state.bookmarks.filter(b => b.id !== id) 
      })),
      
      // Preset Actions
      loadPreset: (id) => set((state) => {
        const preset = state.presets.find(p => p.id === id)
        if (preset && state.currentProject) {
          const updatedData = {
            ...state.currentProject.data,
            patternType: preset.patternType,
            parameters: preset.parameters
          }
          return {
            currentProject: {
              ...state.currentProject,
              data: updatedData,
              updatedAt: new Date()
            }
          }
        }
        return state
      }),
      createPreset: (preset) => set((state) => ({ 
        presets: [...state.presets, preset] 
      })),
      deletePreset: (id) => set((state) => ({ 
        presets: state.presets.filter(p => p.id !== id) 
      })),
      
      // Canvas Actions
      resetCanvas: () => set({ 
        zoom: 1, 
        toolbarMode: 'select',
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
        activeLayerId: 'default'
      }),
      saveProject: (data) => set((state) => {
        if (!state.currentProject) {
          // Create new project if none exists
          const newProject: Project = {
            id: crypto.randomUUID(),
            name: `Project ${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            data: data || {}
          }
          return { currentProject: newProject }
        }
        
        // Update existing project
        const updatedProject = {
          ...state.currentProject,
          data: { ...state.currentProject.data, ...data },
          updatedAt: new Date()
        }
        return { currentProject: updatedProject }
      })
    }),
    {
      name: 'genshi-studio-storage',
      partialize: (state) => ({
        theme: state.theme,
        colors: state.colors,
        currentProject: state.currentProject,
        bookmarks: state.bookmarks,
        presets: state.presets,
        toolbarMode: state.toolbarMode
      })
    }
  )
)