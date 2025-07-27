import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    // Output the build files to Django's static directory
    outDir: "../static",
    assetsDir: "",
    // Generate manifest file for Django
    manifest: true,
    rollupOptions: {
      input: resolve(__dirname, "src/main.jsx"),
    },
  },
  // Only use /static/ base for production builds
  base: process.env.NODE_ENV === 'production' ? "/static/" : "/",
});
