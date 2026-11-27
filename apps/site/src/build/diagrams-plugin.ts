import type { Plugin } from "vite";

import { diagramsInMarkdown } from "../diagrams/render.ts";

export const DIAGRAMS_QUERY = "?diagrams";

const slugOf = (file: string): string =>
  (file.split("/").at(-1) ?? file)
    .replace(/\.md$/u, "")
    .replaceAll(/[^a-z0-9-]/gu, "-");

export const diagrams = (): Plugin => ({
  enforce: "pre",
  name: "portfolio-diagrams",
  transform(source, id) {
    if (!id.endsWith(DIAGRAMS_QUERY)) {
      return undefined;
    }

    const file = id.slice(0, -DIAGRAMS_QUERY.length);
    const { failed, rendered } = diagramsInMarkdown(source, slugOf(file));

    for (const failedSource of failed) {
      this.warn(
        `${file}: a mermaid diagram did not render, so the page shows its source as a code block:\n${failedSource}`
      );
    }

    return { code: `export default ${JSON.stringify(rendered)}`, map: null };
  },
});
