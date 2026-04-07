import { Point } from './architecture';

export interface Entity {
  id: string;
  name: string;
  type: string;
  position: Point;
  rotation?: Point;
  scale?: Point;
}

export interface Unit extends Entity {
  powerStatus?: boolean;
  modelNumber?: string;
}

export interface Actor extends Entity {
  role: string;
  capabilities: string[]; // ['move', 'speak', 'interact']
}

export interface Creature extends Actor {
  species: string;
  behavior: 'passive' | 'aggressive' | 'neutral';
}

export interface Plant extends Entity {
  species: string;
  health: number; // [0-1]
  growthStage: 'seedling' | 'growing' | 'mature' | 'withering';
}
