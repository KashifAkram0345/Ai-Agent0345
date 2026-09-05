import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#090b12",
        panel: "#10131d",
        line: "#252a3a",
        lilac: "#a78bfa",
        mint: "#6ee7b7",
      },
      boxShadow: {
        glow: "0 0 60px rgba(139, 92, 246, 0.16)",
      },
    },
  },
  plugins: [],
};

export default config;