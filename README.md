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
  <img src="https://img.shields.io/badge/Filament-4.0-FFD700?style=for-the-badge&logo=laravel&logoColor=black" alt="Filament">
  <img src="https://img.shields.io/badge/PostGIS-Enabled-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostGIS">
</p>

---

## 📋 Daftar Isi

- [Tentang Aplikasi](#-tentang-aplikasi)
- [Fitur Utama](#-fitur-utama)
- [Tech Stack](#-tech-stack)
- [Arsitektur Database](#-arsitektur-database)
- [Struktur Project](#-struktur-project)
- [Instalasi](#-instalasi)
- [Penggunaan](#-penggunaan)
- [API Routes](#-api-routes)
- [Kontributor](#-kontributor)

---

## 🎯 Tentang Aplikasi

**Semen Padang Virtual Tour** adalah aplikasi web interaktif yang memungkinkan pengguna untuk menjelajahi area PT Semen Padang secara virtual melalui gambar panorama 360°. Aplikasi ini menggabungkan:

- **Peta Interaktif** - Navigasi lokasi berbasis Leaflet dengan marker dinamis
- **360° Viewer** - Pengalaman imersif menggunakan Marzipano
- **Hierarchical Areas** - Struktur area bertingkat (Grandparent → Parent → Child)
- **Auto-Linking** - Sistem navigasi otomatis antar scene berdasarkan GPS

---

## ✨ Fitur Utama

### 🗺️ Dashboard Peta
- Peta interaktif dengan layer control (Satellite/Street)
- Sidebar hierarkis untuk navigasi area
- Marker dinamis dengan warna berbeda (Merah untuk group, Biru untuk scene)
- Zoom dinamis berdasarkan level area

### 👀 360° Viewer
- Panorama 360° menggunakan Marzipano
- Hotspot navigasi antar scene
- Minimap lokasi saat ini
- Heading preservation untuk orientasi yang akurat
- Informasi lokasi bertingkat (Root → Child → Grandchild)

### 🔧 Admin Panel (Filament)
- CRUD management untuk Areas dan Scenes
- Bulk image upload dengan ekstraksi metadata GPS
- Drag & drop reordering untuk scenes
- Visual Editor untuk manual linking

### 🔗 Auto-Linking System
- Kalkulasi link otomatis berdasarkan jarak GPS
- Nearest-neighbor algorithm
- PostGIS untuk query spasial yang efisien

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **PHP** | ^8.2 | Language |
| **Laravel** | ^11.0 | Framework |
| **Filament** | 4.0 | Admin Panel |
| **Inertia.js** | ^2.0 | SPA Bridge |
| **PostgreSQL** | - | Database |
| **PostGIS** | - | Spatial Extension |
| **Intervention Image** | ^3.11 | Image Processing |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | ^18.2 | UI Library |
| **Vite** | ^5.0 | Build Tool |
| **Tailwind CSS** | ^3.2 | Styling |
| **Marzipano** | ^0.10.2 | 360° Viewer |
| **Leaflet** | ^1.9.4 | Interactive Maps |
| **React Leaflet** | ^4.2.1 | React Wrapper for Leaflet |
| **React Icons** | ^5.5.0 | Icon Library |

---

## 🗄️ Arsitektur Database

### Entity Relationship Diagram

```mermaid
erDiagram
    AREAS ||--o{ AREAS : "parent_id"
    AREAS ||--o{ SCENES : "has many"
    SCENES ||--o{ LINKS : "source_scene_id"
    SCENES ||--o{ LINKS : "target_scene_id"
    
    AREAS {
        bigint id PK
        bigint parent_id FK
        string name
        string slug
        text description
        string type "group | default"
        int priority
        decimal lat
        decimal lng
        boolean is_restricted
        timestamps
    }
    
    SCENES {
        bigint id PK
        bigint area_id FK
        string name
        string image_path
        string type "image | video"
        float heading
        float pitch
        float roll
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
```

### Penjelasan Tabel

#### 📁 **Areas** (Hierarchical Structure)
- Mendukung struktur parent-child untuk grouping
- **Type `group`**: Container/folder untuk sub-areas
- **Type `default`**: Area yang berisi scenes
- Koordinat `lat/lng` untuk marker di peta

#### 🖼️ **Scenes**
- Menyimpan gambar panorama 360°
- **PostGIS `location`** untuk pencarian nearest-neighbor
- `heading`, `pitch`, `roll` untuk orientasi default viewer
- `sort_order` untuk urutan tampilan

#### 🔗 **Links**
- Koneksi scene-to-scene
- **Type `navigasi`**: Link navigasi biasa
- **Type `portal`**: Link ke area lain
- `yaw`, `pitch` menentukan posisi hotspot di viewer

---

## 📂 Struktur Project

```
semen-padang-vr/
├── app/
│   ├── Filament/              # Admin Panel Resources
│   │   ├── Resources/         # CRUD Resources (Areas, Scenes)
│   │   └── Widgets/           # Dashboard Widgets
│   ├── Http/
│   │   └── Controllers/
│   │       ├── TourController.php      # Frontend Tour Logic
│   │       └── EditorController.php    # Visual Editor API
│   ├── Models/
│   │   ├── Area.php           # Hierarchical Areas
│   │   ├── Scene.php          # 360° Scenes with PostGIS
│   │   └── Link.php           # Scene Connections
│   ├── Observers/
│   │   └── SceneObserver.php  # Auto-extract GPS metadata
│   └── Jobs/
│       └── ProcessLinkAutoJob.php  # Background auto-linking
│
├── resources/js/
│   ├── Components/
│   │   └── Tour/
│   │       ├── Map.jsx           # Interactive Leaflet Map
│   │       ├── Sidebar.jsx       # Hierarchical Navigation
│   │       ├── Minimap.jsx       # Location Minimap in Viewer
│   │       └── MapLayerControl.jsx
│   ├── Pages/
│   │   └── Tour/
│   │       ├── Dashboard.jsx     # Main Map Page
│   │       └── Viewer.jsx        # 360° Panorama Viewer
│   └── Layouts/
│
├── database/
│   └── migrations/
│       └── 2025_12_11_..._virtual_tour_schema_consolidated.php
│
├── routes/
│   └── web.php                # Route Definitions
│
└── public/
    └── storage/               # Uploaded Panorama Images
```

---

## 🚀 Instalasi

### Prerequisites
- PHP >= 8.2
- Composer
- Node.js >= 18
- PostgreSQL dengan extension PostGIS
- npm atau yarn

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

Untuk auto-linking yang berjalan di background:

```bash
php artisan queue:work
```

---

## 📖 Penggunaan

### Akses Aplikasi

| URL | Deskripsi |
|-----|-----------|
| `/` | Dashboard Peta Utama |
| `/tour/{scene}` | 360° Viewer |
| `/admin` | Admin Panel (Filament) |
| `/dashboard` | User Dashboard (after login) |

### Workflow Umum

1. **Admin Login** → Akses `/admin`
2. **Buat Area** → Pilih type `group` untuk folder, `default` untuk scene container
3. **Upload Scenes** → Bulk upload dengan ekstraksi GPS otomatis
4. **Auto-Link** → Jalankan auto-linking untuk membuat navigasi
5. **Preview** → Akses `/` untuk melihat hasil

---

## 🛣️ API Routes

### Public Routes
| Method | Route | Controller | Description |
|--------|-------|------------|-------------|
| GET | `/` | `TourController@index` | Dashboard Map |
| GET | `/tour/{scene}` | `TourController@show` | 360° Viewer |

### Authenticated Routes
| Method | Route | Controller | Description |
|--------|-------|------------|-------------|
| GET | `/dashboard` | - | User Dashboard |
| GET/PATCH/DELETE | `/profile` | `ProfileController` | Profile Management |

### Admin Editor Routes
| Method | Route | Controller | Description |
|--------|-------|------------|-------------|
| GET | `/admin/editor/{area}` | `EditorController@edit` | Visual Editor |
| POST | `/admin/editor/link` | `EditorController@saveLink` | Save Link |
| DELETE | `/admin/editor/link/{link}` | `EditorController@deleteLink` | Delete Link |
| POST | `/admin/editor/location` | `EditorController@updateLocation` | Update Scene Location |
| POST | `/admin/editor/{area}/autolink` | `EditorController@autoLink` | Run Auto-Link |
| POST | `/admin/editor/{area}/save-batch` | `EditorController@sync` | Batch Save |

---

