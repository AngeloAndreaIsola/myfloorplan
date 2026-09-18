# Bathroom Configurator — Architecture

## Purpose

A dimensionally accurate bathroom renovation configurator for planning real bathroom layouts using a Polycam 3D scan as the spatial reference.

## Core Principles

1. **Real-world accuracy:** Everything is in millimetres. The Polycam scan is the source of truth for the existing bathroom geometry — never manually reconstructed.
2. **Data-driven:** Furniture, tiles, showers are defined in JSON manifests, not hardcoded.
3. **Modular:** The architecture supports adding a backend later without rewriting the frontend.
4. **GLB as the runtime contract:** Three.js loads GLB files. Blender processes assets into GLB.
5. **Blender is an authoring tool, not the runtime:** Asset preparation happens in Blender; the user-facing app is React + Three.js.

## Tech Stack

- **Framework:** React 18 + TypeScript
- **3D Engine:** Three.js (stable, via CDN/npm)
- **Build Tool:** Vite
- **Asset Format:** GLB (glTF Binary 2.0)
- **Unit System:** Millimetres (internal), with conversion isolated in `utils/units.ts`
- **Project Storage:** JSON files (no database initially)
- **Asset Pipeline:** Blender scripts → validated GLB → manifest

## Application Architecture

```
bathroom-configurator/
├── app/                          # React application
│   ├── src/
│   │   ├── components/           # React UI components
│   │   ├── scene/                # Three.js scene management
│   │   ├── assets/               # Asset metadata, scan info
│   │   ├── bathroom/             # Bathroom scan + surfaces
│   │   ├── furniture/            # Furniture catalog + placement
│   │   ├── shower/               # Parametric shower system
│   │   ├── tiles/                # Tile generation engine
│   │   ├── measurements/         # Measurement tools
│   │   ├── interaction/          # Selection, transforms, snapping
│   │   ├── materials/            # Material/color management
│   │   ├── project/              # Save/load, project schema
│   │   ├── state/                # Application state
│   │   └── utils/                # Unit conversion, math helpers
│   ├── public/
│   │   └── scan/                 # Bathroom scan GLB(s)
│   └── package.json
│
├── blender/                      # Blender asset pipeline
│   ├── scripts/                  # Python scripts for Blender
│   └── scenes/                   # Blender starter scenes
│
├── assets/                       # Runtime assets
│   ├── scan/
│   │   ├── original/             # Untouched Polycam scan
│   │   └── optimized/            # Derived runtime versions
│   ├── manufacturer/
│   │   ├── raw/                  # Original manufacturer files
│   │   └── processed/            # Validated GLBs
│   ├── tiles/                    # Tile textures/materials
│   └── shower/                   # Shower component assets
│
├── data/                         # JSON data files
│   ├── furniture.json            # Furniture manifest
│   ├── tiles.json                # Tile definitions
│   ├── shower.json               # Shower configurations
│   └── project-schema.json       # Project file schema
│
├── docs/                         # Documentation
├── scripts/                      # Build/validation scripts
└── tests/                        # Automated tests
```

## Scene Graph

```
Scene
├── BathroomScan (Polycam GLB, at real scale)
├── FloorReference (derived from scan bounding box)
├── WallReferences (detected or manual)
├── ConfiguredFurniture (placed GLBs)
├── ConfiguredTiles (generated tile meshes)
├── ConfiguredShower (procedural or GLB)
├── Measurements (point-to-point annotations)
├── SelectionIndicator (highlight overlay)
└── DebugHelpers (axes, grid, bounding boxes, dimensions)
```

## Unit System

**Internal unit:** 1 Three.js unit = 1 millimetre.

This is a deliberate choice. Three.js doesn't care about units — it's just numbers. By adopting mm consistently:
- Furniture dimensions from manufacturer specs (e.g. 600 × 460 × 500) map directly to scene units.
- The Polycam scan (stored in meters) is scaled ×1000 on load.
- All transform inputs/outputs are in mm.
- No scattered scale conversions throughout the code.

The conversion layer is isolated in `utils/units.ts`:
```typescript
// mm ↔ Three.js units (identity — 1:1)
mmToUnit(mm) → mm
unitToMm(unit) → unit

// m ↔ mm (for scan loading)
mToMm(m) → m * 1000
mmToM(mm) → mm / 1000
```

## Coordinate System

- **Y-up** (Three.js default, matches room convention: up = ceiling)
- **Origin:** Center of the bathroom floor (derived from scan, adjusted so floor is at Y=0)
- **X+** = right, **Z+** = forward (into room)
- Rotation: Euler angles in degrees, YXZ order (yaw → pitch → roll)

## Bathroom Scan Handling

The clean room shell (`bathroom_room_shell_claude2.glb`) is:
1. Loaded via `GLTFLoader`
2. Scaled ×1000 (meters → mm)
3. Centered at origin
4. Aligned so the floor is at Y=0
5. Never modified or reconstructed

| **Source:** Claude-generated simplified room shell|

The clean room shell provides:
- The actual bathroom dimensions
- Visual reference for furniture placement
- Surface detection hints (bounding box → floor/wall planes)

### Scan Metadata

