# System Flowchart

Dokumen ini berisi diagram alur (_flowchart_) terintegrasi yang merepresentasikan keseluruhan sistem **Semen Padang Virtual Tour**. Diagram mencakup seluruh peran pengguna (Guest, Pegawai, Admin) dan ketiga domain utama (Public Tour, Admin Dashboard, Visual Editor).

---

## Flowchart Sistem Terintegrasi

```mermaid
flowchart TD
    Start([Mulai]) --> BukaApp[Buka Aplikasi]
    BukaApp --> CekLogin{Login?}

    %% ========================================
    %% GUEST PATH (Tidak Login)
    %% ========================================
    CekLogin -- Tidak --> GuestDash[Buka Halaman Utama]
    GuestDash --> LoadPublik[Memuat Area Publik]
    LoadPublik --> InteraksiPeta[Interaksi dengan Peta]

    InteraksiPeta --> CekMarkerGuest{Marker Dipilih?}
    CekMarkerGuest -- Tidak --> EksplorasiGuest[Eksplorasi Peta]
    EksplorasiGuest --> Selesai([Selesai])

    CekMarkerGuest -- Ya --> InfoGuest[Lihat Informasi Area]
    InfoGuest --> CekTourGuest{Masuk Virtual Tour?}
    CekTourGuest -- Tidak --> EksplorasiGuest

    CekTourGuest -- Ya --> ViewerGuest[Buka 360 Viewer]
    ViewerGuest --> CekHotspotGuest{Hotspot Dipilih?}
    CekHotspotGuest -- Ya --> PindahSceneGuest[Pindah Scene]
    PindahSceneGuest --> ViewerGuest

    CekHotspotGuest -- Tidak --> CekInfoSpotGuest{Info Spot Dipilih?}
    CekInfoSpotGuest -- Ya --> TampilInfoGuest[Tampilkan Informasi]
    TampilInfoGuest --> ViewerGuest
    CekInfoSpotGuest -- Tidak --> CekKembaliGuest{Kembali ke Peta?}
    CekKembaliGuest -- Ya --> GuestDash
    CekKembaliGuest -- Tidak --> ViewerGuest

    %% ========================================
    %% LOGIN PROCESS
    %% ========================================
    CekLogin -- Ya --> HalamanLogin[Buka Halaman Login]
    HalamanLogin --> InputKredensial[Input Email dan Password]
    InputKredensial --> CekValid{Data Valid?}

    CekValid -- Tidak --> TampilError[Tampilkan Pesan Kesalahan]
    TampilError --> HalamanLogin

    CekValid -- Ya --> CekRole{Role Admin?}

    %% ========================================
    %% ADMIN PATH
    %% ========================================
    CekRole -- Ya --> AdminDash[Masuk Admin Dashboard]
    AdminDash --> CekMenuUM{Menu User Management?}

    %% User Management
    CekMenuUM -- Ya --> ListUser[Lihat Daftar User]
    ListUser --> CekPending{Ada User Pending?}
    CekPending -- Tidak --> AdminDash
    CekPending -- Ya --> ProsesApproval[[Proses Approval User]]
    ProsesApproval --> AdminDash

    %% Visual Editor
    CekMenuUM -- Tidak --> CekMenuVE{Menu Visual Editor?}
    CekMenuVE -- Tidak --> CekPreview{Preview Tour?}
    CekPreview -- Ya --> TourAdmin[Buka Virtual Tour sebagai Admin]
    TourAdmin --> AdminDash
    CekPreview -- Tidak --> AdminDash

    CekMenuVE -- Ya --> BukaEditor[Buka CMS Editor]
    BukaEditor --> CekAksiTambah{Tambah Data?}

    CekAksiTambah -- Ya --> ProsesTambah[[Proses Tambah Data]]
    ProsesTambah --> SimpanDraft[Simpan ke Draft]

    CekAksiTambah -- Tidak --> CekAksiEdit{Edit Data?}
    CekAksiEdit -- Ya --> ProsesEdit[[Proses Edit Data]]
    ProsesEdit --> SimpanDraft

    CekAksiEdit -- Tidak --> CekAksiHapus{Hapus Data?}
    CekAksiHapus -- Ya --> ProsesHapus[[Proses Hapus Data]]
    ProsesHapus --> SimpanDraft

    CekAksiHapus -- Tidak --> CekAksiLink{Edit Hotspot?}
    CekAksiLink -- Ya --> ProsesLink[[Proses Kelola Hotspot]]
    ProsesLink --> SimpanDraft
    CekAksiLink -- Tidak --> BukaEditor

    SimpanDraft --> CekReview{Review Perubahan?}
    CekReview -- Tidak --> BukaEditor
    CekReview -- Ya --> LihatDiff[Lihat Pending Changes]
    LihatDiff --> CekPublish{Publikasikan?}
    CekPublish -- Tidak --> BukaEditor
    CekPublish -- Ya --> ProsesPublish[[Proses Publikasi]]
    ProsesPublish --> AdminDash

    %% ========================================
    %% PEGAWAI PATH
    %% ========================================
    CekRole -- Tidak --> CekStatusAkun{Status Akun Aktif?}
    CekStatusAkun -- Tidak --> HalamanPending[Tampilkan Halaman Menunggu]
    HalamanPending --> Selesai

    CekStatusAkun -- Ya --> PegawaiDash[Masuk Dashboard Pegawai]
    PegawaiDash --> LoadSemuaArea[Memuat Seluruh Area]
    LoadSemuaArea --> InteraksiPetaPegawai[Interaksi dengan Peta]

    InteraksiPetaPegawai --> CekMarkerPegawai{Marker Dipilih?}
    CekMarkerPegawai -- Tidak --> EksplorasiPegawai[Eksplorasi Peta]
    EksplorasiPegawai --> CekLogoutPegawai{Logout?}
    CekLogoutPegawai -- Ya --> HalamanLogin
    CekLogoutPegawai -- Tidak --> PegawaiDash

    CekMarkerPegawai -- Ya --> InfoPegawai[Lihat Informasi Area]
    InfoPegawai --> CekTourPegawai{Masuk Virtual Tour?}
    CekTourPegawai -- Tidak --> EksplorasiPegawai

    CekTourPegawai -- Ya --> ViewerPegawai[Buka 360 Viewer]
    ViewerPegawai --> CekHotspotPegawai{Hotspot Dipilih?}
    CekHotspotPegawai -- Ya --> PindahScenePegawai[Pindah Scene]
    PindahScenePegawai --> ViewerPegawai

    CekHotspotPegawai -- Tidak --> CekInfoSpotPegawai{Info Spot Dipilih?}
    CekInfoSpotPegawai -- Ya --> TampilInfoPegawai[Tampilkan Informasi]
    TampilInfoPegawai --> ViewerPegawai
    CekInfoSpotPegawai -- Tidak --> CekKembaliPegawai{Kembali ke Peta?}
    CekKembaliPegawai -- Ya --> PegawaiDash
    CekKembaliPegawai -- Tidak --> ViewerPegawai
```

