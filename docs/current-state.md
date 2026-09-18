# Current State Audit — myfloorplan

**Date:** 2026-09-13  
**Purpose:** Assess the existing codebase before building the new bathroom configurator.

---

## 1. Repository Overview

```
myfloorplan/
├── bathroom-viewer/          # Standalone bathroom furniture tester (vanilla JS + Three.js)
├── manufacturer-assets/      # Source DWGs + converted GLBs + conversion scripts
├── myfloorplan-api/          # Cloudflare Workers API (Drizzle ORM, auth middleware)
├── myfloorplan-assetcenter/  # React + Tailwind asset management web app
├── myfloorplan-shared/       # Shared TypeScript types package
├── myfloorplan-web/          # React + Tailwind floorplan editor (2D/3D)
├── myfloorplan-mobile/       # Mobile app (React Native?)
├── my_files/                 # Raw source files (DWGs, scan, floorplan image)
└── docs/                     # Design docs, plans, progress reports
```

The repository is a monorepo-style collection of related packages. The bathroom-viewer is the most relevant existing component.

---

## 2. bathroom-viewer — Deep Dive

**Location:** `bathroom-viewer/`

### What it is
A single-file vanilla JavaScript application (index.html ~1985 lines) with a Node.js static file server. It loads a Polycam bathroom scan and lets you browse/place/test manufacturer furniture GLBs.

### Tech stack
- **Three.js:** 0.160.0 (via unpkg CDN importmap)
- **three-gltf-extensions:** 0.0.15 (in node_modules, but not used in the code)
- **Runtime:** Single HTML file with `<script type="module">`
- **Server:** Node.js http server on port 8080
- **No build step, no TypeScript, no framework**

### Features present
- **Polycam scan loading:** Loads `9_13_2026.glb`, auto-centers, auto-scales to 2.5m max dimension
- **OrbitControls:** Drag rotate, scroll zoom, right-drag pan
- **Lighting:** Ambient (0.6) + Directional with shadows (2048×2048)
- **Furniture catalog:** 127 assets from 3 manufacturers (L60: 14, VIAVENETO: 22, QUATTRO.ZERO: 91)
- **Asset loading:** GLTFLoader, loads GLBs from manufacturer-assets/processed/
- **Transform controls:** Position (mm), rotation (degrees), scale via number inputs
- **Color customization:** Per-material color picking (body, door, top, basin, faucet)
- **Inspection tools:** Wireframe toggle, bounding box, axes, ground plane
- **Selection:** Raycaster-based click selection
- **Test mode:** Filter by status (good/problems/untested/review), rate assets, save notes
- **Keyboard shortcuts:** 1-8 for status, N/P navigation, W/B/A/G/F for tools
- **Fallback:** Creates placeholder room (2.5×2×2.3m) if scan fails to load

### What it does NOT have
- No project save/load (test results are saved, not projects)
- No tile system
- No shower configurator
- No measurements
- No snapping/collision
- No surface abstraction (walls/floors)
- No orthographic camera
- No debug mode with dimensions overlay
- No unit conversion layer (uses heuristic: if <10 units → meters, else mm)
- No data-driven architecture (furniture definitions are hardcoded in JS)
- No Blender integration
- No proper disposal of geometries/materials in all paths

### Code quality observations
- Everything in one file — hard to maintain
- Furniture creation uses placeholder geometry (boxes, spheres) instead of loaded GLBs for the "existing UI" mode
- Unit detection is heuristic and fragile
- Scale factor is applied to the scan to fit a 2.5m viewport — this destroys real-world dimensions
- The scan is centered and shifted so its bottom is at y=0 — reasonable but undocumented
- No error boundaries — a single failed GLB load could leave the UI in a bad state

---

## 3. Manufacturer Asset Pipeline

**Location:** `manufacturer-assets/`

### Source files
- **L60 (MOODE):** 14 × .3ds files — all successfully converted
- **VIAVENETO:** 134 × .dwg files — ALL skipped (could not read/convert source)
- **QUATTRO.ZERO (falter):** 109 × .dwg files — ALL skipped (could not read/convert source)

