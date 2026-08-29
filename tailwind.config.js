/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        panel: {
          50: '#181b24',
          100: '#1e2330',
          200: '#252b3b',
          300: '#2f374a',
          400: '#3c465e'
        },
        accent: {
          green: '#10b981',
          red: '#ef4444',
          cyan: '#06b6d4',
          yellow: '#f59e0b',
          purple: '#8b5cf6'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
        sans: ['Inter', 'Outfit', 'sans-serif']
      }
    },
  },
  plugins: [],
}
