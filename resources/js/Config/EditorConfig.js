export const EDITOR_CONFIG = {
    // System Behaviors
    BEHAVIOR: {
      DEBOUNCE_MS: 300,        // Search input delay
      AUTO_SAVE_MS: 1000,      // Auto-save delay
      MAX_UPLOAD_SIZE_MB: 10,  // Frontend Validation
    },
    
    // UI Copy (Static)
    STATIC_LABELS: {
      // Common variables
      name: "Nama",
      description: "Deskripsi",
      slug: "URL Slug",
      
      // Hierarchy
      parent_id: "Parent Area",
      level: "Level Hierarki",
      priority: "Urutan Prioritas",
      content_type: "Tipe Konten",
      is_restricted: "Status Akses",

      // Coordinates
      lat: "Latitude (Koordinat)",
      latitude: "Latitude (Koordinat)",
      lng: "Longitude (Koordinat)",
      longitude: "Longitude (Koordinat)",

      // Scene Properties
      area_id: "Area",
      image_path: "Path Gambar",
      heading: "Arah Pandang",
      yaw: "Yaw (Rotasi)",
      pitch: "Pitch (Elevasi)",
      fov: "Field of View",
      can_be_gateway: "Bisa Jadi Gerbang",

      // Link Properties
      source_scene_id: "Scene Asal",
      target_scene_id: "Scene Tujuan",

      // Metadata
      created_at: "Tanggal Dibuat",
      updated_at: "Tanggal Diubah",
    },
  };
