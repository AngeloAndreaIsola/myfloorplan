# MyFloorplan Admin Portal

The administrative dashboard for managing assets, users, rendering queues, and ingestion pipelines in the **MyFloorplan** ecosystem.

## Overview

The Admin Portal is a Vite-powered React application built with DaisyUI and TailwindCSS. It provides tools for system operators to oversee operations, audit users, manage the 3D asset catalog, and control automated background tasks.

## Key Planned Features

- **Ingestion Control Panel**: Set up, trigger, and monitor 3D model crawling jobs (from Sketchfab, cadnav, archive3d, etc.).
- **Asset Optimization Monitor**: Review asset optimization queues (e.g. FBX/OBJ to GLTF conversions, texture compression).
- **Offline Rendering Queue**: Track and manage high-quality blender render queues submitted by users.
- **Analytics & User Quotas**: View system-wide metrics on database usage (D1), blob storage usage (R2), and active projects.

## Technical Stack

- **Framework**: React 19 + TypeScript + Vite
- **UI Framework**: TailwindCSS + DaisyUI
- **State Management**: Zustand
- **Shared Schemas**: `@myfloorplan/shared` workspace dependency

---

## Development

Run development server:
```bash
pnpm dev
```

Build production distribution:
```bash
pnpm build
```
