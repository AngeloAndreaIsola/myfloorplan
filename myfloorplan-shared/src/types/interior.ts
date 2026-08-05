import { Point, Dimensions } from './architecture';

export interface Item {
  id: string;
  name: string;
  category: string;
  position: Point;
  rotation: Point;
  scale: Point;
  modelUrl?: string;
  imageUrl?: string;
  materialId?: string;
}

export interface Furniture extends Item {
  brand?: string;
  dimensions: Dimensions;
  weight?: number;
  components?: string[]; // IDs of sub-items
}

export interface LightingItem extends Item {
  lightType: 'point' | 'spot' | 'ambient';
  intensity: number;
  lightColor: string;
  range?: number;
  castShadows?: boolean;
}

export interface WallDecorationItem extends Item {
  dimensions: Dimensions;
  wallOffset: number;
  thickness: number;
}

export interface LibraryItem {
  id: string;
  title: string;
  category: string;
  modelUrl: string;
  imageUrl: string;
}

import { StructuralElement } from './architecture';
export type PlacedItem = Item | Furniture | LightingItem | WallDecorationItem | StructuralElement;
