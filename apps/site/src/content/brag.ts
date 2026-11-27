import * as Markdown from "@foldkit/markdown";
import { Array, Option, Predicate, Schema } from "effect";

import { BragFrontmatter } from "./brag-frontmatter.ts";
import { inlineText, slugify } from "./inline-text.ts";

export type ShippedItem = Readonly<{
  file: string;
  anchor: string;
  periodStart: string;
  periodEnd: string;
  area: string;
  what: string;
  impact: string;
  skills: ReadonlyArray<string>;
  artifact: string;
  proof: string;
  maybeProofUrl: Option.Option<string>;
}>;

type BragModule = Readonly<{
  default: Markdown.MarkdownDocumentEncoded;
  frontmatter: Readonly<Record<string, string>> | undefined;
}>;

type Draft = Readonly<{
  area: string;
  what: string;
  fields: ReadonlyArray<
    Readonly<{ label: string; inlines: Markdown.Inline[] }>
  >;
}>;

const decodeFrontmatter = Schema.decodeUnknownSync(BragFrontmatter);

const firstLinkUrl = (
  inlines: ReadonlyArray<Markdown.Inline>
): Option.Option<string> =>
  Array.findFirst(inlines, (inline) =>
    Predicate.isTagged(inline, "Link") ? Option.some(inline.url) : Option.none()
  );

const listFields = (list: Markdown.List) =>
  list.items.flatMap((item) => {
    const [first] = item.blocks;

    if (!Predicate.isTagged(first, "Paragraph")) {
      return [];
    }

    const text = inlineText(first.content);
    const colon = text.indexOf(":");

    return colon === -1
      ? []
      : [{ inlines: [...first.content], label: text.slice(0, colon).trim() }];
  });

const drafts = (blocks: ReadonlyArray<Markdown.Block>) => {
  const collected: Draft[] = [];
  let area = "";

  for (const block of blocks) {
    if (Predicate.isTagged(block, "Heading") && block.level === 2) {
      area = inlineText(block.content).trim();
    } else if (Predicate.isTagged(block, "Heading") && block.level === 3) {
      collected.push({
        area,
        fields: [],
        what: inlineText(block.content).trim(),
      });
    } else if (Predicate.isTagged(block, "List") && collected.length > 0) {
      const last = collected.pop();

      if (last !== undefined) {
        collected.push({
          ...last,
          fields: [...last.fields, ...listFields(block)],
        });
      }
    }
  }

  return collected;
};

const fieldText = (draft: Draft, label: string) =>
  Option.match(
    Array.findFirst(draft.fields, (field) => field.label === label),
    {
      onNone: () => "",
      onSome: (field) => {
        const text = inlineText(field.inlines);

        return text.slice(text.indexOf(":") + 1).trim();
      },
    }
  );

const fieldLink = (draft: Draft, label: string) =>
  Option.flatMap(
    Array.findFirst(draft.fields, (field) => field.label === label),
    (field) => firstLinkUrl(field.inlines)
  );

export const bragItems = (
  file: string,
  frontmatter: Readonly<Record<string, string>> | undefined,
  document: Markdown.MarkdownDocument
): ReadonlyArray<ShippedItem> => {
  if (frontmatter === undefined) {
    return [];
  }

  const meta = decodeFrontmatter(frontmatter);

  if (meta.status !== "curated") {
    return [];
  }

  return drafts(document.blocks).map((draft) => ({
    anchor: slugify(draft.what),
    area: draft.area,
    artifact: fieldText(draft, "Portfolio artifact"),
    file,
    impact: fieldText(draft, "Impact"),
    maybeProofUrl: fieldLink(draft, "Proof"),
    periodEnd: meta.period_end,
    periodStart: meta.period_start,
    proof: fieldText(draft, "Proof"),
    skills: fieldText(draft, "Skills")
      .split(/[,;]/u)
      .map((skill) => skill.trim())
      .filter((skill) => skill !== ""),
    what: draft.what,
  }));
};

const modules = import.meta.glob<BragModule>("../../../../brag/entries/*.md", {
  eager: true,
});

export const shipped: ReadonlyArray<ShippedItem> = Object.entries(modules)
  .flatMap(([path, module]) =>
    bragItems(
      path.split("/").at(-1) ?? path,
      module.frontmatter,
      Markdown.decodeDocument(module.default)
    )
  )
  .toSorted((left, right) => right.periodEnd.localeCompare(left.periodEnd));
