/** @type {import('tailwindcss').Config} */
module.exports = {
    mode: 'jit',
    content: ["./src/**/*.{html,js,jsx,ts,tsx}"], // Sesuaikan dengan struktur proyek
    theme: {
      extend: {
        fontFamily: {
          display: ["Oswald", "sans-serif"],
        },
      },
    },
    plugins: [require('tailwind-scrollbar-hide')],
  };
  