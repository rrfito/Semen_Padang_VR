# Class Diagram (UML)

Dokumen ini memuat _Class Diagram_ yang merepresentasikan arsitektur Object-Oriented Programming (OOP) pada _backend_ Semen Padang Virtual Tour. Diagram ini membuktikan pemenuhan **Unit Kompetensi SKKNI - Mengimplementasikan Pemrograman Berorientasi Objek**.

## 1. Arsitektur MVC & Service Pattern

Aplikasi memisahkan tanggung jawab (Single Responsibility Principle) ke dalam lapisan:
1. **Controller:** Menangani _request_ HTTP dan _routing_.
2. **Service:** Menangani logika bisnis kompleks (seperti sinkronisasi _draft_, penghitungan jarak).
3. **Model (Live & Draft):** Representasi entitas di *database* (Active Record / Eloquent).

## 2. Diagram Kelas Utama

```mermaid
classDiagram
    %% ================= CONTROLLERS =================
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
        +createSubArea(Request $request) JSON
        +updateArea(Request $request, int $id) JSON
        +destroyArea(int $id) JSON
        +publishAll() JSON
        +discardDrafts(int $rootDraftId) JSON
    }

    %% ================= SERVICES =================
    class DraftService {
        +initDrafts(Area $rootLiveArea) AreaDraft
        +markDirty(Model $node) void
        +discardAllDrafts() void
        +getPendingChanges(AreaDraft $root) array
        -cloneAreaToDraft(Area $liveArea, AreaDraft $parent) AreaDraft
    }

    class PublishService {
        +publish(AreaDraft $rootDraft, User $publisher) bool
        -publishNode(Model $draft, array $linksToProcess) void
        -upsertArea(AreaDraft $draft) void
        -upsertScene(SceneDraft $draft) void
        -verifyDraftIntegrity(AreaDraft $root) bool
    }

    class GeoService {
        +calculateDistance(float $lat1, float $lng1, float $lat2, float $lng2) float
        +findNearestScenes(float $lat, float $lng, float $radius) Collection
    }

    %% ================= LIVE MODELS =================
    class Model {
        <<Eloquent ORM>>
    }

    class Area {
        +int id
        +int parent_id
        +string name
        +float lat
        +float lng
        +bool is_container
        +parent() BelongsTo
        +children() HasMany
        +scenes() HasMany
    }

    class Scene {
        +int id
        +int area_id
        +string image_path
        +float heading
        +geography location
        +area() BelongsTo
        +links() HasMany
        +infoSpots() HasMany
        +getLocationArrayAttribute() array
    }

    %% ================= DRAFT MODELS =================
    class AreaDraft {
        +int published_id
        +bool marked_for_deletion
        +getRootArea() AreaDraft
        +syncState() HasOne
    }

    class SceneDraft {
        +int published_id
        +bool marked_for_deletion
    }

    %% ================= RELATIONSHIPS =================
    
    %% Inheritance
    Area --|> Model
    Scene --|> Model
    AreaDraft --|> Model
    SceneDraft --|> Model

    %% Composition/Aggregation in Models
    Area "1" *-- "many" Scene : has
    Area "1" *-- "many" Area : children
    AreaDraft "1" *-- "many" SceneDraft : has
    AreaDraft "1" *-- "many" AreaDraft : children

    %% Dependency / Usage
    TourController ..> Area : queries
    TourController ..> Scene : queries

    EditorController --> DraftService : uses
    EditorController --> PublishService : uses
    EditorController --> GeoService : uses

    DraftService ..> Area : reads
    DraftService ..> AreaDraft : creates/updates
    
    PublishService ..> AreaDraft : reads
    PublishService ..> Area : creates/updates
```

## Penjelasan Relasi:
- `TourController` melakukan *query* langsung ke model **Live** (`Area`, `Scene`) untuk disajikan ke publik.
- `EditorController` tidak menyentuh database secara langsung, melainkan menggunakan pola **Dependency Injection** pada `DraftService` dan `PublishService`.
- Model **Draft** mewarisi sifat dari Eloquent `Model` (Inheritance) dan merepresentasikan "Bayangan" dari model **Live** untuk memfasilitasi pengeditan sistem CMS yang aman.
