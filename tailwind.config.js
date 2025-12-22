import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', ...defaultTheme.fontFamily.sans],
                display: ['Inter', 'sans-serif'],
            },
            colors: {
                // Primary actions (Semen Padang Red)
                "primary": "#137fec",           // Blue (secondary, links in dark mode)
                "action-primary": "#D32F2F",    // Main action color
                "action-hover": "#C62828",      // Hover state
                "action-focus": "#E53935",      // Focus state
                
                // Backgrounds
                "background-light": "#F0F0F0",
                "background-dark": "#101922",
                
                // Canvas (main content area - slightly different from surface)
                "canvas-light": "#E8E8E8",      // Darker than surface for visual separation
                "canvas-dark": "#0c141d",       // Darker than surface-dark
                
                // Surfaces (panels, cards, sidebar)
                "surface-light": "#FFFFFF",
                "surface-dark": "#182430",
                
                // Text
                "text-light": "#1F2937",
                "text-dark": "#E5E7EB",
                "text-secondary-light": "#6B7280",
                "text-secondary-dark": "#9CA3AF",
                
                // Borders
                "border-light": "#E5E7EB",
                "border-dark": "#233648",
                
                // Status colors
                "success": "#16A34A",
                "warning": "#F59E0B",
                "danger": "#DC2626",
                "info": "#3B82F6",
                "portal-link": "#A855F7",
            },
        },
    },

    plugins: [forms],
};
