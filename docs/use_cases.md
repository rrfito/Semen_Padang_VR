# Use Case Diagram & Narrative

Dokumen ini memuat _Use Case Diagram_ dan _Narrative_ yang mendeskripsikan interaksi antara aktor pengguna dengan sistem Semen Padang Virtual Tour. Dokumen ini membuktikan pemenuhan **Unit Kompetensi SKKNI - Menggunakan Spesifikasi Program**.

## 1. Use Case Diagram

```mermaid
usecaseDiagram
    actor Guest as "Guest (Public)"
    actor Pegawai as "Pegawai"
    actor Admin as "Admin"
    actor SuperAdmin as "Super Admin"

    %% Inheritance
    Guest <|-- Pegawai
    Pegawai <|-- Admin
    Admin <|-- SuperAdmin

    package "Semen Padang Virtual Tour" {
        %% Public Tour Domain
        usecase "Melihat Peta Area Publik" as UC1
        usecase "Eksplorasi Panorama 360" as UC2
        usecase "Melihat InfoSpot" as UC3
        usecase "Melihat Area Terbatas (Restricted)" as UC4

        %% Editor Domain
        usecase "Login ke Sistem" as UC5
        usecase "Mengelola Draft Area" as UC6
        usecase "Mengunggah Scene 360" as UC7
        usecase "Membuat Link / Hotspot" as UC8
        usecase "Melihat Pending Changes (Preview)" as UC9
        
        %% Super Admin Domain
        usecase "Mem-publish Perubahan" as UC10
        usecase "Manajemen Pengguna (Approve/Reject)" as UC11
    }

    %% Guest relationships
    Guest --> UC1
    Guest --> UC2
    Guest --> UC3

    %% Pegawai relationships
    Pegawai --> UC4
    Pegawai --> UC5

    %% Admin relationships
    Admin --> UC6
    Admin --> UC7
    Admin --> UC8
    Admin --> UC9

    %% Super Admin relationships
    SuperAdmin --> UC10
    SuperAdmin --> UC11
```

## 2. Use Case Narratives (Skenario Pengguna)

### Use Case 2: Eksplorasi Panorama 360
- **Aktor Utama:** Guest
- **Tujuan:** Pengguna dapat berpindah dari satu titik lokasi ke titik lokasi lain secara imersif.
- **Kondisi Awal:** Pengguna berada di halaman _Virtual Tour Viewer_.
- **Skenario Utama:**
  1. Sistem menampilkan gambar panorama 360 derajat.
  2. Sistem merender _Hotspot_ (anak panah) di layar berdasarkan orientasi (yaw/pitch).
  3. Pengguna mengklik _Hotspot_ navigasi.
  4. Sistem mengambil data _Scene_ target.
  5. Sistem memuat gambar panorama baru dan mengubah tampilan ke _Scene_ target.
- **Kondisi Akhir:** Pengguna berada di lokasi virtual yang baru.

### Use Case 6, 7, 8: Mengelola Draft & Konten Tour
- **Aktor Utama:** Admin / Super Admin
- **Tujuan:** Memperbarui konten _virtual tour_ tanpa mengganggu pengalaman pengguna publik yang sedang mengakses situs.
- **Kondisi Awal:** Admin masuk ke halaman Visual Editor.
- **Skenario Utama:**
  1. Admin memilih menu "Visual Editor".
  2. Sistem menyalin (_clone_) data dari tabel _Live_ ke tabel _Draft_ secara otomatis jika _draft_ belum ada.
  3. Admin membuat sub-area baru dan mengunggah 5 gambar panorama (Scene).
  4. Admin menarik garis (_Link_) antar Scene di peta editor untuk membuat jalur navigasi.
  5. Sistem menyimpan semua perubahan ke tabel `area_drafts`, `scene_drafts`, dan `link_drafts`.
- **Kondisi Akhir:** Data _draft_ tersimpan dan status _Draft Workspace_ berubah menjadi _Dirty_.

### Use Case 10: Mem-publish Perubahan
- **Aktor Utama:** Super Admin
- **Tujuan:** Menerapkan rancangan (_draft_) menjadi versi publik (_live_).
- **Kondisi Awal:** Terdapat status _Dirty_ pada _Draft Workspace_.
- **Skenario Utama:**
  1. Super Admin menekan tombol "Publish All".
  2. Sistem melakukan validasi _checksum_ integritas antara _draft_ dan _live_.
  3. Sistem membuka *Database Transaction*.
  4. Sistem melakukan operasi _Upsert_ (Update/Insert) dari tabel `drafts` ke tabel `live` secara rekursif.
  5. Sistem membersihkan / memperbarui status sinkronisasi menjadi _Synced_.
- **Kondisi Akhir:** Perubahan dapat diakses oleh Guest di sistem publik.
- **Skenario Alternatif:** Jika terjadi kesalahan pada langkah 4, sistem akan melakukan *Rollback* dan _Live Tour_ tetap dalam kondisi aman.
