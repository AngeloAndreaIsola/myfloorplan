# Coordinate System — Bathroom Configurator

## Overview

All spatial values in the application use **millimetres (mm)** as the unit. This is a deliberate architectural choice to eliminate the scale ambiguity that existed in the previous viewer (which used heuristics to guess whether GLBs were in meters or millimeters).

## Internal Representation

**1 Three.js unit = 1 millimetre.**

Three.js does not have a concept of physical units — it operates on raw numbers. By convention throughout this codebase:

- All position, rotation, and scale values are in mm
- All dimension properties (width, depth, height) are in mm
- Camera distances are in mm (5000 = 5 meters)
- Grid size is in mm

## Conversion Layer

Unit conversions are isolated in `src/utils/units.ts`. **Do not scatter scale factors throughout the code.** Always go through the conversion utilities.

```typescript
// mm ↔ Three.js units (1:1, but explicit for clarity)
mmToUnit(mm: number): number    // identity
unitToMm(unit: number): number  // identity

// m ↔ mm (for loading scans that are in meters)
mToMm(m: number): number        // × 1000
mmToM(mm: number): number       // ÷ 1000
```

## Coordinate Axes

```
        Y+
        │
        │   ceiling
        │
        ├─── X+
       /
      /
     Z+
```

- **Y+** = UP (ceiling direction)
- **X+** = RIGHT
- **Z+** = FORWARD (into the room from the entrance)

This matches Three.js's default Y-up coordinate system and is the standard convention for architectural/room modeling.

## Rotation Convention

- Euler angles in **degrees** (not radians) for user-facing APIs
- Internal Three.js representation uses **radians**
- Rotation order: **YXZ** (yaw → pitch → roll)
  - Y rotation = heading/yaw (which way the object faces)
  - X rotation = tilt/pitch (forward/back lean)
  - Z rotation = roll (side tilt)

Conversion utilities:
```typescript
eulerToThree(xDeg, yDeg, zDeg): THREE.Euler  // degrees → radians, YXZ order
threeToEuler(euler): { x, y, z }             // radians → degrees
```

## Origin and Alignment

### Bathroom Scan

When loaded, the Polycam scan is:
1. Scaled ×1000 (meters → mm)
2. Centered at world origin (X=0, Z=0)
3. Aligned so the floor mesh is at Y=0

This means:
- The floor is at Y = 0
- Room center is at X = 0, Z = 0
- Walls extend outward in ±X and ±Z from center
- Ceiling is at Y = room height

### Furniture Placement

Furniture GLBs are loaded and aligned so:
- The bottom of the object (minimum Y of bounding box) sits at Y = 0 (floor)
- The object's center is at X = 0, Z = 0 initially
- User moves it from there

This ensures a cabinet's legs (or base) rest on the floor, a sink's basin is at the correct height, etc.

## Scan Metadata

From inspection of `bathroom_scan.glb` (Polycam, 2026-09-13):

| Property | Value |
|----------|-------|
| Format | GLB 2.0 |
| Units (stored) | Meters (Polycam default) |
| Width (X) | 3,587 mm |
| Height (Y) | 2,730 mm |
| Depth (Z) | 3,610 mm |
| Max dimension | 3,610 mm (~3.61 m) |
| Triangles | ~0 (single mesh, 80 vertices) |
| Vertices | 80 |
| Meshes | 1 (walls, no materials/textures) |
| Materials | 0 |
| Origin offset | Scan origin is NOT at room center |

### Scan Origin Note

The scan's internal origin (0,0,0 in the GLB) is NOT at the center of the bathroom. The bounding box is:

|- X: -1.555 to +2.032 m → centered at X ≈ +0.239 m|
|- Y: -1.277 to +1.453 m → floor is at Y ≈ -1.277 m, ceiling at Y ≈ +1.453 m|
|- Z: -1.556 to +2.054 m → centered at Z ≈ +0.249 m|

After centering and floor-alignment in the app, the shell is repositioned so that:
- Room center is at (0, 0, 0) in XZ
- Floor is at Y = 0
- This is the reference frame for all furniture placement

## Floor Plane

The floor is defined as the Y = 0 plane. This is where:
- Furniture sits
- Tiles are placed (on floors)
- The scan's bottom is aligned

This is a convention, not derived from the scan's internal coordinates. We determine "where the floor is" by finding the minimum Y of the scan's bounding box after centering, then shifting so that minimum is at Y = 0.

## Wall Conventions

Walls are vertical planes. Their normals point outward from the room:

| Wall | Normal direction | Tangent direction |
|------|------------------|-------------------|
| North | (0, 0, -1) | (1, 0, 0) |
| South | (0, 0, +1) | (1, 0, 0) |
| East | (+1, 0, 0) | (0, 0, 1) |
| West | (-1, 0, 0) | (0, 0, 1) |

In the bathroom:
- **North wall** = back wall (typically where the shower is)
- **South wall** = entrance wall
- **East/West walls** = side walls

These are approximate — the actual bathroom may be oriented differently. The scan orientation tells us which way is which.

## Surface Representation

Each surface (wall, floor, ceiling) is represented by:

```typescript
interface Surface {
  id: string;
  type: 'wall' | 'floor' | 'ceiling';
  normal: Vector3;      // Unit vector pointing outward
  position: Vector3;    // Point on the surface (typically center)
  widthMm: number;      // Extent along tangent X
  heightMm: number;     // Extent along Y (0 for floor/ceiling conceptually)
  depthMm: number;      // Extent along tangent Z (or thickness for floor)
  transform: Matrix4;   // Full transform matrix
}
```

Surfaces are initially derived from the scan bounding box:
- Floor: Y = 0, size = (scanWidth, scanDepth)
- North wall: Z = -scanDepth/2, size = (scanWidth, scanHeight)
- South wall: Z = +scanDepth/2, size = (scanWidth, scanHeight)
- East wall: X = +scanWidth/2, size = (scanDepth, scanHeight)
- West wall: X = -scanWidth/2, size = (scanDepth, scanHeight)

These are starting approximations. The user can adjust surface positions/sizes to match the actual bathroom.

## Why Not Use Meters?

Three.js examples and many tutorials use meters (1 unit = 1 meter) because it gives convenient camera distances (5-20 units for room-scale scenes). However:

1. **Manufacturer catalogs use mm:** L60, VIAVENETO, and QUATTRO.ZERO all specify dimensions in mm (e.g. "600×460×500")
2. **The scan is in meters,** requiring a ×1000 conversion regardless
3. **User input is in mm:** When placing a 600mm cabinet, the user thinks in mm

Using mm internally means:
- No conversion when reading manufacturer specs
- Explicit conversion only when loading meter-scale GLBs (scan, some furniture)
- User sees mm everywhere in the UI
- No ambiguity about "is this 0.6 or 600?"

The tradeoff is that camera distances are larger numbers (5000 instead of 5), but this is easily handled by the camera setup and is irrelevant to the user.
