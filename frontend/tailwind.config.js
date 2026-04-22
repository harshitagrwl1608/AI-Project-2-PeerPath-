/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            colors: {
                primary: '#6C63FF',
                'primary-hover': '#5A52E0',
                background: '#F8F7FF',
                'tag-bg': '#F0EFFE',
                amber: '#F59E0B',
            },
            boxShadow: {
                custom: '0 4px 20px rgba(108, 99, 255, 0.08)',
            }
        },
    },
    plugins: [],
}
