import type * as Markdown from "@foldkit/markdown";
import { Match } from "effect";

export const inlineText = (inlines: ReadonlyArray<Markdown.Inline>): string =>
  inlines.map(inlineNodeText).join("");

const inlineNodeText = (inline: Markdown.Inline): string =>
  Match.valueTags(inline, {
    Emphasis: ({ content }) => inlineText(content),
    HardBreak: () => " ",
    Image: ({ alt }) => alt,
    InlineCode: ({ value }) => value,
    Link: ({ content }) => inlineText(content),
    Strikethrough: ({ content }) => inlineText(content),
    Strong: ({ content }) => inlineText(content),
    Text: ({ value }) => value,
  });

export const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, "-")
    .replaceAll(/^-+|-+$/gu, "");
