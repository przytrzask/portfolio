import * as Markdown from "@foldkit/markdown";
import { Array, Option, Predicate, Schema } from "effect";

import { BragFrontmatter } from "./brag-frontmatter.ts";
import { inlineText, slugify } from "./inline-text.ts";

export type ShippedItem = Readonly<{
  file: string;
  anchor: string;
  periodStart: string;
  periodEnd: string;
  maybeDate: Option.Option<string>;
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

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/u;

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

type DateParts = Readonly<{ year: string; month: string; day: string }>;

const dateParts = (isoDate: string): DateParts => {
  const [year = "", month = "", day = ""] = isoDate.split("-");

  return {
    day: String(Number(day)),
    month: MONTHS[Number(month) - 1] ?? month,
    year,
  };
};

export const formatDate = (isoDate: string): string => {
  const { day, month, year } = dateParts(isoDate);

  return `${day} ${month} ${year}`;
};

export const formatPeriod = (start: string, end: string): string => {
  const from = dateParts(start);
  const to = dateParts(end);

  if (start === end) {
    return formatDate(end);
  }

  if (from.year !== to.year) {
    return `${formatDate(start)} – ${formatDate(end)}`;
  }

  return from.month === to.month
    ? `${from.day}–${to.day} ${to.month} ${to.year}`
    : `${from.day} ${from.month} – ${to.day} ${to.month} ${to.year}`;
};

export type ShippedWhen = Readonly<{
  maybeDateTime: Option.Option<string>;
  text: string;
}>;

export const shippedWhen = (item: ShippedItem): ShippedWhen =>
  Option.match(item.maybeDate, {
    onNone: () => ({
      maybeDateTime: Option.none(),
      text: formatPeriod(item.periodStart, item.periodEnd),
    }),
    onSome: (date) => ({
      maybeDateTime: Option.some(date),
      text: formatDate(date),
    }),
  });

export const shippedSortKey = (item: ShippedItem): string =>
  Option.getOrElse(item.maybeDate, () => item.periodEnd);

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

const fieldDate = (
  file: string,
  draft: Draft,
  meta: BragFrontmatter
): Option.Option<string> => {
  const text = fieldText(draft, "Date");

  if (text === "") {
    return Option.none();
  }

  if (!ISO_DATE.test(text)) {
    throw new Error(
      `brag/entries/${file}: "${draft.what}" has Date "${text}"; write it as YYYY-MM-DD.`
    );
  }

  if (text < meta.period_start || text > meta.period_end) {
    throw new Error(
      `brag/entries/${file}: "${draft.what}" has Date ${text}, outside the entry's period ${meta.period_start} to ${meta.period_end}.`
    );
  }

  return Option.some(text);
};

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
    maybeDate: fieldDate(file, draft, meta),
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
  .toSorted((left, right) =>
    shippedSortKey(right).localeCompare(shippedSortKey(left))
  );
