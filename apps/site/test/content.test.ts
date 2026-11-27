import { parseMarkdownWithFrontmatter } from "@foldkit/markdown/vite";
import { Option } from "effect";
import { describe, expect, test } from "vitest";

import portfolioJson from "../../../portfolio.json";
import { BragFrontmatter } from "../src/content/brag-frontmatter.ts";
import {
  bragItems,
  formatPeriod,
  shipped,
  shippedSortKey,
  shippedWhen,
} from "../src/content/brag.ts";
import {
  caseStudies,
  caseStudyFromDocument,
  joinWorks,
  SECTION_HEADINGS,
  slugFromPath,
  works,
} from "../src/content/case-studies.ts";
import {
  artifactSlug,
  decodePortfolio,
  known,
  portfolio,
} from "../src/content/portfolio.ts";

const parse = (source: string) =>
  parseMarkdownWithFrontmatter(source, { frontmatter: BragFrontmatter });

const bragSource = (status: string, dateLine = "- Date: 2026-11-23\n") => `---
type: brag-entry
period_start: 2026-11-21
period_end: 2026-11-27
status: ${status}
---

## e2e-inc/e2e

### Added test.slow() to the e2e test runner

${dateLine}- Impact: Merged on 2026-11-23
- Skills: TypeScript, Open source; Mutation testing
- Portfolio artifact: ai-sdlc-rollout
- Proof: https://github.com/e2e-inc/e2e/pull/1982
`;

const entry = (status: string, dateLine?: string) => {
  const { document, maybeFrontmatter } = parse(bragSource(status, dateLine));

  return bragItems(
    "2026-11-27.md",
    Option.getOrUndefined(maybeFrontmatter),
    document
  );
};

describe("portfolio.json", () => {
  test("the committed record decodes", () => {
    expect(portfolio.artifacts.map((artifact) => artifact.name)).toEqual([
      "business-insurance",
      "ai-sdlc-rollout",
      "suunto-coach",
      "ticket-to-merge",
    ]);
  });

  test("an artifact without proof fails to decode", () => {
    const [first, ...rest] = portfolioJson.artifacts;
    const { proof: _proof, ...withoutProof } = first ?? {};

    expect(() =>
      decodePortfolio({
        ...portfolioJson,
        artifacts: [withoutProof, ...rest],
      })
    ).toThrow(/proof/u);
  });

  test("an [ask: …] placeholder is not a known value", () => {
    expect(Option.isNone(known("[ask: LinkedIn profile URL]"))).toBe(true);
    expect(Option.isNone(known(""))).toBe(true);
    expect(Option.isNone(known(undefined))).toBe(true);
    expect(known("https://github.com/przytrzask")).toEqual(
      Option.some("https://github.com/przytrzask")
    );
  });
});

describe("case studies", () => {
  test("each slug matches its file name and its artifact", () => {
    expect(caseStudies.map((study) => study.slug).toSorted()).toEqual([
      "ai-sdlc-rollout",
      "business-insurance",
      "suunto-coach",
      "ticket-to-merge",
    ]);

    for (const { artifact, caseStudy } of works) {
      expect(artifact.case_study).toBe(`case-studies/${caseStudy.slug}.md`);
      expect(artifact.url).toBe(
        `${portfolio.links.site}/work/${caseStudy.slug}`
      );
      expect(artifactSlug(artifact)).toBe(caseStudy.slug);
    }
  });

  test("a file name that is not kebab-case is refused", () => {
    expect(slugFromPath("../../case-studies/suunto-coach.md")).toBe(
      "suunto-coach"
    );
    expect(() => slugFromPath("../../case-studies/Suunto Coach.md")).toThrow(
      /kebab-case/u
    );
  });

  test("every case study keeps the six template sections", () => {
    const sections = SECTION_HEADINGS.map((heading) => `### ${heading}\n\nx`);

    const complete = parse(
      `# Title\n\n**Live:** x\n\n${sections.join("\n\n")}`
    ).document;

    const missingResult = parse(
      `# Title\n\n**Live:** x\n\n${sections.filter((section) => !section.includes("Result")).join("\n\n")}`
    ).document;

    expect(caseStudyFromDocument("demo", complete).title).toBe("Title");
    expect(() => caseStudyFromDocument("demo", missingResult)).toThrow(
      /Result/u
    );
  });

  test("a case study with no artifact is refused", () => {
    const [first] = caseStudies;

    expect(first).toBeDefined();
    expect(() => joinWorks([], first === undefined ? [] : [first])).toThrow(
      /no artifact/u
    );
  });
});

describe("brag entries", () => {
  test("a curated entry becomes shipped items", () => {
    expect(entry("curated")).toEqual([
      {
        anchor: "added-test-slow-to-the-e2e-test-runner",
        area: "e2e-inc/e2e",
        artifact: "ai-sdlc-rollout",
        file: "2026-11-27.md",
        impact: "Merged on 2026-11-23",
        maybeDate: Option.some("2026-11-23"),
        maybeProofUrl: Option.some("https://github.com/e2e-inc/e2e/pull/1982"),
        periodEnd: "2026-11-27",
        periodStart: "2026-11-21",
        proof: "https://github.com/e2e-inc/e2e/pull/1982",
        skills: ["TypeScript", "Open source", "Mutation testing"],
        what: "Added test.slow() to the e2e test runner",
      },
    ]);
  });

  test("an item shows its own Date, or the entry's period without one", () => {
    const [dated] = entry("curated");
    const [undated] = entry("curated", "");

    expect(dated === undefined ? undefined : shippedWhen(dated)).toEqual({
      maybeDateTime: Option.some("2026-11-23"),
      text: "23 Nov 2026",
    });
    expect(undated?.maybeDate).toEqual(Option.none());
    expect(undated === undefined ? undefined : shippedWhen(undated)).toEqual({
      maybeDateTime: Option.none(),
      text: "21–27 Nov 2026",
    });
  });

  test("a period range names each month and year only where it changes", () => {
    expect(formatPeriod("2026-11-21", "2026-11-27")).toBe("21–27 Nov 2026");
    expect(formatPeriod("2026-11-28", "2026-12-04")).toBe(
      "28 Nov – 4 Dec 2026"
    );
    expect(formatPeriod("2026-12-28", "2027-01-03")).toBe(
      "28 Dec 2026 – 3 Jan 2027"
    );
    expect(formatPeriod("2026-11-27", "2026-11-27")).toBe("27 Nov 2026");
  });

  test("a Date that is malformed or outside the entry's period is refused", () => {
    expect(() => entry("curated", "- Date: 23 Nov 2026\n")).toThrow(
      /YYYY-MM-DD/u
    );
    expect(() => entry("curated", "- Date: 2026-12-01\n")).toThrow(
      /outside the entry's period/u
    );
  });

  test("the shipped log lists the newest item first", () => {
    const keys = shipped.map(shippedSortKey);

    expect(keys).toEqual(keys.toSorted().toReversed());
  });

  test("a raw entry is skipped", () => {
    expect(entry("raw")).toEqual([]);
  });

  test("the committed entries are all curated and point at artifacts", () => {
    const names = portfolio.artifacts.map((artifact) => artifact.name);

    expect(shipped.length).toBeGreaterThan(0);

    for (const item of shipped) {
      expect(names).toContain(item.artifact);
    }
  });
});
