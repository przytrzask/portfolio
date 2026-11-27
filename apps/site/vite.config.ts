import { fileURLToPath } from "node:url";

import { markdown } from "@foldkit/markdown/vite";
import { foldkit } from "@foldkit/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

import { BragFrontmatter } from "./src/content/brag-frontmatter.ts";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig({
  optimizeDeps: {
    exclude: ["@foldkit/devtools", "foldkit/devtools-host"],
  },
  plugins: [
    tailwindcss(),
    markdown({ frontmatter: BragFrontmatter }),
    foldkit({
      ssr: {
        build: {
          prerender: { origin: "https://portfolio.przytrzask.workers.dev" },
        },
        clientEntry: "/src/entry.ts",
        serverEntry: "/src/entry.server.ts",
      },
    }),
  ],
  publicDir: `${repoRoot}public`,
  server: {
    fs: { allow: [repoRoot] },
  },
});
