import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Ignore known eval warning emitted by upstream lottie-web bundle.
        if (
          warning.code === "EVAL" &&
          typeof warning.id === "string" &&
          warning.id.includes("lottie-web/build/player/lottie.js")
        ) {
          return;
        }
        warn(warning);
      },
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-select", "@radix-ui/react-toast"],
          router: ["react-router-dom"],
          icons: ["lucide-react"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    minify: "esbuild",
  }
});
