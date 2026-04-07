export * from './architecture';
export * from './properties';
export * from './interior';
export * from './environment';
export * from './systems';

// Global Aggregate Floorplan Data Structure
import { Wall, Room, Block } from './architecture';
import { PlacedItem } from './interior';
import { Device, Vehicle, Activity } from './systems';
import { Actor, Creature, Plant, Unit } from './environment';

export interface FloorplanData {
  walls: Wall[];
  rooms: Room[];
  blocks: Block[];
  items: PlacedItem[];
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

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  thumbnailUrl?: string;
  data: FloorplanData;
}
