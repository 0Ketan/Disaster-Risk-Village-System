/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#04122e",
          container: "#1a2744",
          fixed: "#d9e2ff",
          dim: "#b9c6eb",
          foreground: "#ffffff"
        },
        surface: {
          DEFAULT: "#f7f9fc",
          dim: "#d8dadd",
          bright: "#f7f9fc",
          lowest: "#ffffff",
          low: "#f2f4f7",
          container: "#eceef1",
          high: "#e6e8eb",
          highest: "#e0e3e6",
          variant: "#e0e3e6"
        },
        "on-surface": "#191c1e",
        "on-surface-variant": "#45464d",
        "outline-variant": "#c5c6ce",
        "map-bg": "#0f1923",
        risk: {
          low: "#27ae60",       // 0 - 30 (Low Risk)
          moderate: "#f39c12",  // 31 - 60 (Moderate Risk)
          high: "#e67e22",      // 61 - 80 (High Risk)
          critical: "#e74c3c"   // 81 - 100 (Critical Risk)
        },
        warning: {
          badge: "#fef08a",     // Yellow warning badge bg
          text: "#854d0e",      // Yellow warning badge text
          border: "#fde047"
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      spacing: {
        nav: "60px",
        filter: "50px",
        gutter: "24px",
        sidebar: "380px",
        drawer: "440px"
      }
    },
  },
  plugins: [],
};
