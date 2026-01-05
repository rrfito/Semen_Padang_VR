export const TOUR_STEPS = [
    {
        id: "welcome_intro",
        popover: {
            title: "Selamat Datang!",
            description: "Selamat datang di Virtual Tour PT Semen Padang. Ikuti panduan singkat ini untuk mempelajari cara navigasi.",
            side: "center",
            align: "center",
        },
    },
    {
        id: "map_marker_intro",
        element: "#map-container",
        popover: {
            title: "Peta Interaktif",
            description: "Ini adalah peta area. Anda bisa menggeser, zoom, dan melihat lokasi seluruh area.",
            side: "left",
            align: "start",
        },
    },
    {
        id: "sidebar_tools",
        element: "#sidebar-tools",
        popover: {
            title: "Pencarian",
            description: "Gunakan kolom pencarian ini untuk menemukan area dengan cepat.",
            side: "right",
            align: "start",
        },
    },
    {
        id: "sidebar_tree",
        element: "#sidebar-tree",
        popover: {
            title: "Daftar Area",
            description: "Ini adalah daftar hierarki area. Anda dapat melihat struktur area dari utama hingga ruangan.",
            side: "right",
            align: "start",
        },
    },
    
    // --- STEP 1: SELECT (Name) ---
    {
        id: "step_pick_area", 
        // Element: Dynamic Name (e.g., #sidebar-item-5)
        popover: {
            title: "Pilih Area Utama",
            description: "Silakan KLIK NAMA area ini untuk melihat detail dan peta.",
            side: "right",
            align: "center",
        },
        interaction: true, // Custom flag: Wait for selection
    },

    {
        id: "secondary_sidebar_intro",
        element: "#secondary-sidebar",
        popover: {
            title: "Panel Detail",
            description: "Setelah dipilih, panel ini muncul menampilkan informasi detail tentang area tersebut.",
            side: "left",
            align: "start",
        },
    },
    {
        id: "btn-show-polyline",
        element: "#btn-show-polyline",
        popover: {
            title: "Tampilkan Jalur Area",
            description: "menampilkan jalur area yang muncul di map, dalam bentuk marker di peta.",
            side: "left",
            align: "start",
        },
    },
    // --- STEP 2: EXPAND (Arrow) ---
    {
        id: "step_expand_tree",
        // Element: Dynamic Arrow (e.g., #sidebar-arrow-5)
        popover: {
            title: "Buka Detail Ruangan",
            description: "Untuk melihat ruangan di dalam area ini, KLIK ikon PANAH kecil ini.",
            side: "right",
            align: "center",
        },
        interaction: true, // Custom flag: Wait for expansion
    },

    // --- STEP 3: PICK CHILD ---
    {
        id: "step_pick_child",
        // Element: Dynamic Child
        popover: {
            title: "Pilih Ruangan",
            description: "Terakhir, KLIK salah satu area yang muncul di bawahnya.",
            side: "right",
            align: "center",
        },
        interaction: true, // Custom flag: Wait for selection
    },
    {
        id: "scene_list_intro",
        element: "#scene-list-container",
        popover: {
            title: "Masuk Virtual Tour",
            description: "Daftar Gambar 360 muncul di sini yang disebut dengan scene. Klik gambar untuk mulai menjelajah! ",
            side: "left",
            align: "start",
        },
    },
    {
        id: "map_layers",
        element: "#map-layer-control", 
        popover: {
            title: "Ganti Layar Peta",
            description: "Ganti tampilan antara Peta Jalan dan Satelit di sini.",
            side: "top",
            align: "end",
        },
    },
    {
        id: "user_login",
        element: "#user-section",
        popover: {
            title: "Melakukan Login",
            description: "Anda dapat login di sini untuk dapat melihat area yang terkunci.",
            side: "right",
            align: "end",
        },
    },
];
