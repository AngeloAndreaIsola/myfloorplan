# MyFloorplan Mobile App

The mobile application for the **MyFloorplan** ecosystem, compiling to native iOS and Android environments.

## Overview

The Mobile App is built on React 18, Vite, and [Capacitor](https://capacitorjs.com/) to provide cross-platform capabilities. It aims to deliver a responsive, touch-optimized version of the floorplan layout manager.

## Key Planned Features

- **Touch Interaction**: Custom gesture handlers for the 2D Konva stage, supporting pinch-to-zoom, two-finger pan, and drag-and-drop snapping.
- **Offline Storage**: Local SQLite cache via Capacitor Storage API, allowing layout changes to sync when network connection becomes available.
- **Camera Digital Twin Integration**: Hook into native camera APIs to support room shape capture from photos/scans (digital twin mapping).

## Technical Stack

- **Hybrid Native Framework**: Capacitor Core, Android, iOS
- **UI Framework**: React + Vite + TailwindCSS + DaisyUI
- **Data Layers**: Zustand + `@myfloorplan/shared`

---

## Development & Platform Sync

### 1. Web Local Preview
Run local dev server in browser mode:
```bash
pnpm dev
```

### 2. Compile Web Assets
Vite compiles the source files into the `/dist` output folder:
```bash
pnpm build
```

### 3. Sync with Native Platforms
Copy compiled web assets and install native plugins into iOS/Android native projects:
```bash
# Sync Capacitor plugins and code
npx cap sync
```

### 4. Run Native Projects
Open IDE workspace for platform compilation:
```bash
# Open Xcode
npx cap open ios

# Open Android Studio
npx cap open android
```
