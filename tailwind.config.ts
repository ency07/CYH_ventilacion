import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050709",
        "bg-primary": "#050709",
        "bg-secondary": "#0b1120",
        "bg-tertiary": "#111827",
        "accent-cyan": "#00d4ff",
        "accent-cyan-soft": "rgba(0, 212, 255, 0.08)",
        "text-primary": "#f9fafb",
        "text-secondary": "#9ca3af",
        "text-muted": "#6b7280",
        "border-subtle": "rgba(255, 255, 255, 0.06)",
        "border-medium": "rgba(255, 255, 255, 0.12)",
        "border-active": "rgba(0, 212, 255, 0.4)",
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444",
        info: "#38bdf8",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-bebas-neue)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "16px",
        xl: "24px",
        "2xl": "32px",
      },
    },
  },
  plugins: [],
};
export default config;
