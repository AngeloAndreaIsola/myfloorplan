# MyFloorplan REST API Specification

**Version**: 0.1
**Status**: Implemented (stubs noted per endpoint)
**Base path**: `/api`
**Reference implementation**: `myfloorplan-api/src/index.ts`
**Related**: [Data Format Specification](DATA_FORMAT.md) · [Shared Package Guide](SHARED_PACKAGE.md)

## 1. Transport & Conventions

- Protocol: HTTPS in production; HTTP for local Wrangler dev (`http://localhost:8787`).
- Content type: `application/json` for requests and responses.
- IDs: UUID v4 strings generated with `crypto.randomUUID()`.
- Timestamps: ISO-8601 strings in JSON output. D1 stores unix-ms integers via Drizzle `timestamp` mode; the `assets` table stores text timestamps.
- CORS: enabled for all origins (Hono `cors()`).
- Logging: Hono `logger()` middleware on every request.

## 2. Authentication

All routes under `/api` require a bearer token **except** `GET /api/health` and `GET /api/assets`:

```
Authorization: Bearer <token>
```

Current middleware (`src/middleware/auth.ts`):

- Missing header or non-`Bearer` scheme → `401 { "error": "Unauthorized" }`.
- Tokens prefixed `token_for_<uid>` map to `userId = <uid>` (local-dev format).
- Any other token maps to the shared placeholder `unverified_user`.

> **Planned (v0.2)**: verify Firebase ID tokens against public JWKs (e.g. `jose`) and reject unknown tokens.

## 3. Pagination

List endpoints accept `page` (default `1`) and `limit` (default `20`, `50` for `/assets`). Responses use a uniform envelope:

```json
{
  "data": [ ... ],
  "pagination": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 }
}
```

## 4. Error Handling

Errors use HTTP status codes with a JSON body:

```json
{ "error": "Project not found" }
```

| Code | Meaning |
|---|---|
| 401 | Missing/invalid token |
| 404 | Resource not found, or not owned by the user |
| 501 | Endpoint defined but not yet implemented |
| 503 | Service degraded (health check) |

## 5. Endpoints

### 5.1 GET `/api/health` — public

Health probe for the D1 and R2 bindings.

`200`:

```json
{
  "status": "ok",
  "d1": "ok",
  "r2": "ok",
  "timestamp": "2026-08-05T12:00:00.000Z"
}
```

`503` when D1 or R2 is in `error`. R2 reports `not_bound` when the bucket binding is missing.

### 5.2 GET `/api/assets` — public

Global asset library, optionally filtered by `?type=model|texture`, paginated. Items left-join `assets` with `floorplan_items` and additionally expose `itemObjectType`, `itemTags`, `itemWidth`, `itemHeight` when an item exists.

### 5.3 POST `/api/users/sync`

Upsert the authenticated user into `users`.

Request:

```json
{ "email": "user@example.com" }
```

Response `200`:

```json
{ "success": true, "userId": "uid-123" }
```

### 5.4 GET `/api/projects`

Paginated list of projects owned by the authenticated user.

### 5.5 POST `/api/projects`

Request:

```json
{ "name": "Beach House", "description": "Weekend retreat" }
```

Response `201`: full project object. `name` defaults to `"New Project"` when omitted.

```json
{
  "id": "uuid",
  "userId": "uid-123",
  "name": "Beach House",
  "description": "Weekend retreat",
  "createdAt": "2026-08-05T12:00:00.000Z",
  "updatedAt": "2026-08-05T12:00:00.000Z"
}
```

### 5.6 GET `/api/projects/:id`

Ownership-scoped project metadata. `404` when missing or not owned.

### 5.7 PUT `/api/projects/:id`

Partial update. Request:

```json
{ "name": "New Name", "description": "Updated description" }
```

Response: `{ "success": true, "id": "..." }`.

### 5.8 DELETE `/api/projects/:id`

Deletes the project; floorplans cascade via the D1 foreign key. Response: `{ "success": true }`.

### 5.9 GET `/api/projects/:projectId/floorplan`

Loads the project's floorplan JSON document.

- Found → `{ id, projectId, data: FloorplanData, createdAt, updatedAt }`
- Not found → `200 { "data": {} }` (empty default)

### 5.10 PUT `/api/projects/:projectId/floorplan`

Creates or updates the floorplan row. Request:

```json
{
  "data": { "wallLines": [], "rooms": [], "blocks": [], "placedItems": [], "entities": {}, "activities": [] }
}
```

Response: `{ "success": true, "id": "..." }`. The `data` payload follows the [Data Format Specification](DATA_FORMAT.md).

### 5.11 GET `/api/tags`

All tags as a plain array.

### 5.12 POST `/api/assets`

**Stub** — returns `501`:

```json
{ "error": "Not implemented: Asset upload logic (R2/S3) missing." }
```

Planned for v0.2.

### 5.13 GET/POST `/api/asset-sources`

- `GET`: array of all asset sources.
- `POST`: create; request body is spread onto the row plus `id` (UUID) and `createdAt` (server-set). Response `{ "id": "...", "status": "success" }`.

### 5.14 GET/POST `/api/asset-jobs`

- `GET`: all jobs ordered by `createdAt` descending.
- `POST`: create; `status` forced to `"pending"`, `progress` to `0`. Response `{ "id": "...", "status": "success" }`.

### 5.15 GET/POST `/api/item-groups`

- `GET`: all floorplan item groups.
- `POST`: create; `createdAt`/`updatedAt` set server-side. Response `{ "id": "...", "status": "success" }`.

## 6. Bindings & Environment

| Binding | Type | Purpose |
|---|---|---|
| `DB` | D1 | Relational storage — see [Data Format Specification](DATA_FORMAT.md) for table mapping |
| `ASSETS_BUCKET` | R2 | Binary asset storage (models, textures); consumed by upload flows from v0.2 |

## 7. Versioning & Evolution

- All routes are prefixed `/api` (no `/v1` yet). Introduce `/api/v1` when a breaking change is required.
- The floorplan payload (`data`) follows the versioned document described in [DATA_FORMAT.md](DATA_FORMAT.md).
- API-level types mirror `@myfloorplan/shared` (see [SHARED_PACKAGE.md](SHARED_PACKAGE.md)) so every consumer shares one contract.