### Conversion tools
- **dwg2dxf:** LibreDWG 0.14
- **assimp:** Homebrew Assimp
- **ezdxf:** Python 1.4.4
- **trimesh:** Python available

### Conversion routes
1. **3DS → Assimp → GLB** (L60 — works)
2. **DWG(3DSOLID) → dwg2dxf → Assimp → GLB**
3. **DWG(INSERT) → dwg2dxf → BLOCK resolve → Assimp → GLB**
4. **DWG(MESH) → dwg2dxf → vertex/face extract → trimesh → GLB**

### Processed GLBs (usable)
- **L60:** 14 GLBs in `manufacturer-assets/processed/L60/` — all validated, dimensions known
- **VIAVENETO:** 22 GLBs in `manufacturer-assets/processed/VIAVENETO/` — these were converted SEPARATELY (not by the main conversion script). They exist in `bathroom-viewer/furniture-glb/` too.
- **QUATTRO.ZERO:** 91 GLBs in `manufacturer-assets/processed/QUATTRO.ZERO/` — also converted separately

**Key insight:** The VIAVENETO and QUATTRO.ZERO GLBs in `processed/` were NOT produced by the conversion script that generated the report. They were converted by a different process (likely the `bathroom-viewer/furniture-glb/` pipeline or manual conversion). The report's "SKIPPED" status for these manufacturers is misleading — usable GLBs DO exist.

### Existing GLB locations
1. `manufacturer-assets/processed/{L60,VIAVENETO,QUATTRO.ZERO}/` — 127 GLBs
2. `bathroom-viewer/furniture-glb/` — overlapping set, some additional test files
3. `my_files/falter_ViaVeneto/` — raw DWGs (136 files)
4. `my_files/falter_quattro.zero/` — raw DWGs (111 files)
5. `my_files/rexa_moode/` — MOODE source files
6. `my_files/L60/` — L60 source files
7. `my_files/ViaVeneto/` — VIAVENETO source files

### Conversion reports
- `reports/conversion-report.md` — human-readable summary
- `reports/conversion-report.json` — machine-readable
- `reports/conversion_manifest.csv` — CSV manifest
- `reports/viewer-assets.json` — optimized for the viewer (127 assets with dimensions)
- `reports/furniture-test-results.json` — test ratings from the viewer
- `reports/dwg_classification.txt` / `.json` — DWG type classification

---

## 4. Polycam Scan

**Files:**
- `/Users/angeloandreaisola/.hermes/attachments/9_13_2026.glb` (5.2 MB)
|- `/Users/angeloandreaisola/Documents/GitHub/myfloorplan/my_files/bathroom_room_shell_claude2.glb` (3.6 KB — clean room shell, walls only, Claude-generated base)|

**Current handling in viewer:**
- Loaded via `GLTFLoader.loadAsync('/9_13_2026.glb')`
- Auto-centered (position subtracted by bounding box center)
- Auto-scaled: if max dimension > 5 units, scale = 2.5 / maxDim
- Bottom aligned to y=0
- Shadows enabled on all meshes

**Problem:** The auto-scale destroys real-world dimensions. If the scan is in meters and is 2.5m wide, it gets scaled to 2.5 units — but then the unit system is ambiguous. Furniture placed at "0.6" could mean 600mm or 0.6m depending on interpretation.

---

## 5. Existing GLBs in bathroom-viewer/furniture-glb/

A subset of manufacturer GLBs also exists here, plus some test files. Notable:
- L60 MOODE sinks: 6 variants (60×45×25 through 60×53×50)
- VIAVENETO bases: various configurations (1-4 drawers, 1-2 doors, H30/H45/H60)
- VIAVENETO columns: 90cm, 150cm, 180cm heights
- VIAVENETO countertops: 60-120cm widths
- QUATTRO.ZERO complete units: various widths (60-140cm), heights (25-36cm)
- QUATTRO.ZERO countertops: Cristalplant washbasin tops
- MOODE skinunits: 2-door variants (60×46×50, 60×46×80, 60×53×50, 60×53×80)

