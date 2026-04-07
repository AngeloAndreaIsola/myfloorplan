# Architecture - My Floorplan

My Floorplan is a professional-grade architectural design tool built for high-performance 2D/3D synchronization.

## System Overview

### Frontend (myfloorplan-web)
- **Core Framework**: React 18 + Vite.
- **State Management**: Zustand. A single source of truth (`useEditorStore`) manages wall segments, room polygons, and furniture items.
- **2D Engine**: Konva (Canvas API). Handles technical drawing, snapping, and layout design.
- **3D Engine**: Babylon.js. Provides a cinematic rendering viewport with real-time soft shadows and CSG-based wall cutting.
- **Styling**: Tailwind CSS + DaisyUI.

### Asset Management (myfloorplan-assetcenter)
- React-based dashboard for managing 3D models (GLTF/GLB) and textures stored in Cloudflare R2.

### Backend (Planned)
- **API**: Hono (TypeScript). Optimized for Cloudflare Workers.
- **Database**: D1 (Relational) for project metadata.
- **Storage**: R2 for blob storage of assets.

## Key Technical Patterns

### 2D/3D Synchronization
The application uses a **Reactive Sync Pattern**. When a user modifies a wall in the 2D canvas, the Zustand store updates. The 3D viewer observes these changes via a `useEffect` hook and reconstructs the affected meshes in real-time.

### Boolean Geometry (CSG)
To create windows and doors, we use **Constructive Solid Geometry**. This physically subtracts volumes from the wall meshes, allowing light to pass through and shadows to be cast properly on interior floors.

### Cinematic Pipeline
The 3D viewer implements a custom rendering pipeline:
- **Directional Shadows**: Using Blur Exponential Shadow Maps (B ESM).
- **Post-Processing**: Bloom and FXAA for a premium aesthetic.
- **Materials**: Dynamic PBR (Physically Based Rendering) materials using tiled textures.
