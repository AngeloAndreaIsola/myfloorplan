# HOWTO - My Floorplan

This guide explains how to use the editor and manage the development environment.

## User Guide

### Drawing Walls
1. Select the **Wall** tool from the sidebar.
2. Click and drag on the canvas to draw segments.
3. Walls automatically snap to the 20px grid.

### Creating Rooms (Floors)
1. Select the **Room** tool.
2. Click at each corner of the room to form a polygon.
3. Click back on the first point to close the shape and generate the floor.

### Adding Windows & Doors
1. Select the **Window** or **Door** tool.
2. Click directly on an existing **Wall** segment.
3. The opening will be physically cut into the 3D wall.

### Styling Elements
1. Select the **Select** tool.
2. Click on a wall or floor.
3. Use the **Properties Panel** in the sidebar to change colors or apply textures (Wood, Tile, etc.).

## Developer Guide

### Prerequisites
- Node.js + `pnpm`
- `babylonjs`, `babylonjs-loaders`, `konva`, `zustand`

### Running Locally
1. Navigate to the web folder: `cd myfloorplan-web`
2. Install dependencies: `pnpm install`
3. Start dev server: `pnpm dev`

### Adding New Tools
1. Add the tool name to `DrawTool` type in `useEditorStore.ts`.
2. Update `DrawPanel.tsx` to include the new button.
3. Implement the logic in `Floorplan2DView.tsx` (mouse handlers) and `Floorplan3DView.tsx` (mesh sync).
