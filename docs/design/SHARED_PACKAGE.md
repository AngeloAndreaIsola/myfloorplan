# @myfloorplan/shared — Usage & Extension Guide

**Package**: `myfloorplan-shared`
**Version**: 0.1.0
**Purpose**: Single source of truth for the data contracts shared across MyFloorplan apps — and reusable by sibling projects (e.g. MyEstate).
**Related**: [API Specification](API_SPEC.md) · [Data Format Specification](DATA_FORMAT.md)

## 1. What the Package Provides

- Domain types: `architecture`, `interior`, `systems`, `environment`, `properties`.
- Aggregate documents: `FloorplanData`, `Floor`, `Project`.
- Asset pipeline contracts: `Asset`, `AssetSource`, `AssetJob`, `FloorplanItem`, `FloorplanItemGroup`.
- Dual CJS/ESM bundles plus TypeScript declarations in `dist/` (built with tsup).

## 2. Consuming the Package

### Inside the monorepo (pnpm workspace)

```json
{
  "dependencies": {
    "@myfloorplan/shared": "workspace:*"
  }
}
```

### From another project (e.g. MyEstate)

**Option A — local path** (fast, no publish):

```json
{
  "dependencies": {
    "@myfloorplan/shared": "file:../../SGM/SGAPP/Floorplan/Sources/myfloorplan/myfloorplan-shared"
  }
}
```

**Option B — private registry**: publish and reference a semver range.

Consumption:

```ts
import { FloorplanData, Wall, Asset, Floor, Device, Actor } from '@myfloorplan/shared';
```

## 3. Reuse Map for Other Projects (MyEstate example)

| MyEstate need | Shared contract |
|---|---|
| Property floor plans (rooms, walls, furniture) | `FloorplanData`, `Floor`, `Project` |
| IoT device tracking inside properties | `Device`, `Unit` (`systems`/`environment`) |
| Robot/agent presence and movement | `Actor`, `Creature`, `Activity` |
| Asset media and crawl pipelines | `Asset`, `AssetSource`, `AssetJob` |
| Material and visual properties | `Material`, `RenderSettings` (`properties`) |

MyEstate-specific concepts (listings, bookings, visitors, incidents, reviews) stay in `@mes/core`; shared spatial and IoT contracts come from `@myfloorplan/shared`.

## 4. Extension Guide

1. Add new types in `src/types/<domain>.ts` (or a new file).
2. Re-export from `src/types/index.ts` — keep the package dependency-free (types only).
3. Build: `pnpm build` (tsup emits CJS/ESM/`.d.ts` into `dist/`).
4. Version & changelog: bump `package.json` (semver). Breaking shape changes require a major bump, and the API/data-format specs must be updated in the same change.

## 5. Stability Contract

- Type-only package: no runtime dependencies, no side effects — safe for any consumer.
- String-literal enums are the compatibility boundary: adding values is non-breaking; renaming or removing values is breaking.
- Aggregates (`FloorplanData`) may only gain optional fields in minor versions; required-field additions require a major bump.
- Keep the surface mirrored: any change here must be reflected in [API_SPEC.md](API_SPEC.md) and [DATA_FORMAT.md](DATA_FORMAT.md).

## 6. Status & Roadmap

- v0.1: types only. Runtime validation (zod), utils, and constants are planned.
- Future: split IoT (`Device`/`Unit`) vs. spatial contracts into subpath exports (`@myfloorplan/shared/spatial`, `@myfloorplan/shared/iot`) so consumers import only what they need.
