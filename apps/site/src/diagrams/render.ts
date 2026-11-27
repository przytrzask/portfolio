import type * as Markdown from "@foldkit/markdown";
import { parseMarkdown } from "@foldkit/markdown/vite";
import { renderMermaidSVG } from "beautiful-mermaid";
import { Match, Option, Predicate, Result } from "effect";

import {
  DEFAULT_DIAGRAM_TITLE,
  MERMAID_LANGUAGE,
  type RenderedDiagram,
} from "./diagram.ts";

export const DIAGRAM_COLORS = {
  accent: "#1f6feb",
  bg: "#ffffff",
  border: "#0f1b2d",
  fg: "#0f1b2d",
  font: "TASA Orbiter Variable",
  line: "#3a5a8c",
  muted: "#26384f",
  surface: "#e9eff7",
} as const;

export type Accessibility = Readonly<{
  title: string;
  maybeDescription: Option.Option<string>;
  diagram: string;
}>;

const ACC_LINE = /^\s*(accTitle|accDescr)\s*:\s*(.*)$/u;

export const splitAccessibility = (source: string): Accessibility => {
  const lines = source.split("\n");
  const kept: string[] = [];
  let title = DEFAULT_DIAGRAM_TITLE;
  let maybeDescription: Option.Option<string> = Option.none();

  for (const line of lines) {
    const match = ACC_LINE.exec(line);

    if (match === null) {
      kept.push(line);
    } else if (match[1] === "accTitle") {
      title = (match[2] ?? "").trim() || DEFAULT_DIAGRAM_TITLE;
    } else {
      maybeDescription = Option.some((match[2] ?? "").trim());
    }
  }

  return { diagram: kept.join("\n"), maybeDescription, title };
};

const escapeXml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const REMOTE_IMPORT = /@import\s+url\([^)]*\);?/gu;

const prefixIds = (svg: string, prefix: string): string =>
  svg
    .replaceAll(/\sid="([^"]+)"/gu, ` id="${prefix}-$1"`)
    .replaceAll(/url\(#([^)]+)\)/gu, `url(#${prefix}-$1)`)
    .replaceAll(/href="#([^"]+)"/gu, `href="#${prefix}-$1"`);

const naturalWidth = (svg: string): Option.Option<string> =>
  Option.fromNullishOr(/<svg[^>]*\swidth="([\d.]+)"/u.exec(svg)?.[1]);

const accessibleRoot = (
  svg: string,
  prefix: string,
  accessibility: Accessibility
): string => {
  const titleId = `${prefix}-title`;
  const descId = `${prefix}-desc`;
  const hasDescription = Option.isSome(accessibility.maybeDescription);
  const labelledBy = hasDescription ? `${titleId} ${descId}` : titleId;

  const maxWidth = Option.match(naturalWidth(svg), {
    onNone: () => "",
    onSome: (width) => `max-width:${Math.ceil(Number(width))}px;`,
  });

  const titleElement = `<title id="${titleId}">${escapeXml(accessibility.title)}</title>`;

  const descElement = Option.match(accessibility.maybeDescription, {
    onNone: () => "",
    onSome: (description) =>
      `<desc id="${descId}">${escapeXml(description)}</desc>`,
  });

  return svg
    .replace(
      /<svg\s/u,
      `<svg role="img" aria-labelledby="${labelledBy}" focusable="false" data-diagram="${prefix}" `
    )
    .replace(/(<svg[^>]*?\sstyle=")/u, `$1${maxWidth}`)
    .replace(/(<svg[^>]*>)/u, `$1${titleElement}${descElement}`)
    .replace(/(<svg[^>]*?)\s(width|height)="[\d.]+"/u, "$1")
    .replace(/(<svg[^>]*?)\s(width|height)="[\d.]+"/u, "$1");
};

export const renderDiagram = (
  source: string,
  prefix: string
): Option.Option<RenderedDiagram> => {
  const accessibility = splitAccessibility(source);

  return Result.match(
    Result.try(() =>
      renderMermaidSVG(accessibility.diagram, {
        ...DIAGRAM_COLORS,
        transparent: true,
      })
    ),
    {
      onFailure: () => Option.none(),
      onSuccess: (raw) =>
        raw.includes("<svg")
          ? Option.some({
              source,
              svg: accessibleRoot(
                prefixIds(raw.replaceAll(REMOTE_IMPORT, ""), prefix),
                prefix,
                accessibility
              ),
              title: accessibility.title,
            })
          : Option.none(),
    }
  );
};

const childBlocks = (block: Markdown.Block): ReadonlyArray<Markdown.Block> =>
  Match.value(block).pipe(
    Match.tag("List", ({ items }) => items.flatMap((item) => item.blocks)),
    Match.tag("Blockquote", ({ blocks }) => blocks),
    Match.orElse(() => [])
  );

const mermaidSources = (
  blocks: ReadonlyArray<Markdown.Block>
): ReadonlyArray<string> =>
  blocks.flatMap((block) =>
    Predicate.isTagged(block, "CodeBlock") &&
    Option.contains(block.maybeLanguage, MERMAID_LANGUAGE)
      ? [block.value]
      : mermaidSources(childBlocks(block))
  );

export type MarkdownDiagrams = Readonly<{
  rendered: ReadonlyArray<RenderedDiagram>;
  failed: ReadonlyArray<string>;
}>;

export const diagramsInMarkdown = (
  markdownSource: string,
  key: string
): MarkdownDiagrams => {
  const sources = mermaidSources(parseMarkdown(markdownSource).blocks);

  const results = sources.map((source, index) => ({
    maybeDiagram: renderDiagram(source, `diagram-${key}-${index}`),
    source,
  }));

  return {
    failed: results.flatMap(({ maybeDiagram, source }) =>
      Option.isNone(maybeDiagram) ? [source] : []
    ),
    rendered: results.flatMap(({ maybeDiagram }) =>
      Option.toArray(maybeDiagram)
    ),
  };
};
