import { defineConfig } from "vite";
import { resolve } from "path";
import react from "@vitejs/plugin-react";

export default defineConfig({
  publicDir: "assets",
  server: {
    host: "0.0.0.0",
    port: 8080,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  plugins: [react()],
  build: {
    target: "esnext",
  },
});
