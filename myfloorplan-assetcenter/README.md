# MyFloorplan Asset Center

The asset catalog viewer, metadata tags manager, and automated 3D model processing pipeline for the **MyFloorplan** ecosystem.

## Overview

Asset Center is a React application built with **React Three Fiber (R3F)**, **Three.js**, TailwindCSS, and DaisyUI. It enables operators to view uploaded 3D assets, organize them by category, tag models, and control automated crawlers that ingest models from open-source repositories.

## Sub-Project Layout

- **`src/`**:
  - React components for browsing, sorting, and previewing `.gltf` and `.glb` models in a web-based WebGL viewport.
- **`tools/crawlers/`**:
  - Scrapers targeting various free 3D model repositories:
    - `cadnav/`: Scrapers extracting files from CADNav.
    - `archived3d/`: Crawlers pulling blueprints/meshes from Archive3D.
    - `sweethome3d/`: Integrations for SweetHome3D assets.
- **`tools/scripts/`**:
  - Seeding and schema population utilities:
    - `populate-items.ts`: TypeScript script mapping assets into the D1 schema database.
    - `populate-local.js`: Script to set up local database values.

---

## Technical Stack

- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS + DaisyUI
- **3D Previewer**: React Three Fiber (`@react-three/fiber`), `@react-three/drei`, Three.js
- **Workspace Modules**: `@myfloorplan/shared` types
- **Scraper Helpers**: `cheerio`, `axios`

---

## Development Setup

### Local Client Dev Server
Starts the catalog management application:
```bash
pnpm dev
```

### Seeding Assets Database
To seed local SQL tables with default furniture items:
```bash
# Run database population script from assetcenter directory
npx tsx tools/scripts/populate-items.ts
```

### Building Application
```bash
pnpm build
```