---

## Keterangan Simbol

| Simbol    | Nama                 | Keterangan                                                 |
| --------- | -------------------- | ---------------------------------------------------------- |
| `([...])` | _Terminator_         | Awal atau akhir proses (Mulai/Selesai)                     |
| `[...]`   | _Process_            | Proses atau aktivitas tunggal                              |
| `{...}`   | _Decision_           | Keputusan biner (Ya/Tidak)                                 |
| `[[...]]` | _Predefined Process_ | Sub-rutin atau proses kompleks yang didefinisikan terpisah |

---

## Ringkasan Alur Berdasarkan Role

| Role        | Akses Domain                           | Keterangan                                                        |
| ----------- | -------------------------------------- | ----------------------------------------------------------------- |
| **Guest**   | Public Tour                            | Hanya dapat melihat area publik tanpa _login_                     |
| **Pegawai** | Public Tour + Restricted Area          | Dapat melihat seluruh area termasuk yang terbatas setelah _login_ |
| **Admin**   | Admin Dashboard + Visual Editor + Tour | Akses penuh ke manajemen _user_, CMS _editor_, dan _preview_ tour |

---

## Predefined Process Detail

### `[[Proses Approval User]]`

1. Pilih _user_ dengan status _pending_
2. Tentukan: Setujui atau Tolak
3. Jika setujui → Set status aktif
4. Jika tolak → Hapus atau tandai ditolak

### `[[Proses Tambah Data]]`

1. Pilih tipe data (Area / Scene)
2. Isi formulir atau _upload_ gambar 360°
3. Ekstrak _metadata_ GPS (jika ada)
4. Simpan ke _draft_

### `[[Proses Edit Data]]`

1. Pilih item yang akan diedit
2. Ubah properti (nama, koordinat, dll)
3. Simpan ke _draft_

### `[[Proses Hapus Data]]`

1. Pilih item yang akan dihapus
2. Konfirmasi penghapusan
3. Tandai sebagai dihapus di _draft_

### `[[Proses Kelola Hotspot]]`

1. Pilih _scene_ sumber
2. Tambah/edit/hapus _hotspot_ navigasi
3. Tentukan _scene_ tujuan dan posisi (yaw/pitch)
4. Simpan ke _draft_

### `[[Proses Publikasi]]`

1. Validasi seluruh _draft_
2. Eksekusi transaksi atomik ke tabel _live_
3. Bersihkan status _draft_
