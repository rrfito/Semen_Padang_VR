# Product Requirement Document (PRD)

## 1. Overview

**Project Name:** Semen Padang VR Tour  
**Description:** A web-based Virtual Reality (VR) tour application for PT Semen Padang. It allows public users to explore the factory facilities via 360° panoramic images and an interactive map. Administrators can manage the tour content (areas, scenes, hotspots) via a secure Visual Editor with a "Draft > Publish" workflow.

## 2. Problem Statement

PT Semen Padang requires a modern, digital way to showcase their extensive factory facilities to stakeholders, guests, and the public. Manual guided tours are resource-intensive and limited by physical access. A virtual solution is needed that is easy to update as facilities change.

## 3. Goals

-   **Immersive Experience:** Provide high-quality 360° views of key areas.
-   **Easy Navigation:** Allow users to navigate via "Hotspots" (arrows in the scene) and a "Mini Map" (Google Maps/Leaflet integration).
-   **Content Management:** Enable non-technical admins to update scenes, rename areas, and change navigation links without coding.
-   **Safety & Control:** Ensure changes are reviewed (Draft mode) before going live (Publish).

## 4. User Personas

1.  **Public User (Guest):**
    -   Wants to explore the facility.
    -   Needs intuitive navigation (Click to move).
    -   No login required.
2.  **Administrator (Pegawai/Admin):**
    -   Logs in to the backend.
    -   Uploads new 360° images.
    -   Arranges the hierarchy of areas.
    -   Publishes changes to the live site.

## 5. User Scenarios

-   **Scenario A (Public):** A user lands on the homepage, sees a map of the complex. They click "Indarung VI", select "Packer", and are immersed in a 360 view. They click an arrow to walk to the next room.
-   **Scenario B (Admin - Edit):** An admin gains access to a new restricted area. They log in, enter the Visual Editor, create a new Sub-Area "New Warehouse", upload 5 panoramic images, and link them together.
-   **Scenario C (Admin - Publish):** The admin reviews their changes in "Preview Mode". Satisfied, they click "Publish Changes", making the new warehouse visible to the public.

## 6. Functional Requirements

### 6.1 Public Tour Viewer

-   **360 Viewer:** Render equirectangular images using WebGL (Marzipano).
-   **Hotspots:** Clickable arrows to move between scenes.
-   **Info Spots:** Interactive icons that display a popup with title and description when clicked.
-   **Map:** Interactive Leaflet map showing current location and available areas.
-   **Sidebar:** Hierarchical list of areas for quick navigation.

### 6.2 Admin Visual Editor

-   **Draft System:** All edits happen in "Draft" tables. Live data is untouched until published.
-   **Hierarchy Management:** Create/Edit/Delete Areas and Sub-Areas (Drag & Drop sorting).
-   **Scene Management:** Upload images, set name, set initial heading.
-   **Link Editor:** Draw connections between scenes visually or via dropdowns.
-   **Info Spot Editor:** Add, edit, reposition, and delete informational hotspots within scenes.
-   **Map Editor:** Set GPS coordinates for areas/scenes by clicking on the map.

### 6.3 Publish Workflow

-   **Pending Changes:** View a diff of added/modified/deleted items.
-   **Publish:** Atomic commit of draft data to live tables.
-   **Discard:** Revert drafts to match current live state.

## 7. Non-Functional Requirements

-   **Performance:** 360 images should load lazily or be optimized (though currently raw uploads handled).
-   **Responsiveness:** Viewer work on Desktop and Tablet (Mobile optional but recommended).
-   **Security:** Admin routes protected by Authentication and Role checks.

## 8. Constraints

-   **Browser Support:** Modern browsers with WebGL support.
-   **Hosting:** On-Premise server (Windows/Linux).
