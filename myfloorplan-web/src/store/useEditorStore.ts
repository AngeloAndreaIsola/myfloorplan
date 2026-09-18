import { create } from 'zustand'
import {
  EditorTab, ViewMode, DrawTool, WallOpening, WallLine, Room,
  PlacedItem, LibraryItem, SelectedElement, Project, RenderSettings, Floor, Asset,
  FloorplanData
} from '../types'
import { api } from '../lib/api'
import { v4 as uuidv4 } from 'uuid'
import { generateDemoHouse } from '../lib/demoHouse'
import { Wall, StructuralElement } from '@myfloorplan/shared'
import { Device, Vehicle, Activity } from '@myfloorplan/shared'
import { Actor, Creature, Plant, Unit } from '@myfloorplan/shared'

interface EditorState {
  activeTab: EditorTab
  setActiveTab: (tab: EditorTab) => void
  isSidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (isOpen: boolean) => void
  activeTool: DrawTool
  setActiveTool: (tool: DrawTool) => void
  
  selectedElement: SelectedElement | null
  setSelectedElement: (element: SelectedElement | null) => void
  
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
  updateWallOpening: (wallId: string, openingId: string, updates: Partial<WallOpening>) => void
  removeWallOpening: (wallId: string, openingId: string) => void

  placedItems: PlacedItem[]
  selectedLibraryItem: LibraryItem | null
  setSelectedLibraryItem: (item: LibraryItem | null) => void
  addPlacedItem: (item: PlacedItem) => void
  updatePlacedItem: (id: string, updates: Partial<PlacedItem>) => void
  removePlacedItem: (id: string) => void

  // Project Management API Integrated
  projects: Project[]
  currentProjectId: string | null
  isSyncing: boolean
  
  fetchProjects: () => Promise<void>
  setCurrentProjectId: (id: string | null) => void
  addProject: (data: Partial<Project>) => Promise<void>
  removeProject: (id: string) => Promise<void>
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>
  saveCurrentProject: () => Promise<void>
  loadProject: (id: string) => Promise<void>

  // Floor Management
  floors: Floor[]
  currentFloorId: string | null
  addFloor: (name: string, level: number) => void
  switchFloor: (id: string) => void
  removeFloor: (id: string) => void
  createNewProject: () => void
  loadDemoHouse: () => void

  renderSettings: RenderSettings
  setRenderSettings: (settings: Partial<RenderSettings>) => void

  // Assets
  globalAssets: Asset[]
  fetchGlobalAssets: () => Promise<void>
}

