import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface Project {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
  data: any
  thumbnail?: string
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
  // Theme
  theme: 'dark' | 'light'
  setTheme: (theme: 'dark' | 'light') => void
  toggleTheme: () => void

  // Projects
  projects: Project[]
  currentProject: Project | null
  createProject: (name: string) => Project
  loadProject: (id: string) => void
  saveProject: (data: any) => void
  deleteProject: (id: string) => void

  // UI State
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toolbarMode: 'draw' | 'select' | 'text' | 'shape' | 'erase'
  setToolbarMode: (mode: AppState['toolbarMode']) => void

  // Canvas State
  canvasZoom: number
  setCanvasZoom: (zoom: number) => void
  canvasPosition: { x: number; y: number }
  setCanvasPosition: (position: { x: number; y: number }) => void
  resetCanvas: () => void
  
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
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // Theme
        theme: 'dark',
        setTheme: (theme) => set({ theme }),
        toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

        // Projects
        projects: [],
        currentProject: null,
        createProject: (name) => {
          const newProject: Project = {
            id: crypto.randomUUID(),
            name,
            createdAt: new Date(),
            updatedAt: new Date(),
            data: {
              canvas: {
                objects: [],
                background: '#ffffff',
                width: 1920,
                height: 1080,
              },
              settings: {
                gridEnabled: true,
                snapToGrid: false,
                gridSize: 20,
              }
            }
          }
          set((state) => ({
            projects: [...state.projects, newProject],
            currentProject: newProject,
          }))
          return newProject
        },
        loadProject: (id) => {
          const project = get().projects.find((p) => p.id === id)
          if (project) {
            set({ currentProject: project })
          }
        },
        saveProject: (data) => {
          const { currentProject } = get()
          if (!currentProject) return

          const updatedProject = {
            ...currentProject,
            data,
            updatedAt: new Date(),
          }

          set((state) => ({
            currentProject: updatedProject,
            projects: state.projects.map((p) =>
              p.id === currentProject.id ? updatedProject : p
            ),
          }))
        },
        deleteProject: (id) => {
          set((state) => ({
            projects: state.projects.filter((p) => p.id !== id),
            currentProject: state.currentProject?.id === id ? null : state.currentProject,
          }))
        },

        // UI State
        sidebarOpen: true,
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        toolbarMode: 'select',
        setToolbarMode: (mode) => set({ toolbarMode: mode }),

        // Canvas State
        canvasZoom: 1,
        setCanvasZoom: (zoom) => set({ canvasZoom: Math.max(0.1, Math.min(5, zoom)) }),
        canvasPosition: { x: 0, y: 0 },
        setCanvasPosition: (position) => set({ canvasPosition: position }),
        resetCanvas: () => set({ canvasZoom: 1, canvasPosition: { x: 0, y: 0 }, toolbarMode: 'select' }),
        
        // Dialog States
        exportDialogOpen: false,
        setExportDialogOpen: (open) => set({ exportDialogOpen: open }),
        presetDialogOpen: false,
        setPresetDialogOpen: (open) => set({ presetDialogOpen: open }),
        bookmarkDialogOpen: false,
        setBookmarkDialogOpen: (open) => set({ bookmarkDialogOpen: open }),
        
        // Bookmarks
        bookmarks: [],
        saveBookmark: (bookmark) => set((state) => ({ bookmarks: [...state.bookmarks, bookmark] })),
        loadBookmark: (id) => {
          const bookmark = get().bookmarks.find(b => b.id === id)
          if (bookmark && get().currentProject) {
            get().saveProject(bookmark.projectData)
          }
        },
        deleteBookmark: (id) => set((state) => ({ bookmarks: state.bookmarks.filter(b => b.id !== id) })),
        
        // Presets
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
        loadPreset: (id) => {
          const preset = get().presets.find(p => p.id === id)
          if (preset && get().currentProject) {
            const updatedData = {
              ...get().currentProject!.data,
              patternType: preset.patternType,
              parameters: preset.parameters
            }
            get().saveProject(updatedData)
          }
        },
        createPreset: (preset) => set((state) => ({ presets: [...state.presets, preset] })),
        deletePreset: (id) => set((state) => ({ presets: state.presets.filter(p => p.id !== id) })),
      }),
      {
        name: 'genshi-studio-storage',
        partialize: (state) => ({
          theme: state.theme,
          projects: state.projects,
          bookmarks: state.bookmarks,
          presets: state.presets,
        }),
      }
    )
  )
)