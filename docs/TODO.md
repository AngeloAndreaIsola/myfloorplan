# TODO - My Floorplan

Current roadmap and pending tasks.

## High Priority
- [ ] **Multi-Floor Support**: Add a floor selector and manage multiple `wallLines` arrays in the store.
- [ ] **Undo/Redo**: Implement a history stack in Zustand.
- [ ] **Save/Load**: Connect `myfloorplan-web` to a Hono backend for project persistence.

## Features
- [ ] **Measurement Labels**: Show length/dimension text overlays in 2D view.
- [ ] **Camera Controls**: Add "First Person" walk-through mode in 3D.
- [ ] **Export**: Implement GLTF export for the entire scene.
- [ ] **Library Expansion**: Crawl and add more 3D models to `mockFurniture`.

## Polish
- [ ] **UI Themes**: Add more DaisyUI themes (Dark Mode, etc.).
- [ ] **Performance**: Optimize CSG operations for complex wall layouts using mesh caching.
- [ ] **Mobile Support**: Add touch handlers for the Konva stage.
