# System Architecture

## 1. High-Level Diagram

```mermaid
graph TD
    User[Public User] -->|HTTPS| Web[Nginx/Apache]
    Admin[Administrator] -->|HTTPS| Web

    Web -->|Request| Laravel[Laravel 11 App]

    subgraph "Application Server"
        Laravel -->|Auth Check| Middleware
        Laravel -->|Data Fetch| Controllers
        Controllers -->|Read/Write| Postgres[(PostgreSQL DB)]
        Controllers -->|Files| Storage[Local/S3 Storage]
    end

    subgraph "Frontend Client"
        Browser[Browser] -->|Render| React[React SPA]
        React -->|Map Tiles| OSM[OpenStreetMap / Google]
        React -->|3D Render| Marzipano
        React -->|API Calls| Inertia[Inertia Adaptor]
    end

    Laravel -->|JSON/Props| Inertia
    Inertia -->|Hydrate| React
```

## 2. Tech Stack

| Layer         | Technology            | Description                          |
| :------------ | :-------------------- | :----------------------------------- |
| **Frontend**  | React 18              | Component Library & State Management |
| **Logic**     | Inertia.js            | Monolith-to-SPA scaffolding          |
| **Styling**   | TailwindCSS           | Utility framework                    |
| **3D Engine** | Marzipano             | Lightweight 360 viewer               |
| **Maps**      | Leaflet               | Map rendering                        |
| **Backend**   | PHP 8.2+ / Laravel 11 | Core Framework                       |
| **Database**  | PostgreSQL 14+        | Relational Data + PostGIS Extension  |
| **Server**    | Nginx/Apache          | Web Server                           |

## 3. Data Flow

1.  **Request:** User hits `/tour/1`.
2.  **Routing:** Laravel `web.php` routes to `TourController@show`.
3.  **Controller:** Eloquent fetches Scene ID 1, its parent Area, and adjacent Links.
4.  **Response:** Controller returns `Inertia::render('Tour/Viewer', [data])`.
5.  **Frontend:** React hydrates the page. `Viewer.jsx` initializes 3D canvas with the image path provided in props.

## 4. Editing Workflow (Draft System)

To ensure system stability, the architecture implements a **Command Query Responsibility Segregation (CQRS) lite** approach for editing.

-   **Reads (Public):** Direct access to optimized tables.
-   **Writes (Admin):** All writes go to shadow "Draft" tables.
-   **Synchronize:** A specific "Publish" command migrates data from Draft to Live in a single database transaction.
