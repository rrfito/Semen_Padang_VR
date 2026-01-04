# Backend Documentation

## 1. Overview

The backend is built on **Laravel 11**, following the Model-View-Controller (MVC) pattern. It serves as an API for the Inertia.js frontend and manages database interactions, specifically distinguishing between "Live" and "Draft" content.

## 2. Folder Structure

-   `app/Http/Controllers/`: Contains request logic.
    -   `TourController.php`: Public facing controller. Reads from Live tables.
    -   `EditorController.php`: Admin facing controller. Reads/Writes Draft tables.
    -   `Admin/`: Sub-folder for Filament/Admin specific logic.
-   `app/Models/`: Eloquent models.
    -   Live: `Area`, `Scene`, `Link`.
    -   Draft: `AreaDraft`, `SceneDraft`, `LinkDraft`.
-   `database/migrations/`: Database schema definitions.
-   `routes/web.php`: Defines all web routes, including the Inertia app entry points.

## 3. Business Logic

### 3.1 Live vs Draft Separation

To allow safe editing without breaking the public tour, the system uses a dual-table strategy.

-   **Live Mode (Public):** The `TourController` queries `areas`, `scenes`, and `links`. These are optimized for read performance.
-   **Draft Mode (Editor):** The `EditorController` queries `area_drafts`, `scene_drafts`, etc. When an admin enters the editor, if no draft exists for an item, a clone of the Live item is created in the Draft table.

### 3.2 Publish Workflow (`publishAll`)

Located in `EditorController`.

1.  **Validation:** Checks if drafts are valid (e.g., have images).
2.  **Transaction:** Opens a DB transaction.
3.  **Sync:**
    -   New Drafts -> Insert into Live.
    -   Modified Drafts -> Update Live.
    -   Tombstoned Drafts (`marked_for_deletion`) -> Delete Live.
4.  **Cleanup:** Truncates/Cleans draft tables or marks them as synced.

### 3.3 PostGIS Integration

The project uses PostgreSQL with PostGIS extension for spatial queries (though currently basic `lat/lng` columns are used primarily).

-   `DB::statement('CREATE EXTENSION IF NOT EXISTS postgis');` is utilized in migrations.
-   `scenes` table has a `location` GEOGRAPHY column for future nearest-neighbor features.

## 4. Dependencies

-   **Strictly Required:**
    -   `php >= 8.2`
    -   `ext-pgsql` (for Database)
    -   `laravel/framework`
    -   `inertiajs/inertia-laravel`
