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
}

export interface Room {
  id: string;
  name: string;
  points: Point[];
  walls: string[]; // IDs of walls forming the room
  area: number;
  volume: number;
  materialId?: string;
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
