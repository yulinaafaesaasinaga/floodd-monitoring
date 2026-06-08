import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            keyframes: {
                'siaga-ring': {
                    '0%, 100%': { boxShadow: '0 0 0 0 rgba(234, 179, 8, 0.45)' },
                    '50%': { boxShadow: '0 0 0 12px rgba(234, 179, 8, 0)' },
                },
                marquee: {
                    '0%': { transform: 'translateX(0)' },
                    '100%': { transform: 'translateX(-50%)' },
                },
            },
            animation: {
                'siaga-ring': 'siaga-ring 2.4s ease-in-out infinite',
                marquee: 'marquee 28s linear infinite',
            },
        },
    },

    plugins: [forms],
};
