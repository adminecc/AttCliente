import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#18212f",
        rail: "#0f766e",
        signal: "#b45309",
        mist: "#f4f7f8",
        line: "#d8e1e6"
      },
      boxShadow: {
        soft: "0 16px 40px rgba(18, 33, 47, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
