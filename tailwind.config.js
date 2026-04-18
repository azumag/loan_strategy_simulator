/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Tailwind CSS変数オーバーライドを @layer utilities に置いているため、
  // Tailwindの色を打ち消すためにここで何かする必要はありません。
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)'],
        sans:    ['var(--font-sans)'],
        mono:    ['var(--font-mono)'],
      },
    },
  },
  plugins: [],
}
