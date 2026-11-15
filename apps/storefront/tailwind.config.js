const path = require("path")

// DAYMARK design tokens.
// Single source of truth for the storefront visual system: colour, type scale,
// spacing rhythm, radius, elevation and motion. Components should compose these
// names instead of hard-coding hex values or ad-hoc pixel sizes.
const daymark = {
  color: {
    // Warm paper base and ink.
    ivory: {
      50: "#FBF9F4",
      100: "#F6F2E9",
      200: "#EFE9DB",
      300: "#E4DCCB",
      400: "#D3C8B4",
    },
    charcoal: {
      500: "#4A4B45",
      600: "#3A3B36",
      700: "#2C2D29",
      800: "#242722",
      900: "#1B1D1A",
    },
    // Muted olive accent: labels, focus, selected states.
    olive: {
      50: "#F1F2E9",
      100: "#E3E6D4",
      200: "#CBD1B2",
      300: "#A9B189",
      400: "#7F8A5F",
      500: "#5F6B45",
      600: "#4B5537",
      700: "#3A422B",
    },
    // Supporting warm neutral for fine borders and tertiary text.
    sand: {
      100: "#EDE7DA",
      200: "#DED6C5",
      300: "#C3B9A5",
      400: "#9A907C",
    },
    // Semantic aliases resolved to CSS variables so a section can re-theme
    // locally (for example an inverted editorial band) without new palettes.
    canvas: "rgb(var(--dm-canvas) / <alpha-value>)",
    surface: "rgb(var(--dm-surface) / <alpha-value>)",
    // Soft stage plane: one step warmer than canvas, for the showroom surface.
    stage: "rgb(var(--dm-stage) / <alpha-value>)",
    // Product media window behind a garment plate.
    "product-plate": "rgb(var(--dm-plate) / <alpha-value>)",
    inverse: "rgb(var(--dm-inverse) / <alpha-value>)",
    ink: "rgb(var(--dm-ink) / <alpha-value>)",
    "ink-muted": "rgb(var(--dm-ink-muted) / <alpha-value>)",
    "ink-faint": "rgb(var(--dm-ink-faint) / <alpha-value>)",
    line: "rgb(var(--dm-line) / <alpha-value>)",
    "line-strong": "rgb(var(--dm-line-strong) / <alpha-value>)",
    accent: "rgb(var(--dm-accent) / <alpha-value>)",
    "accent-soft": "rgb(var(--dm-accent-soft) / <alpha-value>)",
    "accent-ink": "rgb(var(--dm-accent-ink) / <alpha-value>)",
    success: "rgb(var(--dm-success) / <alpha-value>)",
    warning: "rgb(var(--dm-warning) / <alpha-value>)",
    danger: "rgb(var(--dm-danger) / <alpha-value>)",
  },
  fontFamily: {
    sans: ["Inter Variable", "Inter", "system-ui", "sans-serif"],
    display: ["Inter Variable", "Inter", "system-ui", "sans-serif"],
    // Editorial serif for pull quotes and collection headlines.
    editorial: ["Georgia", "Times New Roman", "serif"],
  },
  // Fluid editorial scale. Each step is a clamp so mobile and desktop share
  // one rhythm without breakpoint-specific font sizes in components.
  fontSize: {
    "dm-micro": ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.12em" }],
    "dm-caption": ["0.75rem", { lineHeight: "1.125rem", letterSpacing: "0.02em" }],
    "dm-small": ["0.8125rem", { lineHeight: "1.25rem", letterSpacing: "0.01em" }],
    "dm-body": ["0.9375rem", { lineHeight: "1.625rem" }],
    "dm-lead": ["1.0625rem", { lineHeight: "1.75rem" }],
    "dm-title-sm": ["1.125rem", { lineHeight: "1.5rem", letterSpacing: "-0.005em" }],
    "dm-title": ["1.375rem", { lineHeight: "1.75rem", letterSpacing: "-0.01em" }],
    "dm-title-lg": [
      "clamp(1.75rem, 3vw, 2.5rem)",
      { lineHeight: "1.15", letterSpacing: "-0.03em" },
    ],
    "dm-display": [
      "clamp(2.25rem, 6vw, 3.75rem)",
      { lineHeight: "1.04", letterSpacing: "-0.025em" },
    ],
    "dm-display-lg": [
      "clamp(2.75rem, 8vw, 5.25rem)",
      { lineHeight: "0.98", letterSpacing: "-0.03em" },
    ],
  },
  // Flat keys so Tailwind emits `dm-1` … `dm-32` utilities directly.
  spacing: {
    "dm-1": "0.25rem",
    "dm-2": "0.5rem",
    "dm-3": "0.75rem",
    "dm-4": "1rem",
    "dm-5": "1.25rem",
    "dm-6": "1.5rem",
    "dm-8": "2rem",
    "dm-10": "2.5rem",
    "dm-12": "3rem",
    "dm-16": "4rem",
    "dm-20": "5rem",
    "dm-24": "6rem",
    "dm-32": "8rem",
  },
  // Understated geometry: near-square surfaces, pill only for chips/actions.
  borderRadius: {
    "dm-xs": "3px",
    "dm-sm": "6px",
    "dm-md": "4px",
    "dm-lg": "6px",
    "dm-xl": "8px",
    "dm-2xl": "10px",
    "dm-3xl": "12px",
    "dm-pill": "9999px",
  },
  maxWidth: {
    "dm-prose": "38rem",
    "dm-shell": "1400px",
    "dm-wide": "1680px",
  },
}

