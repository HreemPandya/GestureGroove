import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sage: {
          50: "hsl(120, 60%, 97%)",
          100: "hsl(120, 40%, 94%)",
          200: "hsl(120, 30%, 85%)",
          300: "hsl(120, 25%, 75%)",
          400: "hsl(120, 20%, 65%)",
          500: "hsl(120, 15%, 55%)",
          600: "hsl(120, 20%, 45%)",
          700: "hsl(120, 25%, 35%)",
          800: "hsl(120, 30%, 25%)",
          900: "hsl(120, 35%, 15%)",
        },
        mint: {
          50: "hsl(150, 60%, 97%)",
          100: "hsl(150, 50%, 94%)",
          200: "hsl(150, 40%, 85%)",
          300: "hsl(150, 35%, 75%)",
          400: "hsl(150, 30%, 65%)",
          500: "hsl(150, 25%, 55%)",
          600: "hsl(150, 30%, 45%)",
          700: "hsl(150, 35%, 35%)",
          800: "hsl(150, 40%, 25%)",
          900: "hsl(150, 45%, 15%)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
