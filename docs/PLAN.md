# Development Plan - My Floorplan

Iteration strategy for the upcoming project phases.

### Detailed Planning & Tracking
- **v0.1 (Released)**: [Plan](plan/v0.1.md) · [Progress](progress/v0.1.md)
- **v0.2 (Next)**: [Plan](plan/v0.2.x.md) · [Progress](progress/v0.2.md)

### Design Specifications
- [REST API Specification](design/API_SPEC.md)
- [Floorplan Data Format](design/DATA_FORMAT.md)
- [Shared Package Usage Guide](design/SHARED_PACKAGE.md)


## Phase 1: Core Interaction (Completed)
- 2D Drawing Engine (Konva).
- 3D Sync Engine (Babylon).
- Wall Opening (CSG).
- Materials & Textures.
- Cinematic Lighting & Shadows.
- Modular Component Architecture (2D/3D separation).

## Phase 1.5: Advanced Architectural & Decor Elements (In Progress)
- **Floor3D & Ceiling3D**: Extracted from Room concepts, supporting distinct textures and materials.
- **Door3D / Window3D**: Dedicated mesh and CSG logic for diverse opening styles (sliding, french doors, arched windows).
- **Stair3D**: Dedicated structural elements with parameterised steps and handrails.
- **Light3D**: Real-time point lights, spotlights, and emissive meshes acting as functional light sources in the scene.
- **WallDecoration3D**: Wall-snapped items like paintings, shelves, and mirrors.

## Phase 2: Persistence & Authentication (Next)
### 2.1 Backend & Database Infrastructure
- **Framework Setup**: Configure Hono on Cloudflare Workers/Pages for edge performance.
- **D1 Database Setup**: Implement schema for users, projects, floorplans, and assets.
- **ORM Integration**: Setup Drizzle ORM for type-safe database interactions with D1.

### 2.2 Authentication Flow
- **Provider Setup**: Integrate Firebase Auth (or Auth0) for frontend authentication.
- **Backend Verification**: Validate JWT tokens in Hono middleware to protect API routes.
- **User Synchronization**: Maintain a local user record in D1 tied to the auth provider's UID.

### 2.3 Core Projects API
- **CRUD Operations**: Implement standard REST routes for `Project` (create, read, update, delete).
- **Floorplan Sync**: Build endpoints to save and load floorplan states (JSON dumps of wall/room/item geometry).
- **Asset Management**: Endpoints to manage uploaded / referenced 3D models and textures.

## Phase 3: AI Assistant Integration
- Gemini 1.5 Pro integration for "Design Chat".
- Prompt-based room generation.
- Automated furniture placement suggestions.

## Phase 4: Advanced Rendering
- SSAO (Ambient Occlusion) for contact shadows.
- PBR Materials with Normal Maps.
- Video generation (Blender/Babylon headless).
