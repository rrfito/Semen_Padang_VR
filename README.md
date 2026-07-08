<p align="center">
  <img src="docs/image_repo.png" alt="Semen Padang VR">
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

## 🎯 Tentang Aplikasi

**Semen Padang Virtual Tour** adalah aplikasi web interaktif yang memungkinkan pengguna untuk menjelajahi area PT Semen Padang secara virtual melalui gambar panorama 360°. Aplikasi ini menggabungkan:

- **Peta Interaktif** - Navigasi lokasi berbasis Leaflet dengan penanda dinamis dan kontrol *layer*.
- **360° Viewer** - Pengalaman imersif menggunakan Marzipano dengan navigasi *hotspot*.
- **Hierarchical Areas** - Struktur area bertingkat (Level 1 → Level 2 → Level 3+).
- **Visual Editor** - Panel admin berbasis React untuk kemudahan manajemen konten.
- **Draft & Publish Workflow** - Sistem peninjauan (*review*) perubahan sebelum dipublikasikan.
- **Auto-Linking** - Sistem navigasi otomatis antar *scene* berdasarkan kedekatan jarak GPS.

---

## 📋 Daftar Isi

- [Tentang Aplikasi](#-tentang-aplikasi)
- [Persyaratan Sistem (Prerequisites)](#-persyaratan-sistem-prerequisites)
- [Instalasi Lokal (Development)](#-instalasi-lokal-development)
- [Deployment (Production)](#-deployment-production)
- [Pengaturan Akun Admin](#-pengaturan-akun-admin)
- [Pemecahan Masalah (Troubleshooting)](#-pemecahan-masalah-troubleshooting)

---

## 💻 Persyaratan Sistem (Prerequisites)

| Software       | Versi Minimum | Catatan                                                               |
| -------------- | ------------- | --------------------------------------------------------------------- |
| **PHP**        | `>= 8.2`      | Ekstensi wajib: `pdo_pgsql`, `pgsql`, `gd`, `exif`, `mbstring`, `xml` |
| **Composer**   | `>= 2.x`      | PHP package manager                                                   |
| **Node.js**    | `>= 18.x`     | Disarankan menggunakan versi LTS                                      |
| **npm**        | `>= 9.x`      | Biasanya sudah sepaket dengan Node.js                                 |
| **PostgreSQL** | `>= 13.x`     | Database utama                                                        |
| **PostGIS**    | `>= 3.x`      | Ekstensi spasial untuk PostgreSQL **(WAJIB)**                         |

---

## 🛠 Instalasi Lokal (Development)

### 1. Ekstrak dan Masuk ke Folder Project

```bash
unzip semen-padang-vr.zip
cd semen-padang-vr
```

### 2. Install Dependencies

```bash
composer install
npm install
```

### 3. Konfigurasi Environment

Salin file `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Edit file `.env` dan sesuaikan konfigurasi database Anda:

```ini
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=semen_padang_vr
DB_USERNAME=postgres
DB_PASSWORD=password_anda
```

### 4. Buat Database dengan PostGIS

Jalankan perintah berikut pada terminal PostgreSQL (`psql`) atau PGAdmin:

```sql
CREATE DATABASE semen_padang_vr;
\c semen_padang_vr
CREATE EXTENSION IF NOT EXISTS postgis;
```

### 5. Setup Aplikasi

Setelah konfigurasi database selesai, jalankan perintah-perintah berikut:

```bash
# Generate application key
php artisan key:generate

# Migrasi tabel database
php artisan migrate

# Buat symbolic link untuk akses file media (gambar/panorama)
php artisan storage:link
```

### 6. Jalankan Aplikasi

Buka **3 terminal terpisah** dan jalankan perintah berikut secara bersamaan:

| Terminal | Perintah                 | Fungsi                   |
| -------- | ------------------------ | ------------------------ |
| **1**    | `npm run dev`            | Menjalankan Frontend server (Vite) |
| **2**    | `php artisan serve`      | Menjalankan Backend server (Laravel) |
| **3**    | `php artisan queue:work` | Memproses background job (Queue) |

> [!IMPORTANT]
> **Terminal 3 WAJIB DIJALANKAN!** Tanpa adanya *queue worker*, proses *upload* gambar panorama tidak akan berfungsi karena sistem memproses gambar di *background*.

### 7. Akses Aplikasi

Buka browser dan kunjungi: **http://127.0.0.1:8000**

---

## 🚀 Deployment (Production)

### 1. Konfigurasi Environment

Edit `.env` dan sesuaikan untuk environment *production*:

```ini
APP_ENV=production
APP_DEBUG=false
APP_URL=https://domainanda.com

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=semen_padang_vr
DB_USERNAME=user_database_anda
DB_PASSWORD=password_kuat_anda
```

### 2. Build & Optimasi

```bash
# Build frontend aset
npm run build

# Optimasi konfigurasi Laravel
php artisan config:cache
php artisan route:cache
php artisan view:cache
composer install --optimize-autoloader --no-dev
```

### 3. Konfigurasi Nginx

Contoh konfigurasi *virtual host* Nginx:

```nginx
server {
    listen 80;
    server_name domainanda.com;
    root /var/www/semen-padang-vr/public;

    index index.php;
    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

### 4. Setup Queue Worker (menggunakan Supervisor)

Buat file konfigurasi baru `/etc/supervisor/conf.d/semen-padang-worker.conf`:

```ini
[program:semen-padang-worker]
command=php /var/www/semen-padang-vr/artisan queue:work --sleep=3 --tries=3
autostart=true
autorestart=true
user=www-data
redirect_stderr=true
stdout_logfile=/var/www/semen-padang-vr/storage/logs/worker.log
```

Kemudian, aktifkan supervisor:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start semen-padang-worker:*
```

### 5. Set Permissions (Hak Akses)

Berikan hak akses yang sesuai untuk folder *storage* dan *cache*:

```bash
sudo chown -R www-data:www-data /var/www/semen-padang-vr
sudo chmod -R 775 /var/www/semen-padang-vr/storage
sudo chmod -R 775 /var/www/semen-padang-vr/bootstrap/cache
```

---

## 📊 Visualisasi Sistem (UML & Diagram)

Berikut adalah diagram-diagram arsitektur dan alur kerja aplikasi untuk memberikan gambaran menyeluruh terhadap sistem Semen Padang Virtual Tour:

<details open>
<summary><b>1. Flowchart Sistem Terintegrasi</b></summary>

![Flowchart](docs/erd.png)

</details>

<details open>
<summary><b>2. Use Case Diagram</b></summary>

Diagram ini memperlihatkan pemisahan akses fitur berdasarkan peran/role (Guest, Pegawai, Admin, Super Admin).

![Use Case Diagram](docs/Use%20case%20diagram.png)

</details>

<details>
<summary><b>3. Class Diagram (Arsitektur MVC & Service)</b></summary>

Diagram ini menunjukkan bagaimana pemisahan *Live Models* dan *Draft Models* dikelola menggunakan *Service Class* dalam pola MVC (*Model-View-Controller*).

```mermaid
classDiagram
    class TourController {
        +index(Request $request) View
        +show(Scene $scene) View
    }

    class EditorController {
        -DraftService draftService
        -PublishService publishService
        -AutoLinkService autoLinkService
        -GeoService geoService
        +index(Request $request) View
        +publishAll() JSON
    }

    class DraftService {
        +initDrafts(Area $rootLiveArea) AreaDraft
        +markDirty(Model $node) void
        +getPendingChanges(AreaDraft $root) array
    }

    class PublishService {
        +publish(AreaDraft $rootDraft, User $publisher) bool
        -verifyDraftIntegrity(AreaDraft $root) bool
    }

    class Model {
        <<Eloquent ORM>>
    }

    class Area {
        +int id
        +bool is_container
        +parent() BelongsTo
        +scenes() HasMany
    }

    class AreaDraft {
        +int published_id
        +bool marked_for_deletion
        +syncState() HasOne
    }

    Area --|> Model
    AreaDraft --|> Model
    TourController ..> Area : queries
    EditorController --> DraftService : uses
    EditorController --> PublishService : uses
    DraftService ..> AreaDraft : creates/updates
    PublishService ..> Area : creates/updates dari Draft
```
</details>

<details>
<summary><b>4. Sequence Diagram (Publishing Workflow)</b></summary>

Diagram sekuens ini menggambarkan proses kompleks sistem ketika Super Admin melakukan *Publish* dari *Draft* (Bayangan) ke *Live* (Publik).

```mermaid
sequenceDiagram
    actor Admin as Super Admin
    participant EditorController
    participant DraftService
    participant PublishService
    participant Database

    Admin->>EditorController: Klik "Publish All"
    EditorController->>DraftService: getPendingChanges()
    DraftService-->>EditorController: list of dirty drafts
    EditorController->>PublishService: publish(rootDraft)
    
    activate PublishService
    PublishService->>Database: BEGIN TRANSACTION
    PublishService->>Database: Verifikasi Checksum Live vs Draft
    
    alt Checksum Mismatch (Stale)
        PublishService->>Database: ROLLBACK
        PublishService-->>EditorController: Error (Stale Data)
        EditorController-->>Admin: Notifikasi Error Sinkronisasi
    else Checksum Valid
        PublishService->>Database: Upsert (Insert/Update) Area & Scene ke Live
        PublishService->>Database: Hapus Live data (jika ditandai deleted)
        PublishService->>Database: Update draft_sync_states (status = synced)
        PublishService->>Database: COMMIT TRANSACTION
        PublishService-->>EditorController: Success
        EditorController-->>Admin: Notifikasi Berhasil
    end
    deactivate PublishService
```
</details>

<details>
<summary><b>5. Activity Diagram (Upload Scene & Auto-Linking)</b></summary>

Diagram aktivitas ini menggambarkan proses di balik layar (*background queue*) saat Admin mengunggah gambar 360°.

```mermaid
stateDiagram-v2
    [*] --> ValidasiFile: Admin Upload Foto 360 (Editor)
    ValidasiFile --> EkstrakEXIF: Validasi Ekstensi & Ukuran
    EkstrakEXIF --> SimpanDraft: Ambil Lat/Lng GPS via GeoService
    SimpanDraft --> BackgroundJob: Simpan Data ke SceneDraft
    
    state BackgroundJob {
        [*] --> ProsesImage
        ProsesImage --> GenerateTiles: Konversi ke Marzipano Tiles
        GenerateTiles --> [*]
    }
    
    BackgroundJob --> AutoLink: Job Queue Selesai
    AutoLink --> HitungJarak: AutoLinkService mencari SceneDraft terdekat
    HitungJarak --> BuatLink: Jika jarak < radius, buat LinkDraft otomatis
    BuatLink --> [*]: Proses Upload Selesai
```
</details>

---

## 🔐 Pengaturan Akun Admin

Setelah registrasi user pertama kali di aplikasi, ubah perannya menjadi *Super Admin* melalui database:

**Via SQL:**
```sql
UPDATE users SET role = 'super_admin', status = 'active' WHERE id = 1;
```

**Atau via Laravel Tinker:**
```bash
php artisan tinker
>>> \App\Models\User::find(1)->update(['role' => 'super_admin', 'status' => 'active']);
```

---

## 🔧 Pemecahan Masalah (Troubleshooting)

| Masalah                       | Solusi                                     |
| ----------------------------- | ------------------------------------------ |
| **Gambar tidak muncul**       | Jalankan `php artisan storage:link` untuk membuat symbolic link folder penyimpanan. |
| **Upload gambar tidak jalan** | Pastikan *queue worker* (`php artisan queue:work`) sedang berjalan. |
| **Error "could not find driver"** | Install ekstensi `php-pgsql` dan *restart* service PHP-FPM Anda. |
| **PostGIS function not found** | Jalankan `CREATE EXTENSION postgis;` di database Anda. |
| **Vite manifest not found**   | Jalankan `npm run build` untuk mem-build aset frontend (atau `npm run dev` di lokal). |

---

<p align="center">
  <i>Dikembangkan untuk PT Semen Padang</i>
</p>
