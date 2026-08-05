import { v4 as uuidv4 } from 'uuid';
import { WallLine, Room, PlacedItem, WallOpening } from '../types';

export const generateDemoHouse = () => {
  const wallLines: WallLine[] = [];
  const rooms: Room[] = [];
  const placedItems: PlacedItem[] = [];

  const t = 12; // Wall thickness

  // Helper to create walls
  const addWall = (x1: number, y1: number, x2: number, y2: number, openings: WallOpening[] = []) => {
    wallLines.push({
      id: uuidv4(),
      points: [x1, y1, x2, y2],
      thickness: t,
      openings
    });
  };

  // Outer Walls (0,0 to 700,700)
  addWall(0, 0, 700, 0, [
    { id: uuidv4(), type: 'Window', offset: 0.3, width: 100 }, // Living window
    { id: uuidv4(), type: 'Window', offset: 0.8, width: 80 }   // Kitchen window
  ]);
  addWall(700, 0, 700, 700, [
    { id: uuidv4(), type: 'Window', offset: 0.8, width: 60 } // Bath window
  ]);
  addWall(700, 700, 0, 700, [
    { id: uuidv4(), type: 'Window', offset: 0.3, width: 100 } // Bed window
  ]);
  addWall(0, 700, 0, 0, [
    { id: uuidv4(), type: 'Door', offset: 0.2, width: 90, styleId: 'single' } // Front door
  ]);

  // Inner Walls
  // Horizontal split at y=400
  addWall(0, 400, 700, 400, [
    { id: uuidv4(), type: 'Door', offset: 0.2, width: 80 }, // Living to Bed
    { id: uuidv4(), type: 'Door', offset: 0.8, width: 80 }  // Kitchen to Bath
  ]);
  // Vertical split at x=400 (Top half)
  addWall(400, 0, 400, 400, [
    { id: uuidv4(), type: 'Door', offset: 0.5, width: 120, styleId: 'double-door' } // Living to Kitchen
  ]);
  // Vertical split at x=400 (Bottom half)
  addWall(400, 400, 400, 700, [
    { id: uuidv4(), type: 'Door', offset: 0.5, width: 80 } // Bed to Bath
  ]);

  // Rooms
  rooms.push({
    id: uuidv4(),
    name: 'Living Room',
    points: [0, 0, 400, 0, 400, 400, 0, 400],
    color: '#E0E7FF'
  });
  rooms.push({
    id: uuidv4(),
    name: 'Kitchen',
    points: [400, 0, 700, 0, 700, 400, 400, 400],
    color: '#FEF3C7'
  });
  rooms.push({
    id: uuidv4(),
    name: 'Bedroom',
    points: [0, 400, 400, 400, 400, 700, 0, 700],
    color: '#FCE7F3'
  });
  rooms.push({
    id: uuidv4(),
    name: 'Bathroom',
    points: [400, 400, 700, 400, 700, 700, 400, 700],
    color: '#E0F2FE'
  });

  // Placed Items (Furniture & Lights)
  // Living Room Sofa
  placedItems.push({
    id: uuidv4(),
    type: 'Sofa',
    category: 'Seating',
    position: { x: 200, y: 0, z: 200 },
    rotation: 0,
    scale: { x: 1, y: 1 },
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&q=80',
    modelUrl: ''
  });
  // Living Room Light
  placedItems.push({
    id: uuidv4(),
    type: 'Ceiling Light',
    category: 'Lighting',
    position: { x: 200, y: 0, z: 200 },
    rotation: 0,
    scale: { x: 1, y: 1 },
    lightType: 'point',
    lightColor: '#FFEDD5',
    intensity: 1.5,
    range: 400,
    imageUrl: '',
    modelUrl: ''
  } as any);

  // Kitchen Island
  placedItems.push({
    id: uuidv4(),
    type: 'Kitchen Island',
    category: 'Tables',
    position: { x: 550, y: 0, z: 200 },
    rotation: 90,
    scale: { x: 1, y: 1 },
    imageUrl: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=500&q=80',
    modelUrl: ''
  });

  // Bed
  placedItems.push({
    id: uuidv4(),
    type: 'Double Bed',
    category: 'Beds',
    position: { x: 200, y: 0, z: 550 },
    rotation: 180,
    scale: { x: 1, y: 1 },
    imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=500&q=80',
    modelUrl: ''
  });

  // Bathroom Tub
  placedItems.push({
    id: uuidv4(),
    type: 'Bathtub',
    category: 'Bathroom',
    position: { x: 600, y: 0, z: 500 },
    rotation: 90,
    scale: { x: 1, y: 1 },
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&q=80',
    modelUrl: ''
  });

  return { wallLines, rooms, placedItems };
};
