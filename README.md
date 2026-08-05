# MyFloorplan Monorepo

Welcome to the **MyFloorplan** project! This is a state-of-the-art floorplan design and management system, featuring 2D/3D visualization, asset management, and a robust API.


My floorplan is a web application that allows users to create and edit floor plans.

## Architecture
- The application is built with a client-server architecture.
- The client is built with React, daisy-ui, babylon.js, konva, zustand. 
- The server is built with Hono. The client communicates with the server using REST APIs or websocket.
- The server communicates with the database using D1 and R2.
- The assets (models, textures, etc.) are stored in R2. The main 3d models are in gltf format.
- The headless renderer is built with babylon.js, and blender can render the floorplan into images or videos.
- The assetcenter provides a web interface to manage the assets.
- 3d models collected (crawl) from open-source 3d model websites, such as Sketchfab, Thingiverse, cadnav, archive3d,... etc.

## Features
- Web and Mobile App
- User Authentication via Google, github
- Create Projects for a building
- Create/Edit Floorplan (multiple floors) for a building in 2D/3D view
- Select and add/organize furnitures and walls (textures) from a library
- Items can be moved, rotated, resized, deleted, duplicated, etc.
- Concepts about rooms, walls, doors, windows, furniture, area, volume, materials, etc. 
- Extra entities: units, actors, creatures, plants, devices, vehicles, activities  etc.
- Walkthrough, VR mode to view the floorplan in 3D
- Render 2D/3D floorplan with walls, doors, windows, furniture, etc into images or videos (queue jobs)
- Export to gltf, obj, fbx, blender, unreal, unity, etc.
- AI Design/ Chat Assistant to support Experiment plan that AI suggest to create a floorplan
- XR/VR capture from 3D real world (using phone camera) to create a floorplan digital twin

### Integrations
- Integrated with Google Maps, Google Street View to get the real world data
- Integrated with BIM (Building Information Modeling) software, Google SketchUp, Revit, etc.

### Advance Features (Enterprise)
- Advance building style like office, residential, commercial, industrial, etc.
- Connect to IOT devices to control the floorplan actors & activities: security, lighting, temperature, etc.
- Future AI managements: robot understand floorplan and can move around to do tasks

## Project Structure

This monorepo is managed using [pnpm workspaces](https://pnpm.io/workspaces). Below is an overview of the key components:

### Core Applications

- **[Web App](myfloorplan-web/README.md)**: A modern React application with Vite, DaisyUI, and Babylon.js for powerful 3D floorplan editing.
- **[API Service](myfloorplan-api/README.md)**: A high-performance backend powered by Hono and Vite, providing the foundation for data persistence and logic.
- **[Mobile App](myfloorplan-mobile/README.md)**: The mobile-first experience for managing floorplans on the go.
- **[Admin Portal](myfloorplan-admin/README.md)**: Dashboard for managing users, projects, custom assets, and system crawling jobs.

### Supporting Libraries & Modules

- **[Shared Core Library](myfloorplan-shared/README.md)**: Core schemas, types, and model validation logic.
- **[Renderer](myfloorplan-renderer/README.md)**: Core rendering engine for 2D/3D visualizations.
- **[Asset Center](myfloorplan-assetcenter/README.md)**: Centralized management for furniture models, textures, and other design assets.

### Documentation

Check out the [docs/](docs/) directory for detailed system information:
- [Architecture Overview](docs/ARCHITECTURE.md)
- [How-To Guides](docs/HOWTO.md)
- [Initialization Steps](docs/INIT.md)
- [Roadmap & Plan](docs/PLAN.md)
- [Editor UX Guide](docs/EDITOR_UX.md)

**Versioned Plans & Progress**
- [v0.1 — Plan](docs/plan/v0.1.md) · [Progress](docs/progress/v0.1.md)
- [v0.2.x — Plan](docs/plan/v0.2.x.md) · [Progress](docs/progress/v0.2.md)

**Design Specifications**
- [API Specification](docs/design/API_SPEC.md)
- [Data Format Specification](docs/design/DATA_FORMAT.md)
- [Shared Package Usage Guide](docs/design/SHARED_PACKAGE.md)

- [Current TODOs](docs/TODO.md)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (Version 20 or higher recommended)
- [pnpm](https://pnpm.io/) (Version 10 or higher)

### Setup

1.  **Install dependencies**:
    ```bash
    pnpm install
    ```

2.  **Run in development**:
    ```bash
    pnpm dev
    ```

3.  **Build all projects**:
    ```bash
    pnpm build
    ```

## Contributing

Please refer to the subproject READMEs for specific contribution guidelines and local setup instructions.

## License

Private - (c) MyFloorplan Team
