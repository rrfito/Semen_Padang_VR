<p align="center">
  <img src="public/favicon.ico" width="100" alt="Semen Padang VR Logo">
</p>

<h1 align="center">🏭 Semen Padang Virtual Tour</h1>

<p align="center">
  <b>Aplikasi Virtual Tour 360° Interaktif untuk PT Semen Padang</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Laravel-11.x-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel">
  <img src="https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Inertia.js-2.x-9553E9?style=for-the-badge&logo=inertia&logoColor=white" alt="Inertia.js">
  <img src="https://img.shields.io/badge/PostGIS-Enabled-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostGIS">
</p>

---

## 📋 Daftar Isi

-   [Tentang Aplikasi](#-tentang-aplikasi)
-   [Fitur Utama](#-fitur-utama)
-   [Tech Stack](#️-tech-stack)
-   [Arsitektur Sistem](#-arsitektur-sistem)
-   [Arsitektur Database](#️-arsitektur-database)
-   [Struktur Project](#-struktur-project)
-   [Instalasi](#-instalasi)
-   [Penggunaan](#-penggunaan)
-   [API Routes](#️-api-routes)

---

## 🎯 Tentang Aplikasi

**Semen Padang Virtual Tour** adalah aplikasi web interaktif yang memungkinkan pengguna untuk menjelajahi area PT Semen Padang secara virtual melalui gambar panorama 360°. Aplikasi ini menggabungkan:

-   **Peta Interaktif** - Navigasi lokasi berbasis Leaflet dengan marker dinamis dan layer control
-   **360° Viewer** - Pengalaman imersif menggunakan Marzipano dengan hotspot navigasi
-   **Hierarchical Areas** - Struktur area bertingkat (Level 1 → Level 2 → Level 3+)
-   **Visual Editor** - Admin panel berbasis React untuk manajemen konten
-   **Draft & Publish Workflow** - Sistem review perubahan sebelum dipublikasikan
-   **Auto-Linking** - Sistem navigasi otomatis antar scene berdasarkan GPS proximity

---

## ✨ Fitur Utama

### 🗺️ Public Tour Viewer

#### Dashboard Peta

-   Peta interaktif dengan layer control (Satellite/Street/Terrain)
-   Sidebar hierarkis untuk navigasi area dengan status labels
-   Marker dinamis dengan warna berbeda per level area
-   Zoom dinamis berdasarkan level konten yang dipilih
-   Gesture hints untuk panduan interaksi

#### 360° Panorama Viewer

-   Panorama 360° menggunakan Marzipano
-   Hotspot navigasi antar scene (tipe navigasi & portal)
-   Minimap lokasi saat ini terintegrasi
-   Heading preservation untuk orientasi yang akurat
-   Informasi lokasi bertingkat (Level 1 → Level 2 → Level 3)

#### Interactive Guided Tour

-   Tour panduan interaktif menggunakan Driver.js
-   Langkah-langkah step-by-step untuk pengguna baru
-   Highlight elemen UI dengan penjelasan

---

### 🔧 Admin Visual Editor

#### Area Management

-   Create, Read, Update, Delete (CRUD) untuk Areas
-   Struktur hierarki multi-level dengan drag & drop reordering
-   Support untuk `is_restricted` (area terbatas) dan `is_hidden` (area tersembunyi)
-   GPS coordinate picker via interactive map modal
-   Kalkulasi deletion impact sebelum penghapusan

#### Scene Management

-   Bulk image upload dengan ekstraksi metadata GPS otomatis
-   Scene viewer terintegrasi langsung di editor
-   Pengaturan default heading, pitch, dan FOV
-   Scene reordering dalam area

#### Hotspot/Link Editor

-   Visual link editor dengan real-time preview
-   Tipe link: `navigasi` (dalam area) dan `portal` (antar area)
-   Koordinat yaw/pitch untuk posisi hotspot
-   Auto-linking berdasarkan proximity GPS (PostGIS)

#### Draft & Publish Workflow

| Mode        | Deskripsi                                                               |
| ----------- | ----------------------------------------------------------------------- |
| **Draft**   | Semua perubahan tersimpan di draft tables, tidak mempengaruhi live data |
| **Review**  | Lihat pending changes (Added/Modified/Deleted) sebelum publish          |
| **Publish** | Atomic commit dari draft ke live tables                                 |
| **Discard** | Revert semua draft changes ke state live saat ini                       |

---

### 👤 User Management

#### Authentication & Authorization

-   Role-based access control (Admin, User, Pending)
-   User approval workflow untuk registrasi baru
-   Admin dapat approve/reject pending users
-   Live role switching dengan dropdown di admin panel

#### User Roles

| Role        | Akses                                          |
| ----------- | ---------------------------------------------- |
| **admin**   | Full access ke Visual Editor & User Management |
| **user**    | View-only access ke public tour                |
| **pending** | Menunggu approval dari Admin                   |

---

## 🛠️ Tech Stack

### Backend

| Technology             | Version | Purpose                    |
| ---------------------- | ------- | -------------------------- |
| **PHP**                | ^8.2    | Language                   |
| **Laravel**            | ^11.0   | Framework                  |
| **Inertia.js**         | ^2.0    | SPA Bridge                 |
| **PostgreSQL**         | -       | Database                   |
| **PostGIS**            | -       | Spatial Extension          |
| **Intervention Image** | ^3.11   | Image Processing           |
| **Laravel Breeze**     | -       | Authentication Scaffolding |

### Frontend

| Technology        | Version | Purpose                   |
| ----------------- | ------- | ------------------------- |
| **React**         | ^18.2   | UI Library                |
| **Vite**          | ^5.0    | Build Tool                |
| **Tailwind CSS**  | ^3.2    | Styling                   |
| **Marzipano**     | ^0.10.2 | 360° Viewer               |
| **Leaflet**       | ^1.9.4  | Interactive Maps          |
| **React Leaflet** | ^4.2.1  | React Wrapper for Leaflet |
| **React Icons**   | ^5.5.0  | Icon Library              |
| **Driver.js**     | ^1.4.0  | Guided Tours              |
| **@dnd-kit**      | ^6.3.1  | Drag & Drop               |
| **HeadlessUI**    | ^2.0.0  | Accessible Components     |
| **Axios**         | ^1.6.4  | HTTP Client               |

---

## 🏛️ Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                │
├──────────────────────────────┬──────────────────────────────────────────┤
│    Public Tour Viewer        │         Admin Visual Editor              │
│  ┌─────────────────────────┐ │  ┌────────────────────────────────────┐  │
│  │ Dashboard (Map+Sidebar) │ │  │ Visual Editor (Full React SPA)    │  │
│  │ 360° Viewer (Marzipano) │ │  │ - Area/Scene/Link Management      │  │
│  │ Minimap & Hotspots      │ │  │ - Draft/Publish Workflow          │  │
│  │ Guided Tour (Driver.js) │ │  │ - Map Picker Modal                │  │
│  └─────────────────────────┘ │  │ - User Management                 │  │
│                              │  └────────────────────────────────────┘  │
└──────────────────────────────┴──────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           APPLICATION LAYER                              │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────────────┐  │
│  │ TourController  │  │ EditorController │  │ UserManagement         │  │
│  │                 │  │                  │  │ Controller             │  │
│  │ - index()       │  │ - CRUD Area      │  │                        │  │
│  │ - show()        │  │ - CRUD Scene     │  │ - approve/reject       │  │
│  │                 │  │ - CRUD Link      │  │ - updateRole           │  │
│  │                 │  │ - Publish/Discard│  │                        │  │
│  └─────────────────┘  └──────────────────┘  └────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            SERVICE LAYER                                 │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────────────┐    │
│  │ DraftService   │  │ PublishService │  │ AutoLinkService         │    │
│  │ - sync drafts  │  │ - atomic push  │  │ - GPS proximity calc    │    │
│  │ - track changes│  │ - live tables  │  │ - nearest-neighbor algo │    │
│  └────────────────┘  └────────────────┘  └─────────────────────────┘    │
│  ┌────────────────┐  ┌────────────────────────────────────────────┐     │
│  │ GeoService     │  │ SceneImageService                          │     │
│  │ - PostGIS ops  │  │ - GPS metadata extraction                  │     │
│  │ - spatial query│  │ - Image processing                         │     │
│  └────────────────┘  └────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                             DATA LAYER                                   │
│  ┌─────────────────────────────┐  ┌──────────────────────────────────┐  │
│  │      LIVE TABLES            │  │        DRAFT TABLES              │  │
│  │  ┌───────┐ ┌───────┐        │  │  ┌───────────┐ ┌─────────────┐   │  │
│  │  │ areas │ │ scenes│        │  │  │area_drafts│ │scene_drafts │   │  │
│  │  └───────┘ └───────┘        │  │  └───────────┘ └─────────────┘   │  │
│  │  ┌───────┐ ┌───────┐        │  │  ┌───────────┐ ┌─────────────┐   │  │
│  │  │ links │ │ users │        │  │  │link_drafts│ │draft_sync   │   │  │
│  │  └───────┘ └───────┘        │  │  └───────────┘ │   _states   │   │  │
│  │                             │  │                └─────────────┘   │  │
│  └─────────────────────────────┘  └──────────────────────────────────┘  │
│                        PostgreSQL + PostGIS                              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Arsitektur Database

### Entity Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ AREAS : "manages"
    AREAS ||--o{ AREAS : "parent_id"
    AREAS ||--o{ SCENES : "has many"
    SCENES ||--o{ LINKS : "source_scene_id"
    SCENES ||--o{ LINKS : "target_scene_id"

    %% Draft Tables
    AREA_DRAFTS ||--o{ AREA_DRAFTS : "parent_draft_id"
    AREA_DRAFTS ||--o{ SCENE_DRAFTS : "has many"
    SCENE_DRAFTS ||--o{ LINK_DRAFTS : "source"
    SCENE_DRAFTS ||--o{ LINK_DRAFTS : "target"
    DRAFT_SYNC_STATES ||--o{ AREA_DRAFTS : "tracks"

    USERS {
        bigint id PK
        string name
        string email
        string password
        enum role "admin | user | pending"
        enum status "active | pending | rejected"
        timestamp email_verified_at
        timestamps
    }

    AREAS {
        bigint id PK
        bigint parent_id FK
        string name
        string slug
        text description
        int priority
        decimal lat
        decimal lng
        boolean is_restricted
        boolean is_hidden
        timestamps
    }

    SCENES {
        bigint id PK
        bigint area_id FK
        string name
        string image_path
        float heading
        float pitch
        float hfov
        int sort_order
        boolean is_restricted
        geography location "PostGIS POINT"
        timestamps
    }

    LINKS {
        bigint id PK
        bigint source_scene_id FK
        bigint target_scene_id FK
        string type "navigasi | portal"
        double yaw
        double pitch
        timestamps
    }

    AREA_DRAFTS {
        bigint id PK
        bigint live_id FK "nullable"
        bigint parent_draft_id FK
        string name
        text description
        int priority
        decimal lat
        decimal lng
        boolean is_restricted
        boolean is_hidden
        boolean is_deleted
        timestamps
    }

    SCENE_DRAFTS {
        bigint id PK
        bigint live_id FK "nullable"
        bigint area_draft_id FK
        string name
        string image_path
        float heading
        float pitch
        int sort_order
        boolean is_deleted
        geography location
        timestamps
    }

    LINK_DRAFTS {
        bigint id PK
        bigint live_id FK "nullable"
        bigint source_scene_draft_id FK
        bigint target_scene_draft_id FK
        string type
        double yaw
        double pitch
        boolean is_deleted
        timestamps
    }

    DRAFT_SYNC_STATES {
        bigint id PK
        bigint root_draft_id FK
        string live_checksum "nullable"
        timestamps
    }
```

### Penjelasan Tabel

#### 📁 **Areas** (Hierarchical Structure)

-   Mendukung struktur parent-child untuk grouping multi-level
-   Koordinat `lat/lng` untuk marker di peta
-   `is_restricted`: Area yang memerlukan izin khusus
-   `is_hidden`: Area yang tidak ditampilkan di public tour
-   `priority`: Urutan tampilan dalam level yang sama

#### 🖼️ **Scenes**

-   Menyimpan gambar panorama 360°
-   **PostGIS `location`** untuk pencarian nearest-neighbor
-   `heading`, `pitch` untuk orientasi default viewer
-   `hfov` (horizontal field of view) untuk zoom level
-   `sort_order` untuk urutan tampilan dalam area

#### 🔗 **Links**

-   Koneksi scene-to-scene
-   **Type `navigasi`**: Link navigasi dalam area yang sama
-   **Type `portal`**: Link ke area lain (cross-area navigation)
-   `yaw`, `pitch` menentukan posisi hotspot di viewer

#### 📝 **Draft Tables**

-   Mirror structure dari live tables dengan tambahan `is_deleted` flag
-   `live_id`: Referensi ke record live untuk tracking perubahan
-   `draft_sync_states`: Tracking checksum untuk detect changes

---

## 📂 Struktur Project

```
semen-padang-vr/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Admin/
│   │   │   │   ├── AdminDashboardController.php  # Admin home
│   │   │   │   └── UserManagementController.php  # User CRUD & roles
│   │   │   ├── TourController.php                # Public tour logic
│   │   │   └── EditorController.php              # Visual Editor API (20+ endpoints)
│   │   └── Middleware/
│   │       └── EnsureUserIsAdmin.php             # Admin route protection
│   ├── Models/
│   │   ├── Area.php                              # Hierarchical areas
│   │   ├── Scene.php                             # 360° scenes with PostGIS
│   │   ├── Link.php                              # Scene connections
│   │   ├── User.php                              # User with roles
│   │   └── Drafts/
│   │       ├── AreaDraft.php                     # Draft area changes
│   │       ├── SceneDraft.php                    # Draft scene changes
│   │       ├── LinkDraft.php                     # Draft link changes
│   │       └── DraftSyncState.php                # Change tracking
│   ├── Services/
│   │   ├── DraftService.php                      # Draft CRUD operations
│   │   ├── PublishService.php                    # Atomic publish to live
│   │   ├── AutoLinkService.php                   # GPS-based auto-linking
│   │   ├── GeoService.php                        # PostGIS operations
│   │   └── SceneImageService.php                 # Image & GPS extraction
│   └── Jobs/
│       └── ProcessSceneImage.php                 # Background image processing
│
├── resources/js/
│   ├── Components/
│   │   ├── Tour/                                 # Public tour components
│   │   │   ├── Map.jsx                           # Interactive Leaflet map
│   │   │   ├── Sidebar.jsx                       # Hierarchical navigation
│   │   │   ├── SecondarySidebar.jsx              # Area detail panel
│   │   │   ├── Minimap.jsx                       # Location minimap in viewer
│   │   │   ├── MapLayerControl.jsx               # Map layer switcher
│   │   │   └── GestureHint.jsx                   # Interaction hints
│   │   ├── Editor/                               # Reusable editor components
│   │   │   ├── MapPickerModal.jsx                # GPS coordinate picker
│   │   │   ├── ConfirmModal.jsx                  # Confirmation dialogs
│   │   │   ├── NotificationModal.jsx             # Status notifications
│   │   │   ├── FormInput.jsx                     # Themed form input
│   │   │   ├── FormTextarea.jsx                  # Themed textarea
│   │   │   └── ToolbarButton.jsx                 # Toolbar button component
│   │   └── Admin/                                # Admin panel components
│   │       ├── AdminSidebar.jsx                  # Admin navigation sidebar
│   │       ├── UserManagementTable.jsx           # User list with actions
│   │       └── ...
│   ├── Pages/
│   │   ├── Tour/
│   │   │   ├── Dashboard.jsx                     # Main map page
│   │   │   └── Viewer.jsx                        # 360° panorama viewer
│   │   ├── Editor/
│   │   │   ├── VisualEditor.jsx                  # Main editor SPA (49KB+)
│   │   │   ├── Views/
│   │   │   │   ├── WelcomeView.jsx               # Editor landing view
│   │   │   │   ├── AreaOverviewView.jsx          # Area detail panel
│   │   │   │   ├── SceneContainerView.jsx        # Scene list view
│   │   │   │   └── SceneView.jsx                 # Scene editor with 360 preview
│   │   │   ├── Modals/
│   │   │   │   ├── CreateAreaModal.jsx           # New area form
│   │   │   │   ├── PendingChangesModal.jsx       # Review changes
│   │   │   │   └── ...
│   │   │   └── Partials/
│   │   │       ├── Sidebar.jsx                   # Editor hierarchy sidebar
│   │   │       └── ...
│   │   ├── Admin/
│   │   │   ├── Dashboard.jsx                     # Admin dashboard
│   │   │   └── UserManagement.jsx                # User management page
│   │   └── Auth/
│   │       ├── Login.jsx                         # Login page
│   │       ├── Register.jsx                      # Registration page
│   │       └── ApprovalPending.jsx               # Pending approval notice
│   ├── Config/
│   │   └── MAP_CONFIG.js                         # Centralized map settings
│   ├── Contexts/
│   │   └── EditorStateContext.jsx                # Global editor state
│   ├── Hooks/
│   │   └── useEditorState.js                     # Editor state hook
│   └── Layouts/
│       └── Editor/
│           └── EditorLayout.jsx                  # Editor page layout
│
├── database/
│   └── migrations/
│       ├── 2025_12_11_000000_create_live_table.php        # Core tables
│       ├── 2025_12_23_073108_create_draft_tables.php      # Draft system
│       ├── 2026_01_02_085259_add_status_to_users_table.php # User status
│       └── 2026_01_05_220000_add_is_hidden_to_areas_table.php # Hidden areas
│
├── routes/
│   ├── web.php                                   # Main route definitions
│   └── auth.php                                  # Authentication routes
│
├── public/
│   └── storage/                                  # Uploaded panorama images
│
└── docs/
    └── prd.md                                    # Product Requirements Document
```

---

## 🚀 Instalasi

### Prerequisites

-   PHP >= 8.2 dengan extensions: `pdo_pgsql`, `gd`, `exif`
-   Composer
-   Node.js >= 18
-   PostgreSQL dengan extension PostGIS
-   npm atau yarn

### Langkah Instalasi

```bash
# 1. Clone repository
git clone <repository-url>
cd semen-padang-vr

# 2. Install PHP dependencies
composer install

# 3. Install Node dependencies
npm install

# 4. Copy environment file
cp .env.example .env

# 5. Generate application key
php artisan key:generate

# 6. Konfigurasi database di .env
# Pastikan menggunakan PostgreSQL dengan PostGIS
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=semen_padang_vr
DB_USERNAME=your_username
DB_PASSWORD=your_password

# 7. Jalankan migrasi database
php artisan migrate

# 8. Create storage link
php artisan storage:link

# 9. Build assets (development)
npm run dev

# 10. Jalankan server
php artisan serve
```

### Menjalankan Queue Worker

Untuk background image processing dan auto-linking:

```bash
php artisan queue:work
```

### Development Mode

Untuk development dengan hot-reload, jalankan di terminal terpisah:

```bash
# Terminal 1: Vite dev server
npm run dev

# Terminal 2: Laravel server
php artisan serve

# Terminal 3: Queue worker
php artisan queue:work
```

### Production Build

```bash
# Build optimized assets
npm run build

# Optimize Laravel
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## 📖 Penggunaan

### Akses Aplikasi

| URL                     | Deskripsi                          | Auth Required |
| ----------------------- | ---------------------------------- | ------------- |
| `/`                     | Dashboard Peta Utama (Public Tour) | ❌            |
| `/tour/{scene}`         | 360° Panorama Viewer               | ❌            |
| `/admin`                | Admin Dashboard                    | ✅ Admin      |
| `/admin/visual-editor`  | Visual Editor                      | ✅ Admin      |
| `/admin/UserManagement` | User Management                    | ✅ Admin      |
| `/login`                | Halaman Login                      | ❌            |
| `/register`             | Halaman Registrasi                 | ❌            |
| `/profile`              | Edit Profile                       | ✅ Any        |

### Workflow Admin

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   CREATE    │────▶│    EDIT     │────▶│   REVIEW    │────▶│   PUBLISH   │
│             │     │             │     │             │     │             │
│ - New Area  │     │ - Modify    │     │ - View Diff │     │ - Go Live   │
│ - Upload    │     │ - Add Links │     │ - Validate  │     │ - Atomic    │
│   Scenes    │     │ - Set GPS   │     │             │     │   Commit    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                                                            │
       │                    ┌─────────────┐                         │
       └───────────────────▶│   DISCARD   │◀────────────────────────┘
                            │             │
                            │ - Revert    │
                            │ - Reset to  │
                            │   Live      │
                            └─────────────┘
```

### Langkah-Langkah

1. **Login sebagai Admin** → Akses `/admin`
2. **Buka Visual Editor** → Klik "Visual Editor" di sidebar
3. **Buat Area Baru** → Klik tombol "+" di sidebar hierarchy
4. **Upload Scenes** → Pilih area, klik "Upload Images", drag & drop gambar 360°
5. **Edit Scene** → Klik scene untuk membuka 360° preview dan link editor
6. **Tambah Hotspot** → Klik "Tambah Hotspot" dan pilih target scene
7. **Review Changes** → Klik "Pending Changes" untuk melihat diff
8. **Publish** → Klik "Publish All" untuk commit ke live
9. **Verify** → Akses `/` untuk melihat hasil di public tour

---

## 🛣️ API Routes

### Public Routes

| Method | Route           | Controller             | Description   |
| ------ | --------------- | ---------------------- | ------------- |
| GET    | `/`             | `TourController@index` | Dashboard Map |
| GET    | `/tour/{scene}` | `TourController@show`  | 360° Viewer   |

### Authentication Routes

| Method | Route               | Description             |
| ------ | ------------------- | ----------------------- |
| GET    | `/login`            | Login Page              |
| POST   | `/login`            | Process Login           |
| POST   | `/logout`           | Logout                  |
| GET    | `/register`         | Registration Page       |
| POST   | `/register`         | Process Registration    |
| GET    | `/approval-pending` | Approval Pending Notice |

### Profile Routes (Authenticated)

| Method | Route      | Controller                  | Description    |
| ------ | ---------- | --------------------------- | -------------- |
| GET    | `/profile` | `ProfileController@edit`    | Edit Profile   |
| PATCH  | `/profile` | `ProfileController@update`  | Update Profile |
| DELETE | `/profile` | `ProfileController@destroy` | Delete Account |

### Admin Dashboard Routes

| Method | Route                                  | Controller                            | Description  |
| ------ | -------------------------------------- | ------------------------------------- | ------------ |
| GET    | `/admin/dashboard`                     | `AdminDashboardController@index`      | Admin Home   |
| GET    | `/admin/UserManagement`                | `UserManagementController@index`      | User List    |
| PUT    | `/admin/UserManagement/{user}/role`    | `UserManagementController@updateRole` | Change Role  |
| POST   | `/admin/UserManagement/{user}/approve` | `UserManagementController@approve`    | Approve User |
| POST   | `/admin/UserManagement/{user}/reject`  | `UserManagementController@reject`     | Reject User  |

### Visual Editor API Routes

| Method               | Route                                                | Controller                           | Description         |
| -------------------- | ---------------------------------------------------- | ------------------------------------ | ------------------- |
| GET                  | `/admin/visual-editor`                               | `EditorController@index`             | Editor Page         |
| **Area Management**  |                                                      |                                      |
| POST                 | `/admin/visual-editor/api/sub-area`                  | `EditorController@createSubArea`     | Create Area         |
| GET                  | `/admin/visual-editor/api/area/{id}`                 | `EditorController@showArea`          | Get Area Details    |
| PATCH                | `/admin/visual-editor/api/area/{id}`                 | `EditorController@updateArea`        | Update Area         |
| DELETE               | `/admin/visual-editor/api/area/{id}`                 | `EditorController@destroyArea`       | Delete Area         |
| GET                  | `/admin/visual-editor/api/area/{id}/deletion-impact` | `EditorController@getDeletionImpact` | Check Delete Impact |
| **Scene Management** |                                                      |                                      |
| POST                 | `/admin/visual-editor/api/scenes/bulk-upload`        | `EditorController@bulkUploadScenes`  | Bulk Upload         |
| GET                  | `/admin/visual-editor/api/scene/{id}`                | `EditorController@showScene`         | Get Scene Details   |
| PATCH                | `/admin/visual-editor/api/scene/{id}`                | `EditorController@updateScene`       | Update Scene        |
| DELETE               | `/admin/visual-editor/api/scene/{id}`                | `EditorController@destroyScene`      | Delete Scene        |
| **Link Management**  |                                                      |                                      |
| POST                 | `/admin/visual-editor/api/scene/{id}/link`           | `EditorController@createLink`        | Create Link         |
| PATCH                | `/admin/visual-editor/api/scene/{id}/link/{linkId}`  | `EditorController@updateLink`        | Update Link         |
| DELETE               | `/admin/visual-editor/api/scene/{id}/link/{linkId}`  | `EditorController@deleteLink`        | Delete Link         |
| **Publish Workflow** |                                                      |                                      |
| GET                  | `/admin/visual-editor/api/pending-changes`           | `EditorController@getPendingChanges` | Get Changes Diff    |
| POST                 | `/admin/visual-editor/api/publish-all`               | `EditorController@publishAll`        | Publish All         |
| POST                 | `/admin/visual-editor/api/discard-all/{rootDraftId}` | `EditorController@discardDrafts`     | Discard Changes     |
| **Utilities**        |                                                      |                                      |
| POST                 | `/admin/visual-editor/api/{type}/{id}/reorder`       | `EditorController@reorderNode`       | Reorder Item        |
| POST                 | `/admin/visual-editor/api/autolink/execute`          | `EditorController@autoLinkExecute`   | Run Auto-Link       |

---

## 📄 Lisensi

Proyek ini dikembangkan untuk PT Semen Padang. Seluruh hak cipta dilindungi.

---

<p align="center">
  <i>Dikembangkan dengan ❤️ untuk PT Semen Padang</i>
</p>
