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
                "action-primary": "#137fec",    // Main action color
                "action-hover": "#0F6CD6",      // Hover state
                "action-focus": "#1E88E5",
                
                
                // Backgrounds
                "background-light": "#f8f8f8",
                "background-dark": "#101922",
                
                // Canvas (main content area - slightly different from surface)
                "canvas-light": "#f0f0f0",      // Darker than surface for visual separation
                "canvas-dark": "#0c141d",       // Darker than surface-dark
                
                // Surfaces (panels, cards, sidebar)
                "surface-light": "#f8f8f8",
                "surface-dark": "#182430",
                
                // Text
                "text-light": "#1F2937",
                "text-dark": "#E5E7EB",
                "text-secondary-light": "#40444c",
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
