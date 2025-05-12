import flowbite from "flowbite-react/tailwind"

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    flowbite.content(),
  ],
  theme: {
    extend: {},
  },
  plugins: [flowbite.plugin(),
    function({ addBase }) {
      addBase({
        html: { fontSize: '12px' },
      });
    }
  ],
}