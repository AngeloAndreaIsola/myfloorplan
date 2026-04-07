export interface Material {
  id: string;
  name: string;
  color?: string;
  textureUrl?: string;
  transparency?: number;
  metallic?: number;
  roughness?: number;
}

export interface Dimension {
  value: number;
  unit: 'm' | 'cm' | 'mm' | 'ft' | 'in';
}

export interface BoundingBox {
  width: number;
  height: number;
  depth: number;
}

export interface MeasurementReport {
  area: number;
  volume: number;
  perimeter?: number;
}

export interface RenderSettings {
  sunlight: boolean;
  shadows: boolean;
  pbr: boolean;
}