module.exports = {
  darkMode: "class",
  presets: [require("@medusajs/ui-preset")],
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/modules/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      transitionProperty: {
        width: "width margin",
        height: "height",
        bg: "background-color",
        display: "display opacity",
        visibility: "visibility",
        padding: "padding-top padding-right padding-bottom padding-left",
      },
      colors: {
        ...daymark.color,
        grey: {
          0: "#FFFFFF",
          5: "#F9FAFB",
          10: "#F3F4F6",
          20: "#E5E7EB",
          30: "#D1D5DB",
          40: "#9CA3AF",
          50: "#6B7280",
          60: "#4B5563",
          70: "#374151",
          80: "#1F2937",
          90: "#111827",
        },
      },
      fontFamily: daymark.fontFamily,
      fontSize: daymark.fontSize,
      spacing: daymark.spacing,
      borderRadius: {
        none: "0px",
        soft: "2px",
        base: "4px",
        rounded: "8px",
        large: "16px",
        circle: "9999px",
        ...daymark.borderRadius,
      },
      maxWidth: {
        "8xl": "100rem",
        ...daymark.maxWidth,
      },
      screens: {
        "2xsmall": "320px",
        xsmall: "512px",
        small: "1024px",
        medium: "1280px",
        large: "1440px",
        xlarge: "1680px",
        "2xlarge": "1920px",
      },
      boxShadow: {
        "dm-card": "0 1px 2px rgb(27 29 26 / 0.04), 0 12px 32px -24px rgb(27 29 26 / 0.24)",
        "dm-raised": "0 2px 6px rgb(27 29 26 / 0.06), 0 24px 64px -32px rgb(27 29 26 / 0.32)",
        "dm-focus": "0 0 0 2px rgb(var(--dm-canvas)), 0 0 0 4px rgb(var(--dm-accent))",
      },
      transitionTimingFunction: {
        "dm-out": "cubic-bezier(0.22, 0.61, 0.36, 1)",
        "dm-in-out": "cubic-bezier(0.65, 0, 0.35, 1)",
      },
      keyframes: {
        ring: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "fade-in-right": {
          "0%": {
            opacity: "0",
            transform: "translateX(10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateX(0)",
          },
        },
        "fade-in-top": {
          "0%": {
            opacity: "0",
            transform: "translateY(-10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "fade-out-top": {
          "0%": {
            height: "100%",
          },
          "99%": {
            height: "0",
          },
          "100%": {
            visibility: "hidden",
          },
        },
        "accordion-slide-up": {
          "0%": {
            height: "var(--radix-accordion-content-height)",
            opacity: "1",
          },
          "100%": {
            height: "0",
            opacity: "0",
          },
        },
        "accordion-slide-down": {
          "0%": {
            "min-height": "0",
            "max-height": "0",
            opacity: "0",
          },
          "100%": {
            "min-height": "var(--radix-accordion-content-height)",
            "max-height": "none",
            opacity: "1",
          },
        },
        enter: {
          "0%": { transform: "scale(0.9)", opacity: 0 },
          "100%": { transform: "scale(1)", opacity: 1 },
        },
        leave: {
          "0%": { transform: "scale(1)", opacity: 1 },
          "100%": { transform: "scale(0.9)", opacity: 0 },
        },
        "slide-in": {
          "0%": { transform: "translateY(-100%)" },
          "100%": {
            transform: "translateY(0)",
          },
        },
      },
      animation: {
        ring: "ring 2.2s cubic-bezier(0.5, 0, 0.5, 1) infinite",
        "fade-in-right": "fade-in-right 0.3s cubic-bezier(0.5, 0, 0.5, 1) forwards",
        "fade-in-top": "fade-in-top 0.2s cubic-bezier(0.5, 0, 0.5, 1) forwards",
        "fade-out-top": "fade-out-top 0.2s cubic-bezier(0.5, 0, 0.5, 1) forwards",
        "accordion-open": "accordion-slide-down 300ms cubic-bezier(0.87, 0, 0.13, 1) forwards",
        "accordion-close": "accordion-slide-up 300ms cubic-bezier(0.87, 0, 0.13, 1) forwards",
        enter: "enter 200ms ease-out",
        "slide-in": "slide-in 1.2s cubic-bezier(.41,.73,.51,1.02)",
        leave: "leave 150ms ease-in forwards",
      },
    },
  },
  plugins: [require("tailwindcss-radix")()],
}
