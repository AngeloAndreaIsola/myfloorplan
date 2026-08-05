export * from './architecture';
export * from './properties';
export * from './interior';
export * from './environment';
export * from './systems';

// Global Aggregate Floorplan Data Structure
import { Wall, Room, Block, StructuralElement } from './architecture';
import { PlacedItem } from './interior';
import { Device, Vehicle, Activity } from './systems';
import { Actor, Creature, Plant, Unit } from './environment';

export interface FloorplanData {
  wallLines: Wall[]; // Migrated 'walls' to 'wallLines' per frontend store usage
  rooms: Room[];
  blocks: Block[];
  structuralElements?: StructuralElement[]; // Added support for stairs/columns
  placedItems: PlacedItem[]; // Migrated 'items' to 'placedItems'
  entities: {
    actors: Actor[];
    creatures: Creature[];
    plants: Plant[];
    units: Unit[];
    devices: Device[];
    vehicles: Vehicle[];
  };
  activities: Activity[];
}

export interface Floor {
  id: string;
  name: string;
  level: number;
  data: FloorplanData;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  thumbnailUrl?: string;
  data?: FloorplanData; // Legacy support
  floors?: Floor[];
}

export interface Asset {
  assetId: string;
  assetType: 'model' | 'texture';
  downloadUrl: string;
  fileExt: string;
  fileSize?: number;
  name: string;
  description: string;
  category: string;
  thumbnailUrl: string;
  sourceUrl: string;
  createdAt: string;
  scrapedAt: string;
  scrapedFrom: string;
}

export interface AssetSource {
  id: string;
  name: string;
  baseUrl?: string;
  sourceType: 'crawler' | 'api' | 'upload';
  config?: any;
  createdAt: string | number;
}

export interface AssetJob {
  id: string;
  sourceId?: string;
  jobType: 'collect' | 'modify' | 'export';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;
  logs?: string;
  result?: any;
  createdAt: string | number;
  updatedAt: string | number;
}

export interface FloorplanItemGroup {
  id: string;
  name: string;
  description?: string;
  createdAt: string | number;
  updatedAt: string | number;
}

export interface FloorplanItem {
  id: string;
  assetId: string;
  name: string;
  itemObjectType?: string;
  tags?: string[];
  itemWidth?: number;
  itemHeight?: number;
  config?: {
    colors?: string[];
    textures?: string[];
    defaultScale?: number;
    resizingConstraints?: { minWidth?: number; maxWidth?: number; minHeight?: number; maxHeight?: number };
  };
  groupId?: string;
  createdAt: string | number;
  updatedAt: string | number;
}
