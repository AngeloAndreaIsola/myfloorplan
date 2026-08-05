# Floorplan Data Format Specification

**Version**: 1 (implicit — `schemaVersion` field proposed for v0.2)
**Status**: Implemented in `myfloorplan-shared/src/types/index.ts`
**Consumers**: web editor, mobile app, renderer, API (D1 `floorplans.data` JSON column)
**Related**: [API Specification](API_SPEC.md) · [Shared Package Guide](SHARED_PACKAGE.md)

## 1. Overview

The floorplan document is a JSON object serialized from `FloorplanData`. It is the single interchange format between editor clients and the API. A `Project` may contain multiple floors, each carrying one `FloorplanData` document.

## 2. Document Shape

| Field | Type | Required | Description |
|---|---|---|---|
| `wallLines` | `Wall[]` | yes | Wall segments (renamed from legacy `walls`) |
| `rooms` | `Room[]` | yes | Room polygons |
| `blocks` | `Block[]` | yes | Structural / decorative / space blocks |
| `structuralElements` | `StructuralElement[]` | no | Stairs and columns |
| `placedItems` | `PlacedItem[]` | yes | Furniture, lighting, wall decorations, structural elements (renamed from legacy `items`) |
| `entities` | `{ actors, creatures, plants, units, devices, vehicles }` | yes | Simulated and smart entities |
| `activities` | `Activity[]` | yes | Scheduled activities referencing actors |

> **Recommended (v0.2)**: add `"schemaVersion": 1` to the document and migrate legacy `walls`/`items` keys on read.

## 3. Conventions

- **Coordinates**: 2D `{ x, y }` points in a continuous plane; optional `z` for elevation. The 2D editor renders on a 20px grid (`useEditorStore.gridSize`).
- **Units**: world units; assumed 1 unit = 1 meter (not enforced in v0.1 — see §7).
- **Angles**: degrees (rotation on `StructuralElement` and `Item.rotation`).
- **IDs**: unique UUID v4 strings; reference fields (`Room.walls`, `Activity.actors`, `Item.materialId`) point to IDs elsewhere in the document.
- **Enums**: string literals — see each type below.

## 4. Core Types

### 4.1 Point / Dimensions

| Type | Fields |
|---|---|
| `Point` | `x: number`, `y: number`, `z?: number` |
| `Dimensions` | `width: number`, `height: number`, `depth?: number` |

### 4.2 Wall

`id`, `start: Point`, `end: Point`, `thickness`, `height`, `openings: WallOpening[]`, `materialId?`, `color?`, `textureUrl?`

### 4.3 WallOpening

`id`, `type: 'Door' | 'Window'`, `styleId?` (e.g. `french-door`, `sliding-glass`, `arched-window`), `offset` (0–1 along the wall), `dimensions`.

### 4.4 Room

`id`, `name`, `points: Point[]`, `walls: string[]` (wall IDs), `area`, `volume`, `materialId?`, `color?`, `textureUrl?`

### 4.5 Block

`id`, `name`, `type: 'Structural' | 'Decorative' | 'Space'`, `bounds: { min: Point, max: Point }`

### 4.6 StructuralElement

`id`, `type: 'Stair' | 'Column'`, `styleId?`, `position: Point`, `rotation`, `dimensions`, `materialId?`, `color?`, `textureUrl?` — plus stair-specific `stepCount?`, `rise?`, `run?`, `hasHandrail?`.

### 4.7 PlacedItem (union)

Base `Item`: `id`, `name`, `category`, `position: Point`, `rotation: Point`, `scale: Point`, `modelUrl?`, `imageUrl?`, `materialId?`

Variants:

- `Furniture` — `brand?`, `dimensions`, `weight?`, `components?` (sub-item IDs)
- `LightingItem` — `lightType: 'point' | 'spot' | 'ambient'`, `intensity`, `lightColor`, `range?`, `castShadows?`
- `WallDecorationItem` — `dimensions`, `wallOffset`, `thickness`
- `StructuralElement` (discriminated by `type: 'Stair' | 'Column'`)

Discriminate variants via `type`/`lightType`. `LibraryItem` (`id, title, category, modelUrl, imageUrl`) is the catalog-side descriptor and is not part of `placedItems`.

### 4.8 Entities

| Type | Extra fields |
|---|---|
| `Entity` (base) | `id`, `name`, `type`, `position`, `rotation?`, `scale?` |
| `Unit` | `powerStatus?`, `modelNumber?` |
| `Actor` | `role`, `capabilities: string[]` |
| `Creature` (extends `Actor`) | `species`, `behavior: 'passive' \| 'aggressive' \| 'neutral'` |
| `Plant` | `species`, `health` (0–1), `growthStage: 'seedling' \| 'growing' \| 'mature' \| 'withering'` |
| `Device` | `status: 'on' \| 'off' \| 'standby' \| 'error'`, `battery?` (0–100), `connectionStatus: 'connected' \| 'disconnected' \| 'connecting'` |
| `Vehicle` | `speed`, `fuelType: 'electric' \| 'gasoline' \| 'none'`, `batteryLevel?` |

### 4.9 Activity

`id`, `name`, `type`, `actors: string[]` (actor IDs), `position: Point`, `duration` (seconds), `status: 'pending' | 'in-progress' | 'completed'`

### 4.10 Materials & Rendering (`properties.ts`)

- `Material` — `id`, `name`, `color?`, `textureUrl?`, `transparency?`, `metallic?`, `roughness?`
- `Dimension` — `value`, `unit: 'm' | 'cm' | 'mm' | 'ft' | 'in'`
- `BoundingBox`, `MeasurementReport`, `RenderSettings` (`sunlight`, `shadows`, `pbr`)

## 5. Multi-Floor & Project Documents

```ts
interface Floor {
  id: string;
  name: string;
  level: number;
  data: FloorplanData;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  thumbnailUrl?: string;
  data?: FloorplanData; // legacy single-floor payload
  floors?: Floor[];     // multi-floor payload (preferred)
}
```

## 6. Persistence Mapping (D1)

| Table | Column | Mapping |
|---|---|---|
| `projects` | metadata columns | Project identity/ownership (user-scoped) |
| `floorplans` | `data` (JSON mode) | Serialized `FloorplanData` — one document per project in v0.1; multi-floor serialization planned in v0.2 |
| `assets` | rows | Asset catalog |
| `floorplan_items` | rows | Item library entries referencing `assets.assetId` |
| `floorplan_item_groups`, `asset_sources`, `asset_jobs`, `tags` | rows | Supporting catalogs |

## 7. Open Questions / v0.2 Items

- Enforce `schemaVersion` and migrate legacy keys (`walls` → `wallLines`, `items` → `placedItems`) on read.
- Define an explicit unit policy (1 world unit = 1 meter) and physical-size sync with `FloorplanItem.itemWidth`/`itemHeight`.
- Multi-floor storage: single `floors` JSON document vs. per-floor rows.
- Runtime validation: zod schemas mirroring these types.