export const useEditorStore = create<EditorState>((set, get) => ({
  activeTab: 'Projects',
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
  updateWallOpening: (wallId, openingId, updates) => set((state) => ({
    wallLines: state.wallLines.map(w => w.id === wallId ? {
      ...w,
      openings: (w.openings || []).map(o => o.id === openingId ? { ...o, ...updates } : o)
    } : w)
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

  // Floor Management
  floors: [{
    id: 'ground-floor',
    name: 'Ground Floor',
    level: 0,
    data: { wallLines: [], rooms: [], blocks: [], placedItems: [], entities: { actors: [], creatures: [], plants: [], units: [], devices: [], vehicles: [] }, activities: [] }
  }],
  currentFloorId: 'ground-floor',
  
  addFloor: (name, level) => set((state) => {
    const newFloor: Floor = {
      id: uuidv4(),
      name,
      level,
      data: { wallLines: [], rooms: [], blocks: [], placedItems: [], entities: { actors: [], creatures: [], plants: [], units: [], devices: [], vehicles: [] }, activities: [] }
    }
    return { floors: [...state.floors, newFloor] }
  }),

  switchFloor: (id) => set((state) => {
    if (state.currentFloorId === id) return {}
    
    // Save current active data to current floor
    const updatedFloors = state.floors.map(f => {
      if (f.id === state.currentFloorId) {
        return {
          ...f,
          data: {
            ...f.data,
            wallLines: state.wallLines,
            rooms: state.rooms,
            placedItems: state.placedItems
          }
        }
      }
      return f
    })

    // Load target floor data
    const targetFloor = updatedFloors.find(f => f.id === id)
    if (!targetFloor) return { floors: updatedFloors }

    return {
      floors: updatedFloors,
      currentFloorId: id,
      wallLines: targetFloor.data.wallLines || [],
      rooms: targetFloor.data.rooms || [],
      placedItems: targetFloor.data.placedItems || [],
      selectedElement: null
    }
  }),

  removeFloor: (id) => set((state) => {
    if (state.floors.length <= 1) return {} // Prevent deleting last floor
    const newFloors = state.floors.filter(f => f.id !== id)
    // If we deleted the active floor, switch to the first available
    if (state.currentFloorId === id) {
      const target = newFloors[0]
      return {
        floors: newFloors,
        currentFloorId: target.id,
        wallLines: target.data.wallLines || [],
        rooms: target.data.rooms || [],
        placedItems: target.data.placedItems || [],
        selectedElement: null
      }
    }
    return { floors: newFloors }
  }),

  createNewProject: () => {
    const { projects } = get()
    
    // Create new empty project
    const newProject: Project = {
      id: uuidv4(),
      name: 'New Project',
      thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=2070',
      lastModified: new Date().toISOString(),
      floors: [{
        id: uuidv4(),
        name: 'Ground Floor',
        level: 0,
        data: {
          wallLines: [],
          rooms: [],
          placedItems: []
        }
      }]
    }

    set({
      projects: [...projects, newProject],
      currentProjectId: newProject.id,
      floors: newProject.floors,
      currentFloorId: newProject.floors[0].id,
      wallLines: [],
      rooms: [],
      placedItems: [],
      selectedElement: null,
      activeTab: 'Home'
    })
  },

  loadDemoHouse: () => {
    const demoData = generateDemoHouse()
    const { projects } = get()

    const floorplanData: FloorplanData = {
      wallLines: demoData.wallLines as Wall[],
      rooms: demoData.rooms,
      blocks: [],
      structuralElements: [],
      placedItems: demoData.placedItems,
      entities: {
        actors: [],
        creatures: [],
        plants: [],
        units: [],
        devices: [],
        vehicles: []
      },
      activities: []
    }

    const demoProject: Project = {
      id: uuidv4(),
      name: 'Simple Studio',
      thumbnailUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=2070',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      floors: [{
        id: uuidv4(),
        name: 'Ground Floor',
        level: 0,
        data: floorplanData
      }]
    }

    set({
      projects: [...projects, demoProject],
      currentProjectId: demoProject.id,
      floors: demoProject.floors,
      currentFloorId: demoProject.floors[0].id,
      wallLines: demoData.wallLines || [],
      rooms: demoData.rooms || [],
      placedItems: demoData.placedItems || [],
      selectedElement: null,
      activeTab: 'Home'
    })
  },

  // Project Management (API connected)
  projects: [],
  currentProjectId: null,
  isSyncing: false,

  fetchProjects: async () => {
    try {
      const projects = await api.fetchProjects()
      set({ projects })
    } catch (e) { console.error('Failed to fetch projects', e) }
  },

  setCurrentProjectId: (id) => set({ currentProjectId: id }),

  addProject: async (data) => {
    try {
      set({ isSyncing: true })
      const newProject = await api.createProject(data)
      set((state) => ({ projects: [...state.projects, newProject], isSyncing: false }))
    } catch (e) { 
      console.error(e)
      set({ isSyncing: false })
    }
  },

  removeProject: async (id) => {
    try {
      set({ isSyncing: true })
      await api.deleteProject(id)
      set((state) => ({ 
        projects: state.projects.filter(p => p.id !== id),
        currentProjectId: state.currentProjectId === id ? null : state.currentProjectId,
        isSyncing: false
      }))
    } catch (e) {
      console.error(e)
      set({ isSyncing: false })
    }
  },

  updateProject: async (id, updates) => {
    try {
      set({ isSyncing: true })
      await api.updateProject(id, updates)
      set((state) => ({
        projects: state.projects.map(p => p.id === id ? { ...p, ...updates } : p),
        isSyncing: false
      }))
    } catch (e) {
      console.error(e)
      set({ isSyncing: false })
    }
  },

  saveCurrentProject: async () => {
    const state = get()
    if (!state.currentProjectId) return
    try {
      set({ isSyncing: true })
      
      // Save active data back to current floor before syncing
      const syncedFloors = state.floors.map(f => {
        if (f.id === state.currentFloorId) {
          return {
            ...f,
            data: {
              ...f.data,
              wallLines: state.wallLines,
              rooms: state.rooms,
              placedItems: state.placedItems
            }
          }
        }
        return f
      })

      const projectUpdate = {
        floors: syncedFloors,
        data: syncedFloors[0].data // Backwards compatibility for single-floor apps
      }
      
      await api.syncFloorplan(state.currentProjectId, projectUpdate)
      set({ isSyncing: false, floors: syncedFloors })
    } catch (e) {
      console.error('Save failed', e)
      set({ isSyncing: false })
    }
  },

  loadProject: async (id) => {
    try {
      set({ isSyncing: true })
      const res = await api.loadFloorplan(id)
      const projectData = res.data

      let loadedFloors = projectData?.floors
      
      // Backwards compatibility migration
      if (!loadedFloors || loadedFloors.length === 0) {
        loadedFloors = [{
          id: 'ground-floor',
          name: 'Ground Floor',
          level: 0,
          data: projectData?.data || { wallLines: [], rooms: [], blocks: [], placedItems: [], entities: { actors: [], creatures: [], plants: [], units: [], devices: [], vehicles: [] }, activities: [] }
        }]
      }

      const activeFloor = loadedFloors[0]

      set({
        currentProjectId: id,
        floors: loadedFloors,
        currentFloorId: activeFloor.id,
        wallLines: activeFloor.data?.wallLines || [],
        rooms: activeFloor.data?.rooms || [],
        placedItems: activeFloor.data?.placedItems || [],
        isSyncing: false
      })
    } catch (e) {
      console.error('Load failed', e)
      set({ isSyncing: false })
    }
  },

  renderSettings: {
    sunlight: false,
    shadows: false,
    pbr: false,
    wallTransparency: false
  },
  setRenderSettings: (settings) => set((state) => ({ 
    renderSettings: { ...state.renderSettings, ...settings } 
  })),

  // Assets
  globalAssets: [],
  fetchGlobalAssets: async () => {
    try {
      const assets = await api.fetchAssets()
      set({ globalAssets: assets })
    } catch (e) {
      console.error('Failed to fetch assets', e)
    }
  }
}))
