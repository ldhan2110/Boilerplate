import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    plugins: [
      react(),
      tailwindcss(),
      visualizer({
        filename: "dist/stats.html",
        gzipSize: true,
        brotliSize: true,
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@hooks": path.resolve(__dirname, "src/hooks"),
        "@stores": path.resolve(__dirname, "src/stores"),
        "@services": path.resolve(__dirname, "src/services"),
        "@utils": path.resolve(__dirname, "src/utils"),
        "@constants": path.resolve(__dirname, "src/constants"),
        "@components": path.resolve(__dirname, "src/components"),
        "@types": path.resolve(__dirname, "src/types"),
        "@configs": path.resolve(__dirname, "src/configs"),
      },
    },
    server: {
      strictPort: true,
      port: env.VITE_PORT ? parseInt(env.VITE_PORT, 10) : 3000,
    },
  };
});
// This configuration sets up Vite with React and Tailwind CSS, defines path aliases for easier imports, and configures the server port based on environment variables. It also ensures compatibility with the latest React features and optimizes the build process.
