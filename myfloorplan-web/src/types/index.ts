export type EditorTab = 'Home' | 'Draw' | 'Items' | 'Explore' | 'Favourites' | 'Settings' | 'Projects'
export type ViewMode = '2D' | '3D'
export type DrawTool = 'Wall' | 'Room' | 'Window' | 'Door' | 'Select' | 'Pan' | 'Ruler'

export interface WallOpening {
  id: string
  type: 'Door' | 'Window'
  offset: number // Distance from start point [0-1]
  width: number
}

export interface WallLine {
  id: string
  points: number[] // [x1, y1, x2, y2]
  thickness?: number
  color?: string
  textureUrl?: string
  openings?: WallOpening[]
}

export interface Room {
  id: string
  points: number[] // Flattened [x, y, x, y...]
  name?: string
  color?: string
  textureUrl?: string
}

export interface PlacedItem {
  id: string
  type: string
  category: string
  position: { x: number, y: number, z: number }
  rotation: number
  scale: number
  modelUrl?: string
  imageUrl?: string
}

export interface LibraryItem {
  id: string
  title: string
  category: string
  modelUrl: string
  imageUrl: string
}

export type SelectedType = 'Wall' | 'Room' | 'Item'
export interface SelectedElement {
  id: string
  type: SelectedType
}

export interface RenderSettings {
  sunlight: boolean
  shadows: boolean
  pbr: boolean
}

export interface Project {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  thumbnailUrl?: string
  data: {
    wallLines: WallLine[]
    rooms: Room[]
    placedItems: PlacedItem[]
  }
}
