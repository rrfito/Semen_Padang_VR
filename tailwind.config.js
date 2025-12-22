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
                primary: "#D32F2F",
                "background-light": "#e8e8e8",
                "background-dark": "#101922",
                "surface-dark": "#182430",
                "surface-light": "#f0f0f0",
                "border-dark": "#233648",
                "border-light": "#d0d0d0",
            },
        },
    },

    plugins: [forms],
};
