import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import {
  EditorTab, ViewMode, DrawTool, WallOpening, WallLine, Room,
  PlacedItem, LibraryItem, SelectedElement, Project, RenderSettings
} from '../types'

interface EditorState {
  activeTab: EditorTab
  setActiveTab: (tab: EditorTab) => void
  isSidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (isOpen: boolean) => void
  activeTool: DrawTool
  setActiveTool: (tool: DrawTool) => void
  
  // Selection
  selectedElement: SelectedElement | null
  setSelectedElement: (element: SelectedElement | null) => void
  
  // Floorplan Data
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  wallLines: WallLine[]
  addWallLine: (line: WallLine) => void
  setWallLines: (lines: WallLine[]) => void
  updateWallLine: (id: string, updates: Partial<WallLine>) => void
  removeWallLine: (id: string) => void
  gridSize: number
  setGridSize: (size: number) => void

  rooms: Room[]
  addRoom: (room: Room) => void
  updateRoom: (id: string, updates: Partial<Room>) => void
  removeRoom: (id: string) => void

  addWallOpening: (wallId: string, opening: WallOpening) => void
  removeWallOpening: (wallId: string, openingId: string) => void

  // Furniture Items
  placedItems: PlacedItem[]
  selectedLibraryItem: LibraryItem | null
  setSelectedLibraryItem: (item: LibraryItem | null) => void
  addPlacedItem: (item: PlacedItem) => void
  updatePlacedItem: (id: string, updates: Partial<PlacedItem>) => void
  removePlacedItem: (id: string) => void

  // Project Management
  projects: Project[]
  currentProjectId: string | null
  setCurrentProjectId: (id: string | null) => void
  addProject: (project: Project) => void
  removeProject: (id: string) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  saveCurrentProject: () => void
  loadProject: (id: string) => void
  // Rendering Settings
  renderSettings: RenderSettings
  setRenderSettings: (settings: Partial<RenderSettings>) => void
}

const DEFAULT_PROJECT_ID = uuidv4()

export const useEditorStore = create<EditorState>((set, get) => ({
  activeTab: 'Home',
  setActiveTab: (tab) => set({ activeTab: tab }),
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  activeTool: 'Wall',
  setActiveTool: (tool) => set({ activeTool: tool }),
  
  selectedElement: null,
  setSelectedElement: (element) => set({ selectedElement: element }),
  
  viewMode: '2D',
  setViewMode: (mode) => set({ viewMode: mode }),
  wallLines: [],
  addWallLine: (line) => set((state) => ({ wallLines: [...state.wallLines, line] })),
  updateWallLine: (id, updates) => set((state) => ({
    wallLines: state.wallLines.map(w => w.id === id ? { ...w, ...updates } : w)
  })),
  setWallLines: (lines) => set({ wallLines: lines }),
  removeWallLine: (id) => set((state) => ({ wallLines: state.wallLines.filter(w => w.id !== id) })),
  gridSize: 20,
  setGridSize: (size) => set({ gridSize: size }),

  rooms: [],
  addRoom: (room) => set((state) => ({ rooms: [...state.rooms, room] })),
  updateRoom: (id, updates) => set((state) => ({
    rooms: state.rooms.map(r => r.id === id ? { ...r, ...updates } : r)
  })),
  removeRoom: (id) => set((state) => ({ rooms: state.rooms.filter(r => r.id !== id) })),

  addWallOpening: (wallId, opening) => set((state) => ({
    wallLines: state.wallLines.map(w => w.id === wallId ? { ...w, openings: [...(w.openings || []), opening] } : w)
  })),
  removeWallOpening: (wallId, openingId) => set((state) => ({
    wallLines: state.wallLines.map(w => w.id === wallId ? { ...w, openings: (w.openings || []).filter(o => o.id !== openingId) } : w)
  })),

  placedItems: [],
  selectedLibraryItem: null,
  setSelectedLibraryItem: (item) => set({ selectedLibraryItem: item }),
  addPlacedItem: (item) => set((state) => ({ placedItems: [...state.placedItems, item] })),
  updatePlacedItem: (id, updates) => set((state) => ({
    placedItems: state.placedItems.map(item => item.id === id ? { ...item, ...updates } : item)
  })),
  removePlacedItem: (id) => set((state) => ({
    placedItems: state.placedItems.filter(item => item.id !== id)
  })),

  // Project Management
  projects: [
    {
      id: DEFAULT_PROJECT_ID,
      name: 'Default Project',
      description: 'Initial workspace project',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      data: { wallLines: [], rooms: [], placedItems: [] }
    }
  ],
  currentProjectId: DEFAULT_PROJECT_ID,
  setCurrentProjectId: (id) => set({ currentProjectId: id }),
  addProject: (project) => set((state) => ({ projects: [...state.projects, project] })),
  removeProject: (id) => set((state) => ({ 
    projects: state.projects.filter(p => p.id !== id),
    currentProjectId: state.currentProjectId === id ? null : state.currentProjectId
  })),
  updateProject: (id, updates) => set((state) => ({
    projects: state.projects.map(p => p.id === id ? { ...p, ...updates } : p)
  })),
  saveCurrentProject: () => {
    const state = get()
    if (!state.currentProjectId) return
    set((state) => ({
      projects: state.projects.map(p => p.id === state.currentProjectId ? {
        ...p,
        updatedAt: new Date().toISOString(),
        data: {
          wallLines: state.wallLines,
          rooms: state.rooms,
          placedItems: state.placedItems
        }
      } : p)
    }))
  },
  loadProject: (id) => {
    const project = get().projects.find(p => p.id === id)
    if (project) {
      set({
        currentProjectId: id,
        wallLines: project.data.wallLines,
        rooms: project.data.rooms,
        placedItems: project.data.placedItems
      })
    }
  },

  renderSettings: {
    sunlight: false,
    shadows: false,
    pbr: false
  },
  setRenderSettings: (settings) => set((state) => ({ 
    renderSettings: { ...state.renderSettings, ...settings } 
  }))
}))

