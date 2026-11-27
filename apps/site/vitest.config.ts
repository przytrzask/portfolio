import { markdown } from "@foldkit/markdown/vite";
import { defineConfig } from "vitest/config";

import { BragFrontmatter } from "./src/content/brag-frontmatter.ts";

export default defineConfig({
  plugins: [markdown({ frontmatter: BragFrontmatter })],
  test: {
    environment: "jsdom",
    include: ["test/**/*.test.ts"],
  },
});
