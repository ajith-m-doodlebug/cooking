import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-manrope)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-newsreader)", "Georgia", "ui-serif", "serif"],
        headline: ["var(--font-newsreader)", "Georgia", "ui-serif", "serif"],
        body: ["var(--font-manrope)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          primary: "var(--color-brand-primary)",
          "primary-hover": "var(--color-brand-primary-hover)",
          secondary: "var(--color-brand-secondary)",
          tertiary: "var(--color-brand-tertiary)",
          "tertiary-hover": "var(--color-brand-tertiary-hover)",
          neutral: "var(--color-brand-neutral)",
        },
        editorial: {
          bg: "var(--color-bg)",
          surface: "var(--color-surface)",
          "surface-subtle": "var(--color-bg-subtle)",
          border: "var(--color-border)",
          text: "var(--color-text)",
          muted: "var(--color-text-muted)",
        },
      },
      boxShadow: {
        editorial:
          "0 4px 20px -2px rgba(96, 123, 125, 0.08), 0 2px 10px -2px rgba(158, 143, 128, 0.06)",
        "editorial-lg": "0 8px 32px 0 rgba(35, 26, 16, 0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
