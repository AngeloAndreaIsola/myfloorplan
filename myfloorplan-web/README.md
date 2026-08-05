# MyFloorplan Web Application

The flagship web-based interactive 2D/3D floorplan designer for the **MyFloorplan** ecosystem.

## Key Features

- **2D Drawing Canvas**: Powered by **Konva**, supporting precise grid snaps, wall selections, segment additions, room boundary polygon calculation, and doors/windows placements.
- **3D Real-time Viewer**: Powered by **Babylon.js**, rendering volumetric walls (using CSG Boolean subtractions for openings), physically-based lighting, soft shadow maps, and interactive camera walkthroughs.
- **Project Persistence**: Synced with the Hono REST API for loading, saving, and managing multi-floor layouts.
- **Dynamic Asset Library**: Seamless catalog browser containing categorized furniture models and textures.

## Project Structure

- **`src/components/editor/`**:
  - `Floorplan2DView.tsx`: The technical 2D drafting floorplan editor canvas using HTML5 canvas.
  - `Floorplan3DView.tsx`: The BabylonJS 3D rendering stage with dynamic light & CSG calculations.
- **`src/components/layout/`**:
  - Layout wrappers, `Header.tsx`, side panels, and the `PropertiesPanel.tsx` for updating dimensions/colors of selected elements.
- **`src/store/`**:
  - `useEditorStore.ts`: Global Zustand state management representing the single source of truth (`wallLines`, `rooms`, `placedItems`, `floors`).
  - `useAuthStore.ts`: Simple login token management.

---

## Coding Guidelines

### UI Styles
We use **TailwindCSS** coupled with **DaisyUI** for interface elements. Always refer to the design tokens.

### Icon Imports
When importing from `lucide-react`, follow the workspace rule:
> [!IMPORTANT]
> All Lucide React icon imports must use the `Icon` prefix to differentiate them from standard React component definitions.
> Example:
> ```typescript
> import { Plus as PlusIcon, Settings as SettingsIcon } from 'lucide-react';
> ```

### 2D/3D State Sync
Avoid updating BabylonJS meshes or Konva shapes directly. Always commit changes to `useEditorStore` (Zustand), allowing the reactive sync engine in `Floorplan3DView` to handle mesh reconstruction via listeners.

---

## Development Setup

### Install Dependencies
Ensure you run from the monorepo root:
```bash
pnpm install
```

### Dev Server
Starts the Vite server (typically at `http://localhost:5173`):
```bash
pnpm dev
```

### Build Production Bundle
Generates production assets in `dist/`:
```bash
pnpm build
```
