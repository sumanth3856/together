/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: "class",
  theme: {
    extend: {
      "colors": {
        // Deep cinematic dark palette
        "background": "var(--bg-base, #0c0d14)",
        "surface": "var(--surface-base, #12151e)",
        "surface-container": "var(--surface-container, #181c28)",
        "surface-container-low": "var(--surface-container-low, #141722)",
        "surface-container-high": "var(--surface-container-high, #212636)",
        "surface-container-highest": "var(--surface-container-highest, #2c3246)",
        "surface-container-lowest": "var(--surface-container-lowest, #0e1017)",
        "surface-variant": "var(--surface-variant, #242938)",
        "surface-bright": "var(--surface-bright, #2e3448)",
        "surface-dim": "var(--surface-dim, #0a0b10)",
        "surface-tint": "#f04438",

        // Text & Contrast hierarchy
        "on-background": "var(--text-primary, #f5f6fa)",
        "on-surface": "var(--text-primary, #f5f6fa)",
        "on-surface-variant": "var(--text-secondary, #9da4b8)",
        "on-surface-muted": "var(--text-muted, #646d82)",

        // Primary Accent (Cinema Crimson / Coral)
        "primary": "var(--primary-accent, #e53935)",
        "primary-hover": "#f0504c",
        "primary-container": "var(--primary-container, rgba(229, 57, 53, 0.15))",
        "on-primary": "#ffffff",
        "on-primary-container": "#ffcdd2",

        // Secondary & Neutral Accents
        "secondary": "#7c8497",
        "secondary-container": "rgba(255, 255, 255, 0.06)",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#e2e5ec",

        // Outlines & Hairline Dividers
        "outline": "var(--outline, rgba(255, 255, 255, 0.14))",
        "outline-variant": "var(--outline-subtle, rgba(255, 255, 255, 0.08))",

        // Status Colors
        "error": "#ef4444",
        "error-container": "rgba(239, 68, 68, 0.15)",
        "on-error": "#ffffff",
        "on-error-container": "#fca5a5",

        "success": "#22c55e",
        "success-container": "rgba(34, 197, 94, 0.15)",
        "on-success": "#ffffff",
        "on-success-container": "#86efac",

        "tertiary": "#6366f1",
        "tertiary-container": "rgba(99, 102, 241, 0.15)",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#c7d2fe",
      },
      "borderRadius": {
        "DEFAULT": "0.375rem",
        "sm": "0.25rem",
        "md": "0.5rem",
        "lg": "0.75rem",
        "xl": "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
        "full": "9999px"
      },
      "spacing": {
        "gutter": "24px",
        "margin-lg": "64px",
        "margin-sm": "16px",
        "margin-md": "32px",
        "container-max": "1440px",
        "unit": "4px",
      },
      "fontFamily": {
        "label-sm": ["var(--font-chivo)", "sans-serif"],
        "headline-md": ["var(--font-oswald)", "sans-serif"],
        "display-lg": ["var(--font-oswald)", "sans-serif"],
        "body-lg": ["var(--font-chivo)", "sans-serif"],
        "body-md": ["var(--font-chivo)", "sans-serif"],
        "label-lg": ["var(--font-chivo)", "sans-serif"],
        "headline-lg": ["var(--font-oswald)", "sans-serif"],
        "title-md": ["var(--font-oswald)", "sans-serif"],
        "title-sm": ["var(--font-oswald)", "sans-serif"],
        "display-accent": ["var(--font-playfair-display)", "serif"]
      },
      "boxShadow": {
        "2xs": "0 1px 2px rgba(0, 0, 0, 0.2)",
        "soft": "0 2px 8px rgba(0, 0, 0, 0.25)",
        "card": "var(--shadow-card, 0 4px 20px rgba(0, 0, 0, 0.45))",
        "lift": "var(--shadow-lift, 0 8px 32px rgba(0, 0, 0, 0.55))",
        "glow": "var(--shadow-glow, 0 0 24px -4px rgba(229, 57, 53, 0.35))",
        "cinema": "var(--shadow-cinema, 0 12px 48px -8px rgba(0, 0, 0, 0.8))"
      },
      "transitionTimingFunction": {
        "expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        "expo-in-out": "cubic-bezier(0.87, 0, 0.13, 1)"
      },
      "transitionDuration": {
        "fast": "120ms",
        "slow": "350ms"
      },
    },
  },
  plugins: [],
}
