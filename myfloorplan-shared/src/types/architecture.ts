export interface Point {
  x: number;
  y: number;
  z?: number;
}

export interface Dimensions {
  width: number;
  height: number;
  depth?: number;
}

export interface WallOpening {
  id: string;
  type: 'Door' | 'Window';
  styleId?: string; // e.g. 'french-door', 'sliding-glass', 'arched-window'
  offset: number; // Distance from start point [0-1] or absolute
  dimensions: Dimensions;
}

export interface Wall {
  id: string;
  start: Point;
  end: Point;
  thickness: number;
  height: number;
  openings: WallOpening[];
  materialId?: string;
  color?: string;
  textureUrl?: string;
}

export interface Room {
  id: string;
  name: string;
  points: Point[];
  walls: string[]; // IDs of walls forming the room
  area: number;
  volume: number;
  materialId?: string;
  color?: string;
  textureUrl?: string;
}

export interface StructuralElement {
  id: string;
  type: 'Stair' | 'Column';
  styleId?: string; // 'spiral', 'straight', 'dorian', 'modern'
  position: Point;
  rotation: number;
  dimensions: Dimensions;
  materialId?: string;
  color?: string;
  textureUrl?: string;
  
  // Stair specific properties
  stepCount?: number;
  rise?: number; // Height of each step
  run?: number;  // Depth of each step
  hasHandrail?: boolean;
}

export interface Block {
  id: string;
  name: string;
  type: 'Structural' | 'Decorative' | 'Space';
  bounds: {
    min: Point;
    max: Point;
  };
}
