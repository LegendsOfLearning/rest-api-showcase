/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Add custom colors if needed
      },
      borderRadius: {
        // Add custom border radius if needed
      },
      boxShadow: {
        // Add custom shadows if needed
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
} 