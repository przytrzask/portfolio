import { foldkit } from "@foldkit/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  optimizeDeps: {
    exclude: ["@foldkit/devtools", "foldkit/devtools-host"],
  },
  plugins: [
    tailwindcss(),
    foldkit({
      ssr: {
        build: { prerender: { origin: "https://example.com" } },
        clientEntry: "/src/entry.ts",
        serverEntry: "/src/entry.server.ts",
      },
    }),
  ],
});