From inspection of `bathroom_room_shell_claude2.glb`:
- **Format:** GLB 2.0
- **Units:** Meters (no explicit metadata, assumed meters)
- **Dimensions:** 3,587 × 2,730 × 3,610 mm (W × H × D)
- **Triangles:** ~0 (single mesh, 80 vertices)
- **Meshes:** 1 (walls, no materials or textures)
- **Vertices:** 80
- **Source:** Claude-generated simplified room shell

## Surface Abstraction

Surfaces are represented as planar regions that tiles and objects can be placed against:

```typescript
interface Surface {
  id: string;
  type: 'wall' | 'floor' | 'ceiling';
  normal: Vector3;     // Outward normal
  position: Vector3;   // Center point
  widthMm: number;
  heightMm: number;
  depthMm: number;     // 0 for ideal planes
  transform: Matrix4;
  material?: MaterialRef;
  tileConfig?: TileConfig;
}
```

Initially, surfaces are derived from the scan bounding box. Later, they can be manually adjusted or automatically detected from the scan mesh.

## Tile System (Design)

Tiles are NOT applied as a single texture to the whole scan. Instead:

1. A surface is selected (wall or floor)
2. A tile configuration is applied to that surface
3. Individual tile meshes are generated and placed

```typescript
interface TileConfig {
  tileWidthMm: number;      // e.g. 600
  tileHeightMm: number;     // e.g. 600
  groutWidthMm: number;     // e.g. 2
  rotationDeg: number;      // 0, 90, etc.
  offsetMm: number;         // Brick pattern offset
  pattern: 'grid' | 'brick' | 'horizontal' | 'vertical';
  material: MaterialRef;
  groutMaterial: MaterialRef;
}
```

The tile generator computes how many tiles fit along each dimension of the surface and creates meshes for each tile + grout gap.

## Shower System (Design)

The shower is parametric, not a single GLB:

```
Shower (group)
├── Tray (BoxGeometry, width × depth × thickness)
├── Glass (PlaneGeometry, with frame edges)
│   ├── FixedPanels[]
│   └── Door (rotatable on hinge)
├── Frame (EdgesGeometry or thin boxes)
├── Column (CylinderGeometry)
├── Controls (small mesh)
└── Drain (small disc)
```

Parameters:
```typescript
interface ShowerConfig {
  widthMm: number;          // 800-1500
  depthMm: number;          // 800-1000
  heightMm: number;         // 2000-2400
  trayThicknessMm: number;  // 40-80
  glassThicknessMm: number; // 6-10
  doorWidthMm: number;
  doorOrientation: 'left' | 'right' | 'none';
  fixedPanels: 'none' | 'back' | 'side';
  frameMaterial: MaterialRef;
  glassMaterial: MaterialRef;
}
```

## Furniture Placement

Furniture is placed from the catalog (data-driven from `furniture.json`):

1. User selects an asset from the catalog
2. GLB is loaded at real scale (mm)
3. Asset is centered and floor-aligned
4. User positions it via:
   - Drag (with snapping)
   - Numerical transform inputs
   - Preset positions
5. Selection, transform, duplicate, delete are all supported

## Snapping and Collision (Design)

A geometric (not physics-based) system:

- **Floor snapping:** Objects snap to Y=0 (or surface height)
- **Wall snapping:** Objects align to wall planes
- **Overlap detection:** AABB or OBB intersection tests
- **Minimum clearance:** Configurable gap around objects
- **Boundary enforcement:** Objects can't be placed outside the room

## Project Format

```json
{
  "version": 1,
  "name": "Bathroom Renovation",
  "bathroom": {
    "scan": "bathroom_room_shell_claude2.glb",
    "scanScale": 1000,
    "floorY": 0
  },
  "camera": {
    "position": [x, y, z],
    "target": [x, y, z],
    "fov": 50,
    "mode": "perspective"
  },
  "objects": [
    {
      "id": "obj_001",
      "assetId": "sink_60x46x50",
      "position": { "x": 0, "y": 0, "z": -800 },
      "rotation": { "x": 0, "y": 0, "z": 0 },
      "scale": { "x": 1, "y": 1, "z": 1 },
      "materials": {}
    }
  ],
  "surfaces": [],
  "tiles": [],
  "showers": [],
  "measurements": [],
  "metadata": {
    "created": "2026-09-13T...",
    "author": "..."
  }
}
```

## Asset Pipeline

```
Manufacturer Source (3DS/DWG)
  ↓
Conversion Script (dwg2dxf/assimp/trimesh)
  ↓
Raw GLB
  ↓
Blender Processing (optional)
  - orientation correction
  - scale verification
  - origin/pivot adjustment
  - mesh cleanup
  - material cleanup
  ↓
Validated Runtime GLB
  ↓
Asset Manifest Entry (data/furniture.json)
  ↓
Catalog in Application
```

## Why This Architecture?

- **React + Three.js** gives us declarative UI for the catalog/inspector while keeping the 3D scene performant
- **mm units** eliminate the scale ambiguity that plagued the old viewer
- **GLB as contract** means Blender and the runtime speak the same format
- **Data-driven manifests** mean adding new furniture doesn't require code changes
- **Modular directories** mean we can add a backend (API, database) without restructuring
- **The scan is preserved** as the spatial reference — we never guess at room dimensions
