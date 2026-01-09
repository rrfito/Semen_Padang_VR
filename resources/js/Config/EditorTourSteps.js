/**
 * Editor Tour Steps Configuration
 * Defines the step-by-step guided tour for the Visual Editor
 */

export const EDITOR_TOUR_STEPS = {
    // Step 1: Welcome Screen
    WELCOME: {
        id: "welcome",
        target: null, // Center modal, no element target
        title: "Selamat Datang di Editor Visual!",
        description: "Panduan ini akan membantu Anda memahami fitur-fitur utama Visual Editor untuk mengelola Area dan Scene 360°.",
        position: "center",
        isInteractive: false,
    },

    // Step 1.1: Header Navigation
    HEADER_NAV: {
        id: "header_nav",
        target: "#editor-header",
        title: "Header Navigasi",
        description: "Header ini menampilkan posisi Anda dalam Editor dan menyediakan akses cepat ke fitur utama.",
        position: "bottom",
        isInteractive: false,
    },

    // Step 1.2: Sidebar Hierarchy - Now targets only the tree, not entire sidebar
    SIDEBAR_HIERARCHY: {
        id: "sidebar_hierarchy",
        target: "#sidebar-area-tree",
        title: "Hierarki Area",
        description: "Semua area dan sub-area ditampilkan di sini dalam struktur pohon. Anda bisa memperluas/menutup area untuk melihat isinya.",
        position: "right",
        isInteractive: false,
    },

    // Step 1.4: Theme Toggle
    THEME_TOGGLE: {
        id: "theme_toggle",
        target: "#btn-theme-toggle",
        title: "Ubah Tema",
        description: "Klik tombol ini untuk mengubah antara Mode Terang dan Mode Gelap sesuai preferensi Anda.",
        position: "bottom-right",
        isInteractive: false,
    },

    // Step 1.5: Review Button
    REVIEW_BUTTON: {
        id: "review_button",
        target: "#btn-review-changes",
        title: "Simpan & Tinjau",
        description: "Tombol ini menampilkan jumlah perubahan yang belum dipublikasikan. Klik untuk menyimpan dan meninjau perubahan Anda.",
        position: "bottom-left",
        isInteractive: false,
    },

    // Step 2: Add Root Area
    ADD_ROOT_AREA: {
        id: "add_root_area",
        target: "#btn-add-root-area",
        title: "Tambah Area Utama",
        description: "Untuk memulai, ayo tambahkan Area Utama baru! Klik tombol ini.",
        position: "right",
        isInteractive: true,
        interactionTarget: "#btn-add-root-area",
        waitForModal: "#modal-create-area",
    },

    // Step 2.1: Area Modal Explanation
    AREA_MODAL_INTRO: {
        id: "area_modal_intro",
        target: "#modal-create-area",
        title: "Modal Tambah Area",
        description: "Area Utama berada di posisi paling atas dalam hierarki (Contoh: Gedung Utama, Pabrik A). Isi nama dan informasi lainnya.",
        position: "right",
        isInteractive: false,
    },

    // Step 2.2: Area Name Input
    AREA_NAME_INPUT: {
        id: "area_name_input",
        target: "#input-area-name",
        title: "Nama Area",
        description: "Masukkan nama yang jelas dan mudah dimengerti untuk area ini.",
        position: "bottom",
        isInteractive: true,
        interactionTarget: "#input-area-name",
        waitForInput: true, // Wait for input to have value
    },

    // Step 2.3: Save Area Button
    SAVE_AREA_BUTTON: {
        id: "save_area_button",
        target: "#btn-save-area",
        title: "Simpan Area",
        description: "Tekan Simpan untuk membuat area. Anda akan diarahkan ke Area yang baru dibuat.",
        position: "top",
        isInteractive: true,
        interactionTarget: "#btn-save-area",
        waitForElement: "#area-children-grid",
    },

    // Step 3: Properties Panel (Area Overview)
    PROPERTIES_PANEL: {
        id: "properties_panel",
        target: "#area-children-grid",
        title: "Panel Area Overview",
        description: "Di sini Anda bisa melihat semua sub-area yang berada di bawah Area Utama ini.",
        position: "left",
        isInteractive: false,
    },

    // Step 3.1: Scene Map Button
    SCENE_MAP_BUTTON: {
        id: "scene_map_button",
        target: "#btn-scene-map",
        title: "Peta Scene",
        description: "Tombol ini membuka peta yang menampilkan posisi semua foto 360° di bawah area ini.",
        position: "bottom",
        isInteractive: false,
    },

    // Step 3.2: Add Sub-Area Button
    ADD_SUB_AREA_BUTTON: {
        id: "add_sub_area_button",
        target: "#btn-add-sub-area",
        title: "Tambah Sub-Area",
        description: "Tombol untuk menambahkan Sub-Area. Ayo kita tambahkan!",
        position: "bottom",
        isInteractive: true,
        interactionTarget: "#btn-add-sub-area",
        waitForModal: "#modal-create-area",
    },

    // Step 4: Area Type Selection
    AREA_TYPE_SELECTION: {
        id: "area_type_selection",
        target: "#select-area-type",
        title: "Jenis Area",
        description: "Di sini ada 2 pilihan: Area Zona (lantai/blok), yaitu area yang didalam nya bisa terdapat area ruangan, sedangkan Area Ruangan, yaitu area yang berisi Scene atau gambar 360. Untuk Sekarang ayo pilih area ruangan.",
        position: "bottom",
        isInteractive: true,
        interactionTarget: "#select-area-type",
    },
    SUB_AREA_NAME_INPUT: {
        id: "sub_area_name_input",
        target: "#input-area-name",
        title: "Nama Area",
        description: "Masukkan nama yang jelas dan mudah dimengerti untuk area ini.",
        position: "bottom",
        isInteractive: true,
        interactionTarget: "#input-area-name",
        waitForInput: true, // Wait for input to have value
    },

    // Step 4.1: Save Sub-Area
    SAVE_SUB_AREA: {
        id: "save_sub_area",
        target: "#btn-save-area",
        title: "Simpan Sub-Area",
        description: "Tekan Simpan untuk membuat area ruangan.",
        position: "top",
        isInteractive: true,
        interactionTarget: "#btn-save-area",
        waitForElement: "#scene-container-view",
    },

    // Step 5: Scene Container
    SCENE_CONTAINER: {
        id: "scene_container",
        target: "#scene-container-view",
        title: "Wadah Scene",
        description: "Area Ruangan ini berisi Scene (foto 360°). Di sini Anda bisa mengunggah dan mengelola gambar panorama.",
        position: "center",
        isInteractive: false,
    },

    // Step 5.1: Upload Scene Button
    UPLOAD_SCENE_BUTTON: {
        id: "upload_scene_button",
        target: "#btn-upload-scene",
        title: "Upload Scene",
        description: "Klik tombol ini untuk mengunggah gambar 360°. Pastikan gambar memiliki data GPS untuk penempatan otomatis di peta.",
        position: "bottom",
        isInteractive: true,
        interactionTarget: "#btn-upload-scene",
        waitForElement: "#scene-container-view",
    },

    // Step 5.2: Select Scene
    SELECT_SCENE: {
        id: "select_scene",
        target: "#scene-container-view",
        title: "Pilih Scene",
        description: "Tunggu gambar berhasil diunggah, Setelah gambar berhasil diunggah, klik salah satu gambar untuk membukanya dan mengedit link navigasi.",
        position: "left",
        isInteractive: true, 
        interactionTarget: "#scene-container-view",
        waitForElement: "#scene-container-view",
    },

    SCENE_EDITOR: {
        id: "scene_editor",
        target: "#scene-canvas",
        title: "Editor Scene",
        description: "Ini adalah area utama untuk mengatur Virtual Tour. Anda bisa melihat panorama 360° dan menambahkan link navigasi.",
        position: "center",
        isInteractive: false,
    },

    

    // Step 7: Add Link Flow
    ADD_LINK_INTRO: {
        id: "add_link_intro",
        target: "#btn-add-hotspot",
        title: "Ayo Tambah Link!",
        description: "Klik tombol ini untuk memulai menambahkan link navigasi.",
        position: "top",
        isInteractive: true,
        interactionTarget: "#btn-add-hotspot",
    },

    // Step 7.1: Link Type Icons
    LINK_TYPE_ICONS: {
        id: "link_type_icons",
        target: "#add-hotspot-buttons",
        title: "Pilih Tipe Link",
        description: "Biru = Navigasi (scene di area sama). Ungu = Gerbang (area berbeda). Klik tombol untuk memilih.",
        position: "top",
        isInteractive: true,
        interactionTarget: "#add-hotspot-buttons button",
    },
    

    // Step 7.3: Select Target Scene (Modal)
    SELECT_TARGET_SCENE: {
        id: "select_target_scene",
        target: "#modal-link-target",
        title: "Pilih Scene Tujuan",
        description: "Pilih scene yang akan menjadi tujuan link navigasi ini. Klik scene, lalu tekan 'Buat Tautan'.",
        position: "right",
        isInteractive: true,
        interactionTarget: "#modal-link-target button",
    },
    SELECT_TARGET_SCENE_SAVED: {
        id: "select_target_scene_saved",
        target: "#select_target_scene_saved",
        title: "Buat Link",
        description: "Klik 'Buat Tautan' untuk membuat link.",
        position: "right",
        isInteractive: true,
        interactionTarget: "#select_target_scene_saved",
    },

    // Step 8: Link Created
    LINK_CREATED: {
        id: "link_created",
        target: null,
        title: "Link Berhasil Ditambahkan!",
        description: "Link navigasi berhasil dibuat.",
        position: "center",
        isInteractive: false,
    },

    

    // Step 9: Auto-Link Introduction
    AUTO_LINK_INTRO: {
        id: "auto_link_intro",
        target: "#btn-auto-link",
        title: "Link Otomatis",
        description: "Selain menambahkan link manual, Anda juga bisa membuat link secara otomatis! Pilih area di hierarki, lalu tekan tombol ini.",
        position: "right",
        isInteractive: false,
    },

    // Step 9.1: Select Area for Auto-Link
    AUTO_LINK_SELECT_AREA: {
        id: "auto_link_select_area",
        target: "#sidebar-area-tree",
        title: "Pilih Area Target",
        description: "Klik salah satu area yang ingin Anda buatkan link otomatis. Pastikan area tersebut atau sub-areanya sudah memiliki scene atau gambar",
        position: "right",
        isInteractive: true,
        interactionTarget: "#sidebar-area-tree",
    },

    // Step 9.2: Click Auto-Link Button
    AUTO_LINK_BUTTON: {
        id: "auto_link_button",
        target: "#btn-auto-link",
        title: "Buat Link Otomatis",
        description: "Tekan tombol ini untuk membuat link otomatis berdasarkan jarak antar scene.",
        position: "right",
        isInteractive: true,
        interactionTarget: "#btn-auto-link",
    },

    // Step 9.3: Auto-Link Modal
    AUTO_LINK_MODAL: {
        id: "auto_link_modal",
        target: "#modal-auto-link",
        title: "Konfigurasi Link Otomatis",
        description: "Pilih mode pembuatan dan atur radius. Klik 'Buat Link' untuk membuat link otomatis.",
        position: "right",
        isInteractive: true,
        interactionTarget: "#modal-auto-link button",
    },

    // Step 10: Review Changes
    REVIEW_CHANGES_INTRO: {
        id: "review_changes_intro",
        target: "#btn-review-changes",
        title: "Tinjau Perubahan",
        description: "Setelah selesai melakukan perubahan, tekan tombol ini untuk melihat semua perubahan yang belum dipublikasikan.",
        position: "bottom-left",
        isInteractive: true,
        interactionTarget: "#btn-review-changes",
        waitForModal: "#modal-pending-changes",
    },

    // Step 10.1: Pending Changes Modal
    PENDING_CHANGES_MODAL: {
        id: "pending_changes_modal",
        target: "#modal-pending-changes",
        title: "Daftar Perubahan",
        description: `
            <div class="space-y-2">
            <p><strong>Draft</strong> = Perubahan yang belum dipublikasikan (hanya Anda yang bisa lihat)</p>
            <p><strong>Live</strong> = Data yang sudah dilihat publik</p>
            </div>
        `,
        position: "center",
        isInteractive: false,
    },

    // Step 10.2: Discard All Button
    DISCARD_ALL_BUTTON: {
        id: "discard_all_button",
        target: "#btn-discard-all",
        title: "Buang Semua",
        description: "Tombol ini untuk membatalkan SEMUA perubahan dan mengembalikan ke versi Live. Gunakan dengan hati-hati!",
        position: "top",
        isInteractive: false,
    },

    // Step 10.3: Publish Button
    PUBLISH_BUTTON: {
        id: "publish_button",
        target: "#btn-publish",
        title: "Publish to Live",
        description: "Tekan tombol ini untuk mempublikasikan semua perubahan ke Live. Publik akan bisa melihat perubahan ini!",
        position: "top",
        isInteractive: false,
    },

    // Step 11: Complete
    TOUR_COMPLETE: {
        id: "tour_complete",
        target: null,
        title: "Selamat!",
        description: "Anda telah menyelesaikan panduan dasar Visual Editor. Sekarang Anda siap untuk mengelola Virtual Tour Anda sendiri!",
        position: "center",
        isInteractive: false,
    },
};

