# Product Requirement Document: Semen Padang VR Platform

## Overview

The Semen Padang VR Platform is a comprehensive web-based application designed to manage, visualize, and virtually tour the Semen Padang industrial facility. It consists of a public-facing Virtual Tour Viewer and Map Dashboard for end-users, and a robust Visual Editor and Admin Panel for administrators to manage content, areas, and users.

## Problem Statement

Managing and navigating the extensive facility of Semen Padang physically is time-consuming and complex. There is a need for a digital twin or virtual representation that allows remote tours, efficient layout management, and easy access to location data (restricted areas, specific plants) using immersive 360° technology.

## Goals

1.  **Immersive Navigation**: Provide a seamless 360° virtual tour experience with intuitive navigation (hotspots, map integration).
2.  **Content Management**: Enable administrators to easily upload, organize, and link 360° panoramic images without coding.
3.  **Spatial Awareness**: Give users a clear sense of direction and location via an interactive map and heading preservation functionality.
4.  **Operational Efficiency**: Streamline the process of updating facility imagery and structure through a visual editor.

## Non-Goals

1.  Real-time CCTV integration (unless explicitly specified later).
2.  Physical asset tracking (IoT) within the VP initially.
3.  Offline desktop application (web-based focus).

## User Scenarios

1.  **Public User / Visitor**:

    -   Opens the user dashboard to view the "Peta Lokasi" (Map).
    -   Searches for a specific plant via the sidebar.
    -   Selects a location to fly the map to that coordinate.
    -   Enters the "Virtual Tour" mode to look around in 360°.
    -   Navigates between scenes using on-screen hotspots (arrows/gateways).

2.  **Administrator**:
    -   Logs into the Admin Panel to view system stats and recent updates.
    -   Accesses the **Visual Editor** to create a new Area structure (e.g., "New Warehouse").
    -   Bulk uploads 360° images; the system automatically extracts GPS data.
    -   Uses "Auto-Link" or manually places hotspots to connect adjacent scenes.
    -   Saves changes and publishes them to the live viewer.

## Functional Requirements

### 1. User Dashboard (Map & Discovery)

-   **Interactive Map**: Full-screen map (Leaflet/Mapbox) displaying marked locations (Areas/Scenes).
-   **Sidebar Navigation**: Hierarchical menu to browse locations (Grandparent -> Parent -> Child).
-   **Search & Filter**: Ability to find specific areas or scenes.
-   **Responsiveness**: Collapsible sidebar for mobile and desktop views.
-   **Preview**: Selecting a location updates the map center and shows a detail panel (Secondary Sidebar).

### 2. Virtual Tour Viewer

-   **360° Rendering**: High-performance panoramic viewing (using Marzipano).
-   **Hotspot Navigation**: Interactive markers to move between scenes.
    -   _Navigation Arrow_: For movement within linked scenes.
    -   _Gateway_: For entering buildings or distinct areas.
-   **Heading Preservation**: Maintain the user's compass direction when moving between scenes to prevent disorientation.
-   **Minimap**: Small overlay map showing current position.
-   **Deep Linking**: URL parameters (e.g., `?heading=120`) to share exact viewpoints.
-   **Breadcrumbs**: Clear hierarchy display (e.g., "Pabrik Indarung > Kiln > View A").

### 3. Visual Editor (Admin)

-   **Hierarchy Management**: Tree-based structure to organize Areas and Scenes.
-   **Bulk & Drag-and-Drop Upload**: Upload multiple images with automatic GPS metadata extraction.
-   **Scene Editing**:
    -   Add/Delete/Move Hotspots visually.
    -   Set initial viewing angle (North/Heading).
-   **Auto-Linking**: Algorithm to automatically suggest or create links based on GPS proximity.
-   **Draft & Publish**: Changes are saved as drafts ("modified", "new") and must be explicitly published to go live.
-   **Undo/Delete**: Safe deletion with dependency checks (or optimistic UI updates).

### 4. Admin Panel

-   **Dashboard**: Overview of total areas, scenes, visits, and draft status.
-   **User Management**: create, edit, change role users.
-   **Activity Logs**: Track recent changes made by admins.

## Non-Functional Requirements

-   **Performance**: Lazy loading of high-resolution 360° images to ensure fast initial load.
-   **Usability**: "Edit Mode" should closely resemble the actual viewer for WYSIWYG experience.
-   **Scalability**: Support for hundreds of scenes and complex nested hierarchies.
-   **Compatibility**: Functional on modern web browsers (Chrome, Firefox, Safari, Edge) on both Desktop and Mobile.

## Constraints

-   **Map API**: Usage of specific map providers (e.g., OSM, Google Maps) may be limited by API keys or quotas.
-   **Image Storage**: High-res panoramas require significant storage and optimized delivery (WebP processing).
-   **GPS Accuracy**: Auto-linking relies on the accuracy of EXIF GPS data in uploaded images.

## Success Metrics

-   **Engagement**: Duration of user sessions in the Virtual Tour.
-   **Efficiency**: Time taken for an admin to upload and link a new area (target: < 10 mins for 20 scenes).
-   **Coverage**: Percentage of the physical facility mapped and accessible in VR.

## Out of Scope

-   Live video streaming.
-   Integration with SAP or ERP systems (for now).
-   User account creation for public visitors (public access assumed open).
