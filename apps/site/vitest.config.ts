import { markdown } from "@foldkit/markdown/vite";
import { defineConfig } from "vitest/config";

import { diagrams } from "./src/build/diagrams-plugin.ts";
import { BragFrontmatter } from "./src/content/brag-frontmatter.ts";

export default defineConfig({
  plugins: [diagrams(), markdown({ frontmatter: BragFrontmatter })],
  test: {
    environment: "jsdom",
    include: ["test/**/*.test.ts"],
  },
});
