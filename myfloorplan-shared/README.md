# @myfloorplan/shared

The core shared library containing types, schemas, and utility functions for the **MyFloorplan** ecosystem.

## Overview

This package acts as the single source of truth for data structures used across both the frontend applications and backend API workers. It is built using [tsup](https://github.com/egoist/tsup) to output both CommonJS (CJS) and ES Module (ESM) formats, along with TypeScript declaration files (`.d.ts`).

## Architecture & Exports

The library is organized by domain in `src/types/`:

- **[architecture.ts](src/types/architecture.ts)**: Points, Dimensions, Walls, Rooms, Openings (Doors/Windows), and Structural Elements (Stairs/Columns).
- **[interior.ts](src/types/interior.ts)**: Furniture, Placed Items, Lighting configuration, and Wall Decorations.
- **[systems.ts](src/types/systems.ts)**: Smart home Devices, activity definitions, and controls.
- **[environment.ts](src/types/environment.ts)**: Units, actors, and other spatial entities.
- **[properties.ts](src/types/properties.ts)**: Shared asset properties, colors, textures, and custom materials.

---

## Development

All commands should be run from either this directory or using workspace filters.

### Installation
Included automatically as part of the monorepo root installation:
```bash
pnpm install
```

### Build the Library
Compile the source TypeScript files into output bundles in `dist/`:
```bash
pnpm build
```

### Watch Mode
Automatically re-compile on change during local development:
```bash
pnpm dev
```

### Linting
Verify style consistency:
```bash
pnpm lint
```
