import { LibraryItem } from '../types'

export const mockFurniture: LibraryItem[] = [
  // Living Room
  {
    id: 'sofa-01',
    title: 'Modern Sofa',
    category: 'Living Room',
    modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/SheenChair/glTF-Binary/SheenChair.glb',
    imageUrl: 'https://placehold.co/100x100?text=Sofa'
  },
  {
    id: 'coffee-table-01',
    title: 'Wooden Table',
    category: 'Living Room',
    modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb',
    imageUrl: 'https://placehold.co/100x100?text=Table'
  },
  // Bedroom
  {
    id: 'bed-01',
    title: 'King Size Bed',
    category: 'Bedroom',
    modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Corset/glTF-Binary/Corset.glb',
    imageUrl: 'https://placehold.co/100x100?text=Bed'
  },
  {
    id: 'lamp-01',
    title: 'Bedside Lamp',
    category: 'Bedroom',
    modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/AntiqueCamera/glTF-Binary/AntiqueCamera.glb',
    imageUrl: 'https://placehold.co/100x100?text=Lamp'
  },
  // Kitchen
  {
    id: 'dining-chair-01',
    title: 'Dining Chair',
    category: 'Kitchen',
    modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb',
    imageUrl: 'https://placehold.co/100x100?text=Chair'
  }
]

export const furnitureCategories = ['Living Room', 'Bedroom', 'Kitchen', 'Office', 'Bathroom']
