# PRD: Public Viewer & Map Dashboard

**Filename**: `docs/prd/03_public_viewer.md`
**Authoritative System**: Public Frontend (React/Inertia/Marzipano)

## Purpose

To provide a fast, accessible, and immersive read-only experience for public users navigating the Semen Padang facility.

## In Scope

1.  **Map Dashboard (Discovery Layer)**:
    -   Interactive Map (Leaflet/Mapbox) showing **only** `Published` markers.
    -   Sidebar Hierarchical Browser (Grandparent/Parent/Child).
    -   Search Functionality (Client-side filtering of loaded dataset).
2.  **Virtual Tour (Immersion Layer)**:
    -   360° Photosphere Player (Marzipano).
    -   Rendering `Hotspots` (Nav/Info/Gateway) strictly from the database.
    -   **Heading Preservation**: When transitioning Scene A -> Scene B, the viewer pitch/yaw must rotate to maintain the user's cardinal direction (simulating physical movement).
3.  **Navigation State**:
    -   Deep Linking: URL must reflect current `scene_id` and `heading`.
    -   Breadcrumbs: Display hierarchy path of current scene.

## Out of Scope

1.  **Authentication**: No login required.
2.  **Comments/Feedback**: No user generated content.
3.  **Asset Processing**: The viewer does NOT process images or calculate links. It consumes static assets.

## Data Ownership

-   **Read-Only**: `areas`, `scenes`, `hotspots`.
-   **Write**: None (Local Storage for preferences allowed).

## Hard Constraints

-   **MUST** filter all database queries with `published_at != null` (or equivalent scope).
-   **MUST** Lazy Load scenes (do not load full res images until required).
-   **MUST NOT** expose internal Admin APIs (e.g., specific exact coordinates of restricted assets if they are flagged 'hidden').

## Non-Goals

-   Offline mode (PWA features are secondary).
-   VR Headset (WebXR) specific support (focus on Desktop/Mobile flat screen first).
