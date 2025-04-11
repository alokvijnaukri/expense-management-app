import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: "hsl(var(--primary-hue), 95%, 97%)",
          100: "hsl(var(--primary-hue), 90%, 92%)",
          200: "hsl(var(--primary-hue), 85%, 85%)",
          300: "hsl(var(--primary-hue), 80%, 75%)",
          400: "hsl(var(--primary-hue), 80%, 65%)",
          500: "hsl(var(--primary-hue), 75%, 55%)",
          600: "hsl(var(--primary-hue), 80%, 45%)",
          700: "hsl(var(--primary-hue), 80%, 35%)",
          800: "hsl(var(--primary-hue), 85%, 25%)",
          900: "hsl(var(--primary-hue), 90%, 20%)",
          950: "hsl(var(--primary-hue), 95%, 12%)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          50: "hsl(145, 95%, 97%)",
          100: "hsl(145, 90%, 92%)",
          200: "hsl(145, 85%, 85%)",
          300: "hsl(145, 80%, 75%)",
          400: "hsl(145, 75%, 65%)",
          500: "hsl(145, 70%, 50%)",
          600: "hsl(145, 75%, 40%)",
          700: "hsl(145, 80%, 30%)",
          800: "hsl(145, 85%, 20%)",
          900: "hsl(145, 90%, 15%)",
          DEFAULT: "hsl(145, 70%, 50%)",
        },
        warning: {
          50: "hsl(45, 95%, 97%)",
          100: "hsl(45, 90%, 92%)",
          200: "hsl(45, 85%, 85%)",
          300: "hsl(45, 80%, 80%)",
          400: "hsl(45, 75%, 70%)",
          500: "hsl(45, 70%, 60%)",
          600: "hsl(45, 75%, 50%)",
          700: "hsl(45, 80%, 40%)",
          800: "hsl(45, 85%, 30%)",
          900: "hsl(45, 90%, 20%)",
          DEFAULT: "hsl(45, 75%, 50%)",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--primary-hue), 75%, 55%)",
          "2": "hsl(calc(var(--primary-hue) + 40), 70%, 50%)",
          "3": "hsl(calc(var(--primary-hue) + 80), 70%, 50%)",
          "4": "hsl(calc(var(--primary-hue) + 120), 70%, 50%)",
          "5": "hsl(calc(var(--primary-hue) + 180), 70%, 50%)",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