---

## 6. What Can Be Reused

### High value
- **GLB loading infrastructure:** GLTFLoader usage pattern, error handling
- **OrbitControls setup:** Camera, damping, min/max distance
- **Lighting setup:** Ambient + directional with shadows
- **Asset catalog:** `viewer-assets.json` has 127 assets with dimensions and paths
- **Manufacturer GLBs:** All 127 processed GLBs are usable
- **Conversion reports:** Documentation of what was converted and how
- **Test results:** `furniture-test-results.json` has human ratings
- **Server pattern:** Simple static file server with API endpoints
- **Color customization:** Material color replacement pattern
- **Raycaster selection:** Click-to-select pattern

### Medium value
- **UI layout concepts:** Sidebar catalog, inspector panel, toolbar — but will be rewritten in React
- **Keyboard shortcuts:** Useful interaction patterns
- **Bounding box/axes/wireframe helpers:** Debug visualization patterns

### Low value / will replace
- **Furniture placeholder geometry:** Will use real GLBs instead
- **Unit detection heuristic:** Will use explicit mm units throughout
- **Auto-scaling of scan:** Will preserve real dimensions
- **Single-file architecture:** Will use proper React + TypeScript project
- **Hardcoded furniture definitions:** Will use data-driven manifest

---

## 7. What Needs to Change

### Critical
1. **Scan must render at real scale** — no auto-scaling to fit viewport
2. **Unit system must be explicit** — millimetres everywhere, conversion isolated in one utility
3. **Architecture must be modular** — React + TypeScript, separate concerns
4. **Bathroom scan must be preserved as the spatial reference** — not replaced or manually reconstructed

### Important
5. **Tile system** — not present at all, core requirement
6. **Shower configurator** — not present at all
7. **Project save/load** — test results saved but not full project state
8. **Surface abstraction** — no wall/floor/ceiling representation
9. **Snapping/collision** — not present

### Nice to have
10. Orthographic camera for 2D top-down view
11. Measurement tool (point-to-point distance)
12. Blender asset processing pipeline
13. Proper asset validation
14. Visual debug mode with dimensions overlay

---

## 8. Blockers and Risks

### Blockers (must resolve)
- **Scan unit ambiguity:** The Polycam GLB's units are not explicitly documented. Need to inspect the GLB metadata to determine if it's in meters or millimetres.
- **Coordinate system:** Need to determine the scan's orientation (which way is up, where is origin) and establish a consistent convention.

### Risks
- **Auto-scaled scan dimensions are lost:** The current viewer scales the scan, so any measurements taken from it are wrong. The new app must NOT do this.
- **Manufacturer GLB scale inconsistency:** Different manufacturers may use different unit conventions. The manifest has dimensions but we need to verify they match the actual GLB content.
- **VIAVENETO DWGs couldn't be converted by the automated pipeline:** The GLBs that exist were converted by a different method. If we need more VIAVENETO assets, we may need to fix the DWG conversion.

---

## 9. Recommendations for New Architecture

1. **Use Vite + React + TypeScript + Three.js** — modern, fast dev server, type safety
2. **Isolate unit conversion** in a single `units.ts` module (mm ↔ Three.js internal units)
3. **Load scan at 1:1 real scale** — no automatic scaling
4. **Use the existing `viewer-assets.json`** as the starting point for the furniture manifest, but augment with validation
5. **Preserve the clean room shell** as `bathroom_room_shell_claude2.glb`, the walls-only base for furniture layout|
6. **Build surface abstraction from the start** — even if surfaces are initially derived from the scan bounding box
7. **Make the scene graph data-driven** — project JSON drives what's in the scene
8. **Add Blender scripts for asset processing** — deterministic, reproducible
9. **Create proper dev tooling** — validate-assets script, smoke test page