/**
 * Tour Flow Sequences
 * Defines the order of steps for different tour modes
 */
export const TOUR_FLOWS = {
    // Full onboarding tour for new users
    FULL_ONBOARDING: [
        // Step 1: Welcome & UI Overview
        EDITOR_TOUR_STEPS.WELCOME,
        EDITOR_TOUR_STEPS.HEADER_NAV,
        EDITOR_TOUR_STEPS.SIDEBAR_HIERARCHY,
        EDITOR_TOUR_STEPS.THEME_TOGGLE,
        EDITOR_TOUR_STEPS.REVIEW_BUTTON,
        
        // Step 2: Create Root Area
        EDITOR_TOUR_STEPS.ADD_ROOT_AREA,
        EDITOR_TOUR_STEPS.AREA_MODAL_INTRO,
        EDITOR_TOUR_STEPS.AREA_NAME_INPUT,
        EDITOR_TOUR_STEPS.SAVE_AREA_BUTTON,
        
        // Step 3: Area Overview
        EDITOR_TOUR_STEPS.PROPERTIES_PANEL,
        EDITOR_TOUR_STEPS.SCENE_MAP_BUTTON,
        EDITOR_TOUR_STEPS.ADD_SUB_AREA_BUTTON,
        
        // Step 4: Create Sub-Area (Ruangan)
        EDITOR_TOUR_STEPS.AREA_TYPE_SELECTION,
        EDITOR_TOUR_STEPS.SUB_AREA_NAME_INPUT,
        EDITOR_TOUR_STEPS.SAVE_SUB_AREA,
        
        // Step 5: Upload Scene
        EDITOR_TOUR_STEPS.SCENE_CONTAINER,
        EDITOR_TOUR_STEPS.UPLOAD_SCENE_BUTTON,
        EDITOR_TOUR_STEPS.SELECT_SCENE,
        
        // Step 6: Scene Editor Overview
        EDITOR_TOUR_STEPS.SCENE_EDITOR,
      
        
        // Step 7: Add Link
        EDITOR_TOUR_STEPS.ADD_LINK_INTRO,
        EDITOR_TOUR_STEPS.LINK_TYPE_ICONS,
        EDITOR_TOUR_STEPS.SELECT_TARGET_SCENE,
        EDITOR_TOUR_STEPS.SELECT_TARGET_SCENE_SAVED,
        
        // Step 8: Link Created
        EDITOR_TOUR_STEPS.LINK_CREATED,
       
        
        // Step 9: Auto-Link
        EDITOR_TOUR_STEPS.AUTO_LINK_INTRO,
        EDITOR_TOUR_STEPS.AUTO_LINK_SELECT_AREA,
        EDITOR_TOUR_STEPS.AUTO_LINK_BUTTON,
        EDITOR_TOUR_STEPS.AUTO_LINK_MODAL,
        
        // Step 10: Review & Publish
        EDITOR_TOUR_STEPS.REVIEW_CHANGES_INTRO,
        EDITOR_TOUR_STEPS.PENDING_CHANGES_MODAL,
        EDITOR_TOUR_STEPS.DISCARD_ALL_BUTTON,
        EDITOR_TOUR_STEPS.PUBLISH_BUTTON,
        
        // Step 11: Complete
        EDITOR_TOUR_STEPS.TOUR_COMPLETE,
    ],

    // Quick overview for returning users
    QUICK_OVERVIEW: [
        EDITOR_TOUR_STEPS.WELCOME,
        EDITOR_TOUR_STEPS.SIDEBAR_HIERARCHY,
        EDITOR_TOUR_STEPS.ADD_ROOT_AREA,
        EDITOR_TOUR_STEPS.SCENE_EDITOR,
        EDITOR_TOUR_STEPS.ADD_HOTSPOT_BUTTON,
        EDITOR_TOUR_STEPS.REVIEW_CHANGES_INTRO,
        EDITOR_TOUR_STEPS.TOUR_COMPLETE,
    ],
};

/**
 * LocalStorage Keys
 */
export const TOUR_STORAGE_KEYS = {
    EDITOR_TOUR_COMPLETED: "editor_tour_completed",
    EDITOR_TOUR_STEP: "editor_tour_current_step",
    EDITOR_TOUR_PAUSED: "editor_tour_paused",
};
