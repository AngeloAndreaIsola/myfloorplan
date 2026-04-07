# My floorplan

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

### Tech Stack 
- Languages: TypeScript, secondary Python
- Frontend: React, daisy-ui, babylon.js, konva
- Backend: Hono
- Database: D1, R2
- Dev: vite, pnpm, git

### AI Coding Assistant
- Use Antigravity AI Coding Assistant to help with coding.
- Use Gemini 3 Pro to help with coding. Add concrete instructions to AI assistant to get better results.
- Write detail docs into /docs folder, eg: HOWTO, ARCHITECTURE, PLAN, TODO, ...

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