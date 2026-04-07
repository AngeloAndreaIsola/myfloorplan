import { 
  Project as SharedProject, 
  Wall as SharedWall, 
  Room as SharedRoom, 
  PlacedItem as SharedPlacedItem,
  LibraryItem as SharedLibraryItem,
  RenderSettings as SharedRenderSettings,
  WallOpening as SharedWallOpening
} from '@myfloorplan/shared';

export type EditorTab = 'Home' | 'Draw' | 'Items' | 'Explore' | 'Favourites' | 'Settings' | 'Projects'
export type ViewMode = '2D' | '3D'
export type DrawTool = 'Wall' | 'Room' | 'Window' | 'Door' | 'Select' | 'Pan' | 'Ruler'

// UI-specific extensions or re-exports
export type WallLine = SharedWall;
export type Room = SharedRoom;
export type PlacedItem = SharedPlacedItem;
export type LibraryItem = SharedLibraryItem;
export type RenderSettings = SharedRenderSettings;
export type WallOpening = SharedWallOpening;

export type SelectedType = 'Wall' | 'Room' | 'Item'
export interface SelectedElement {
  id: string
  type: SelectedType
}

export type Project = SharedProject;
