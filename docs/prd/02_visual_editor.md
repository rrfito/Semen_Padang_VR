# PRD: Visual Editor & Content Management

**Filename**: `docs/prd/02_visual_editor.md`
**Authoritative System**: Visual Editor (React/Inertia)

## Purpose

To serve as the **Write-Master** for all location data. It provides a WYSIWYG interface for administrators to structure the facility, manage assets, and define navigation logic before publishing.

## In Scope

1.  **Hierarchy Manipulation**:
    -   Create/Update/Delete `Areas` (Containers) and `Scenes` (Leaf nodes).
    -   Reorder nodes (Priority/Sort order).
2.  **Asset Pipeline**:
    -   Bulk Upload of Equirectangular Images (JPG/PNG).
    -   **Server-Side** GPS Extraction (EXIF data).
    -   **Server-Side** Image Optimization (Conversion to WebP).
3.  **Hotspot Management**:
    -   Create interactive `Hotspots` on a Scene.
    -   _Types_: `nav` (Scene-to-Scene), `info` (Text/Image popover), `gateway` (Entry point).
    -   **Auto-Link Logic**: A server-side or explicit user-triggered action that calculates distances between scenes (using GPS) and creates candidates for `nav` hotspots. It must NOT happen automatically on load without user confirmation.
4.  **State Management**:
    -   **Draft Mode**: All edits (position, text, links) are saved to "Draft" state immediately.
    -   **Publishing**: Explicit action to promote "Draft" state to "Live" state.
    -   **Undo/Revert**: Ability to discard Draft changes and revert to Published state.

## Out of Scope

1.  **Public View**: This interface is for restricted admin access only.
2.  **Client-Side Auto-Link**: The browser should not be calculating complex Haversine distances for hundreds of nodes on every render.
3.  **Live Usage Statistics**: This tool creates content, it does not analyze its consumption.

## Data Ownership

-   **Write**: `areas`, `scenes`, `hotspots`, `files` (storage).
-   **Read**: `users` (for permission checks).

## Hard Constraints

-   **MUST** extract `lat/lng` from EXIF data upon upload if available.
-   **MUST** default new uploads to `published: false` (or explicitly separate draft/published tables/columns).
-   **MUST** validate that a Hotspot Target ID exists before saving.
-   **MUST NOT** allow a Scene to be its own parent.

## Non-Goals

-   Image editing (cropping, color correction) inside the browser.
-   3D Model rendering (photosphere only).
