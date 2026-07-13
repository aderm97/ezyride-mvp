import type { Config } from "tailwindcss";

export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        background: "var(--color-background)",
        card: "var(--color-card)",
        surface: {
          DEFAULT: "var(--color-surface)",
          hover: "var(--color-surface-hover)",
        },
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
        },
        border: {
          DEFAULT: "var(--color-border)",
          strong: "var(--color-border-strong)",
        },
        // Brand accent (flips per theme) + fixed brand constants
        accent: {
          DEFAULT: "var(--color-accent)",
          hover: "var(--color-accent-hover)",
          muted: "var(--color-accent-muted)",
        },
        "on-accent": "var(--color-on-accent)",
        brand: "var(--color-brand)",
        milk: "var(--color-milk)",
        // Legacy aliases (repointed to brand in globals.css)
        obsidian: "var(--color-obsidian)",
        charcoal: {
          DEFAULT: "var(--color-charcoal)",
          light: "var(--color-charcoal-light)",
          dark: "var(--color-charcoal-dark)",
        },
        champagne: {
          DEFAULT: "var(--color-champagne)",
          light: "var(--color-champagne-light)",
          dark: "var(--color-champagne-dark)",
          muted: "var(--color-champagne-muted)",
        },
        silver: "var(--color-silver)",
      },
      fontFamily: {
        heading: ["var(--font-space-grotesk)", "var(--font-inter)"],
        display: ["var(--font-space-grotesk)", "var(--font-inter)"],
        body: ["var(--font-inter)"],
      },
      letterSpacing: {
        luxury: '0.22em',
      },
      animation: {
        'fade-in-up': 'fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fadeIn 1.2s ease forwards',
        'shimmer': 'shimmer 4s linear infinite',
        'width-grow': 'widthGrow 1s ease forwards',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        widthGrow: {
          '0%': { width: '0' },
          '100%': { width: '80px' },
        }
      }
    },
  },
  plugins: [],
} satisfies Config;
