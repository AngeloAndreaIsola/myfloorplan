# MyFloorplan API Service

The high-performance edge API server for the **MyFloorplan** ecosystem, optimized to run on Cloudflare Workers.

## Overview

The backend service is powered by [Hono](https://hono.dev/) and provides standard REST endpoints for managing users, projects, floorplans, and assets. It integrates with Cloudflare D1 (relational database) via Drizzle ORM and uses Cloudflare R2 for asset binary storage.

## Key Subdirectories

- **`src/db/`**:
  - `schema.ts`: Database tables definition using `drizzle-orm/sqlite-core`. Matches project entities, auth users, asset catalogs, and crawler jobs.
- **`src/middleware/`**:
  - `auth.ts`: Middleware validating authorization headers. Attaches the verified user metadata to the context.
- **`src/index.ts`**:
  - Application router registering paths `/api/projects`, `/api/projects/:id/floorplan`, `/api/assets`, `/api/asset-jobs`, and user syncing functions.

---

## Database Management with Drizzle & Wrangler

We use [Wrangler](https://developers.cloudflare.com/workers/wrangler/) to manage Cloudflare services locally and in production.

### local Database migrations

1. **Generate Migration Files**:
   Create SQL migration files after modifying the Drizzle schema:
   ```bash
   pnpm drizzle-kit generate:sqlite
   ```

2. **Apply Migrations Locally**:
   Run database updates against the local SQLite database instance:
   ```bash
   npx wrangler d1 migrations apply myfloorplan-db --local
   ```

3. **Apply Migrations to Production**:
   Apply the migrations to the live Cloudflare D1 database:
   ```bash
   npx wrangler d1 migrations apply myfloorplan-db --remote
   ```

---

## Development & Run

### Environment Variables
Configure the `.env` file based on `.env.example` in this directory.

### Start Local Worker
Starts a local wrangler dev environment on port `8787` (binding local simulated D1 & R2 services):
```bash
pnpm dev
```

### Build API
```bash
pnpm build
```

### Deploy to Cloudflare
```bash
npx wrangler deploy
```
