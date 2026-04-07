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

export interface LibraryItem {
  id: string;
  title: string;
  category: string;
  modelUrl: string;
  imageUrl: string;
}

export type PlacedItem = Item | Furniture;
