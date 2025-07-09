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
      }),
      {
        name: 'genshi-studio-storage',
        partialize: (state) => ({
          theme: state.theme,
          projects: state.projects,
        }),
      }
    )
  )
)