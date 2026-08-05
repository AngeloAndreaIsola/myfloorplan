# Editor UX and Advanced Features

This document details the intended user experience, UI components, and architectural logic for the advanced features of the MyFloorplan Editor.

## 1. Sophisticated UI/UX Layout

The editor targets a premium, architectural-grade interface.
- **Glassmorphism**: Panels utilize a slightly transparent `bg-base-200/80` with a backdrop blur for depth over the canvas.
- **Component Menus**: The sidebar employs a tabbed or accordion approach to strictly categorize `Structural Elements` (Stairs, Columns, Walls), `Openings` (Doors, Windows), and `Interior Decor` (Furniture, Lighting, Plants).
- **Properties Inspector**: Contextual panel that responds specifically to the currently selected node (Wall, Room, Item) providing sliders and visual grids rather than standard dropdowns.

## 2. Advanced Tool Implementation

### 2.1 Materials & Wallpapers
Walls and Rooms now support complex texturing.
- **Color Chooser**: A custom hex palette or standard color picker.
- **Texture/Wallpaper Grid**: A visually scrollable grid in the properties panel loading thumbnails of textures. When applied, the 3D renderer dynamically calculates the UV scaling based on the wall's mathematical length, ensuring textures like bricks or wallpaper patterns do not stretch, but tile correctly.

### 2.2 Structural Styles & Openings
Doors, Windows, Stairs, and Columns support structural "Styles".
- **CSG Operations**: When a window or door is placed on a wall, Constructive Solid Geometry is applied in BabylonJS. A temporary box representing the dimensions of the opening is mathematically subtracted from the wall's mesh.
- **Variations**: A `styleId` dictates what visual mesh is inserted into the hole (e.g., a "French Door" vs. a "Modern Sliding Glass").

### 2.3 Snapping & Decor Placement
- **Proximity Logic**: In 2D, dragging a recognized "Wall Opening" (Door/Window) or "Wall Snapped Decor" (Painting, Sconce) will trigger a proximity check. If within 20px of a wall line, the object automatically translates to lie perfectly on the line.
- **Rotational Alignment**: Upon snapping, the rotation of the object is locked to the perpendicular normal of the wall, ensuring the door or painting faces the correct interior direction.
- **Light Emitting Objects**: Items tagged as `Light` in their category automatically instantiate a Babylon PointLight at their coordinate in 3D mode, casting realistic shadows if render settings allow.
