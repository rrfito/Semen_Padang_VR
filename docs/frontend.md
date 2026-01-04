# Frontend Documentation

## 1. Overview

The frontend is a **Single Page Application (SPA)** built with **React** and **Inertia.js**. It resides in `resources/js`. It handles 3D rendering, Map interaction, and complex UI state implementation.

## 2. Folder Structure (`resources/js`)

-   `Pages/`: Entry points for Inertia.
    -   `Tour/`: Public components (`Index.jsx`, `Viewer.jsx`).
    -   `Editor/`: Admin Editor (`Index.jsx` is the massive workspace wrapper).
    -   `Editor/Views/`: Sub-views for the editor (e.g., `SceneView.jsx`, `AreaOverview.jsx`).
    -   `Editor/Modals/`: Popups (`CreateAreaModal`, `PendingChangesModal`).
-   `Components/`: Reusable UI.
    -   `Editor/`: UI specific to the admin panel (Sidebar, Toolbar).
    -   `Tour/`: UI specific to the public tour (Sidebar, Minimap).

## 3. Key Libraries & Integrations

### 3.1 Inertia.js

Serves as the glue between Laravel and React. Data is passed from Controllers as Props.

-   Page transitions are handled without full reloads.
-   Forms use `useForm` hook for easy submission + validation error handling.

### 3.2 Marzipano (360 Viewer)

Used for rendering the equirectangular panoramas.

-   Implementation: `Viewer.jsx` initializes a `Marzipano.Viewer`.
-   Hotspots: Rendered as DOM elements overlaid on the 3D canvas based on `yaw`/`pitch`.

### 3.3 Leaflet (Maps)

Used for the Mini-Map and Location Picker.

-   Library: `react-leaflet`.
-   Features: Custom Markers, Polyline rendering (to show paths between scenes), ImageOverlay (if using custom floorplans, though currently uses tile layers).

### 3.4 @dnd-kit

Used in the Editor Sidebar for dragging and dropping Areas/Scenes to reorder or re-parent them (Hierarchy management).

## 4. Styling

-   **Tailwind CSS**: Utility-first styling.
-   **Custom Config**: Colors (e.g., Semen Padang Red) are defined in `tailwind.config.js`.

## 5. Build Tool

-   **Vite**: Compiles JSX and CSS. Hot Module Replacement (HMR) is active during `npm run dev`.
