import { Entity } from './environment';
import { Point } from './architecture';

export interface Device extends Entity {
  status: 'on' | 'off' | 'standby' | 'error';
  battery?: number; // [0-100]
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
}

export interface Vehicle extends Entity {
  speed: number;
  fuelType: 'electric' | 'gasoline' | 'none';
  batteryLevel?: number;
}

export interface Activity {
  id: string;
  name: string;
  type: string;
  actors: string[]; // Actor IDs participating
  position: Point;
  duration: number; // In seconds
  status: 'pending' | 'in-progress' | 'completed';
}
