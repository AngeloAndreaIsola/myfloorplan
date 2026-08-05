# MyFloorplan Renderer

The core rendering engine for the **MyFloorplan** ecosystem.

## Overview

The Renderer is a Babylon.js package that exposes modules to construct 3D scenes from standard JSON floorplan layout objects. It supports interactive real-time canvas binding for client applications (like `myfloorplan-web`), as well as offscreen canvas rendering for headless rendering workers.

## Key Capabilities

- **CSG Boolean Geometry**: Processes wall openings (doors, windows, arches) by subtracting shapes from solid wall meshes. This allows shadows and point lights to pass through openings accurately.
- **PBR (Physically Based Rendering)**: Dynamically binds tiled normal maps, roughness configurations, and metallic textures to floor/wall meshes.
- **Shadow Mapping**: Implement Blur Exponential Shadow Maps (B ESM) to render realistic soft shadows from sunlight or indoor ceiling spots.
- **Headless Pipeline**: Modularized scene constructors that can run inside a Node worker context (using `JSDOM` or `headless-gl`) or Puppeteer to generate high-resolution snapshots and walkthrough videos of the floorplans.

---

## Development

Run development stage:
```bash
pnpm dev
```

Build production library:
```bash
pnpm build
```
