import * as Markdown from "@foldkit/markdown";
import { parseMarkdown } from "@foldkit/markdown/vite";
import { Option } from "effect";
import { expect as sceneExpect, given, scene, selector } from "foldkit/scene";
import { describe, expect, test } from "vitest";

import { renderedDiagrams } from "../src/content/diagrams.ts";
import {
  diagramsInMarkdown,
  renderDiagram,
  splitAccessibility,
} from "../src/diagrams/render.ts";
import { AppRoute, update, view } from "../src/main.ts";
import { markdownViewsWith } from "../src/markdown-views.ts";

const SOURCE = [
  "flowchart TD",
  "  accTitle: Two steps",
  "  accDescr: A leads to B.",
  "  A[start] --> B[finish]",
].join("\n");

describe("mermaid diagrams render to static SVG at build time", () => {
  test("accTitle and accDescr become the title and description", () => {
    const split = splitAccessibility(SOURCE);

    expect(split.title).toBe("Two steps");
    expect(split.maybeDescription).toEqual(Option.some("A leads to B."));
    expect(split.diagram).not.toContain("acc");
  });

  test("the SVG is an accessible image with no remote font import", () => {
    const diagram = Option.getOrThrow(renderDiagram(SOURCE, "t"));

    expect(diagram.svg).toMatch(
      /^<svg role="img" aria-labelledby="t-title t-desc"/u
    );
    expect(diagram.svg).toContain('<title id="t-title">Two steps</title>');
    expect(diagram.svg).toContain('<desc id="t-desc">A leads to B.</desc>');
    expect(diagram.svg).not.toMatch(
      /@import|googleapis|https?:\/\/(?!www\.w3\.org)/u
    );
    expect(diagram.svg).toContain('id="t-arrowhead"');
    expect(
      diagram.svg.match(/<svg[^>]*>/u)?.[0].match(/\sstyle="/gu)
    ).toHaveLength(1);
    expect(diagram.svg).toMatch(
      /<svg[^>]*style="max-width:\d+px;--bg:#ffffff;--fg:#0f1b2d/u
    );
    expect(diagram.svg).not.toContain('id="arrowhead"');
  });

  test("a diagram that fails to render is reported, not rendered", () => {
    const markdown = "# T\n\n```mermaid\nnot a diagram at all {{{\n```\n";
    const result = diagramsInMarkdown(markdown, "bad");

    expect(result.rendered).toHaveLength(0);
    expect(result.failed).toEqual(["not a diagram at all {{{"]);
  });

  test("every case-study diagram rendered with a caption", () => {
    expect(renderedDiagrams).toHaveLength(3);

    for (const diagram of renderedDiagrams) {
      expect(diagram.title).not.toBe("Architecture diagram");
    }
  });

  test("a case study shows the diagram as an image, not its source", () => {
    scene(
      { update, view },
      given({ route: AppRoute.Work({ slug: "suunto-coach" }) }),
      sceneExpect(selector('figure [tabindex="0"]')).toExist(),
      sceneExpect(selector("figure figcaption")).toHaveText(
        "suunto-coach architecture on Cloudflare"
      ),
      sceneExpect(selector("pre code")).not.toExist()
    );
  });

  test("without a rendered SVG the diagram falls back to its code block", () => {
    const document = parseMarkdown(
      "```mermaid\nflowchart TD\n  A --> B\n```\n"
    );

    scene(
      {
        update: (model: Readonly<Record<string, never>>) => ({ model }),
        view: () => ({
          body: Markdown.view(document, { views: markdownViewsWith([]) }),
          title: "fallback",
        }),
      },
      given({}),
      sceneExpect(selector("pre code")).toContainText("A --> B"),
      sceneExpect(selector("svg")).not.toExist()
    );
  });
});
