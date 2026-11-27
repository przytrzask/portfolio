// @effect-diagnostics nodeBuiltinImport:off -- This test reads the emitted build from disk.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

import { prerenderPaths } from "../src/entry.server.ts";

const client = join(process.cwd(), "dist/client");

const read = (path: string): string => readFileSync(join(client, path), "utf8");

const pageFile = (path: string): string =>
  path === "/" ? "index.html" : `${path.slice(1)}/index.html`;

describe("build output", () => {
  test.each([
    "robots.txt",
    "sitemap.xml",
    "llms.txt",
    "shipped.md",
    "404.html",
    "og.png",
    "favicon.svg",
    "favicon.ico",
  ])("dist/client/%s exists", (file) => {
    expect(existsSync(join(client, file))).toBe(true);
  });

  test.each(prerenderPaths)("%s has its metadata in the raw HTML", (path) => {
    const html = read(pageFile(path));

    expect(html).toMatch(/<html lang="en">/u);
    expect(html).toMatch(/<meta name="description" content="[^"]{50,}">/u);
    expect(html).toContain('<meta property="og:image" content="https://');
    expect(html).toContain('<script type="application/ld+json">');
    expect(html).toContain('<link rel="canonical" href="https://');
    expect(html).not.toContain("noindex");
    expect(html).not.toMatch(/<(?:meta|link)[^>]*\[ask/u);
  });

  test("404.html is the noindex not found view", () => {
    const html = read("404.html");

    expect(html).toContain('<meta name="robots" content="noindex">');
    expect(html).toContain("Not found");
  });

  test("case studies ship their diagrams as inline SVG, without mermaid JS", () => {
    const html = read("work/ticket-to-merge/index.html");

    expect(html).toMatch(
      /<figure[^>]*>.*?<svg role="img" aria-labelledby="diagram-ticket-to-merge-0-title/su
    );
    expect(html).not.toContain("```mermaid");
    expect(html).not.toContain("fonts.googleapis");
  });
});
