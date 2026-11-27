import { Option } from "effect";

import { type ShippedItem, shipped, shippedWhen } from "./content/brag.ts";
import { type Work, works } from "./content/case-studies.ts";
import { known, type Portfolio, portfolio } from "./content/portfolio.ts";
import { copy } from "./copy.ts";
import { displayName, markdownPath, siteOrigin } from "./meta.ts";
import { shippedHref, workHref } from "./route.ts";

export type StaticFile = Readonly<{ path: string; contents: string }>;

const caseStudySources = import.meta.glob<string>(
  "../../../case-studies/*.md",
  { eager: true, import: "default", query: "?raw" }
);

export const sourceFor = (slug: string): Option.Option<string> =>
  Option.fromUndefinedOr(
    Object.entries(caseStudySources).find(([path]) =>
      path.endsWith(`/${slug}.md`)
    )?.[1]
  );

const escapeXml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const urlFor = (origin: string, path: string): string =>
  path === "/" ? `${origin}/` : `${origin}${path}`;

export const sitemapXml = (
  origin: string,
  paths: ReadonlyArray<string>
): string =>
  [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...paths.map(
      (path) => `  <url><loc>${escapeXml(urlFor(origin, path))}</loc></url>`
    ),
    `</urlset>`,
    "",
  ].join("\n");

export const robotsTxt = (origin: string): string =>
  ["User-agent: *", "Allow: /", "", `Sitemap: ${origin}/sitemap.xml`, ""].join(
    "\n"
  );

const linkLines = (record: Portfolio): ReadonlyArray<string> => [
  ...Option.toArray(
    Option.map(
      known(record.profile.email),
      (email) => `- Email: mailto:${email}`
    )
  ),
  ...Option.toArray(
    Option.map(known(record.links.github), (url) => `- GitHub: ${url}`)
  ),
  ...Option.toArray(
    Option.map(known(record.links.linkedin), (url) => `- LinkedIn: ${url}`)
  ),
  `- Resume (PDF): ${siteOrigin(record)}${copy.resumeHref}`,
];

export const llmsTxt = (
  record: Portfolio,
  listed: ReadonlyArray<Work>
): string => {
  const origin = siteOrigin(record);

  return [
    `# ${displayName(record)}`,
    "",
    `> ${record.profile.headline}`,
    "",
    `${record.profile.target_role}. Every case study below is also published as Markdown. Facts still missing are marked [ask: …] rather than invented.`,
    "",
    "## Links",
    "",
    ...linkLines(record),
    "",
    "## Case studies",
    "",
    ...listed.map(
      (work) =>
        `- [${work.caseStudy.title}](${origin}${markdownPath(workHref(work.caseStudy.slug))}): ${work.artifact.one_liner}. Proof: ${work.artifact.proof.value} ${work.artifact.proof.label}.`
    ),
    "",
    "## Shipped",
    "",
    `- [${copy.shippedMarkdownTitle}](${origin}${markdownPath(shippedHref())}): ${copy.shippedIntro}`,
    "",
  ].join("\n");
};

const shippedEntry = (item: ShippedItem): string =>
  [
    `## ${item.what}`,
    "",
    `- When: ${shippedWhen(item).text}`,
    `- Area: ${item.area}`,
    `- ${copy.shippedImpact}: ${item.impact}`,
    `- ${copy.shippedSkills}: ${item.skills.join(", ")}`,
    `- ${copy.shippedArtifact}: ${item.artifact}`,
    `- ${copy.shippedProof}: ${Option.getOrElse(item.maybeProofUrl, () => item.proof)}`,
    "",
  ].join("\n");

export const shippedMarkdown = (items: ReadonlyArray<ShippedItem>): string =>
  [
    `# ${copy.shippedMarkdownTitle}`,
    "",
    copy.shippedIntro,
    "",
    ...(items.length === 0 ? [copy.shippedEmpty, ""] : items.map(shippedEntry)),
  ].join("\n");

export const markdownCopies = (
  listed: ReadonlyArray<Work>
): ReadonlyArray<StaticFile> =>
  listed.map((work) => {
    const path = markdownPath(workHref(work.caseStudy.slug));

    return Option.match(sourceFor(work.caseStudy.slug), {
      onNone: () => {
        throw new Error(
          `case-studies/${work.caseStudy.slug}.md has no raw source to copy to ${path}.`
        );
      },
      onSome: (contents) => ({ contents, path }),
    });
  });

export const staticFiles = (
  paths: ReadonlyArray<string>
): ReadonlyArray<StaticFile> => {
  const origin = siteOrigin();

  return [
    { contents: robotsTxt(origin), path: "/robots.txt" },
    { contents: sitemapXml(origin, paths), path: "/sitemap.xml" },
    { contents: llmsTxt(portfolio, works), path: "/llms.txt" },
    { contents: shippedMarkdown(shipped), path: markdownPath(shippedHref()) },
    ...markdownCopies(works),
  ];
};
