import * as Markdown from "@foldkit/markdown";
import { Predicate } from "effect";

import { inlineText } from "./inline-text.ts";
import { type Artifact, artifactSlug, portfolio } from "./portfolio.ts";

export const SECTION_HEADINGS = [
  "Context",
  "My role and constraints",
  "Key decisions",
  "What went wrong",
  "Result",
  "The evidence",
] as const;

export type CaseStudy = Readonly<{
  slug: string;
  title: string;
  meta: Markdown.Paragraph;
  body: Markdown.MarkdownDocument;
}>;

export type Work = Readonly<{
  artifact: Artifact;
  caseStudy: CaseStudy;
}>;

type MarkdownModule = Readonly<{ default: Markdown.MarkdownDocumentEncoded }>;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

export const slugFromPath = (path: string): string => {
  const slug = (path.split("/").at(-1) ?? "").replace(/\.md$/u, "");

  if (!SLUG_PATTERN.test(slug)) {
    throw new Error(
      `Case study file ${path} needs a kebab-case name, like case-studies/my-project.md.`
    );
  }

  return slug;
};

const headingTexts = (blocks: ReadonlyArray<Markdown.Block>) =>
  blocks.flatMap((block) =>
    Predicate.isTagged(block, "Heading") ? [inlineText(block.content)] : []
  );

export const caseStudyFromDocument = (
  slug: string,
  document: Markdown.MarkdownDocument
): CaseStudy => {
  const [titleBlock, metaBlock, ...rest] = document.blocks;

  if (!Predicate.isTagged(titleBlock, "Heading") || titleBlock.level !== 1) {
    throw new Error(
      `case-studies/${slug}.md must open with an outcome-first "# title".`
    );
  }

  if (!Predicate.isTagged(metaBlock, "Paragraph")) {
    throw new Error(
      `case-studies/${slug}.md needs the "**Live:** · **Code:** · **Skills proven:**" line under its title.`
    );
  }

  const headings = headingTexts(rest);

  const missing = SECTION_HEADINGS.filter(
    (heading) => !headings.includes(heading)
  );

  if (missing.length > 0) {
    throw new Error(
      `case-studies/${slug}.md is missing the section headings: ${missing.join(", ")}.`
    );
  }

  return {
    body: { blocks: rest },
    meta: metaBlock,
    slug,
    title: inlineText(titleBlock.content),
  };
};

export const joinWorks = (
  artifacts: ReadonlyArray<Artifact>,
  caseStudies: ReadonlyArray<CaseStudy>
): ReadonlyArray<Work> => {
  const artifactSlugs = new Set(artifacts.map(artifactSlug));

  const orphan = caseStudies.find(
    (caseStudy) => !artifactSlugs.has(caseStudy.slug)
  );

  if (orphan !== undefined) {
    throw new Error(
      `case-studies/${orphan.slug}.md has no artifact in portfolio.json whose case_study points at it.`
    );
  }

  return artifacts.map((artifact) => {
    const slug = artifactSlug(artifact);
    const caseStudy = caseStudies.find((study) => study.slug === slug);

    if (caseStudy === undefined) {
      throw new Error(
        `portfolio.json artifact ${artifact.name} points at ${artifact.case_study}, which does not exist.`
      );
    }

    return { artifact, caseStudy };
  });
};

const modules = import.meta.glob<MarkdownModule>(
  "../../../../case-studies/*.md",
  { eager: true }
);

export const caseStudies: ReadonlyArray<CaseStudy> = Object.entries(
  modules
).map(([path, module]) =>
  caseStudyFromDocument(
    slugFromPath(path),
    Markdown.decodeDocument(module.default)
  )
);

export const works: ReadonlyArray<Work> = joinWorks(
  portfolio.artifacts,
  caseStudies
);

export const findWork = (slug: string): Work | undefined =>
  works.find((work) => work.caseStudy.slug === slug);
