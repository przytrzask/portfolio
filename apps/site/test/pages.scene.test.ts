import { all, expect, expectAll, given, role, scene } from "foldkit/scene";
import { describe, test } from "vitest";

import { SECTION_HEADINGS, works } from "../src/content/case-studies.ts";
import { copy } from "../src/copy.ts";
import { AppRoute, update, view } from "../src/main.ts";

describe("case study pages", () => {
  test.each(works.map((work) => [work.caseStudy.slug, work] as const))(
    "%s renders its title and all six section headings",
    (slug, work) => {
      scene(
        { update, view },
        given({ route: AppRoute.Work({ slug }) }),
        expectAll(all.role("heading", { level: 1 })).toHaveCount(1),
        expect(
          role("heading", { level: 1, name: work.caseStudy.title })
        ).toExist(),
        ...SECTION_HEADINGS.map((name) =>
          expect(role("heading", { name })).toExist()
        )
      );
    }
  );

  test("an unknown slug renders the not found view", () => {
    scene(
      { update, view },
      given({ route: AppRoute.Work({ slug: "nope" }) }),
      expect(role("heading", { level: 1, name: copy.notFoundTitle })).toExist()
    );
  });
});

describe("shipped page", () => {
  test("lists curated wins with their proof links", () => {
    scene(
      { update, view },
      given({ route: AppRoute.Shipped() }),
      expect(
        role("heading", { level: 1, name: copy.shippedHeading })
      ).toExist(),
      expect(
        role("link", { name: "https://github.com/e2e-inc/e2e/pull/1979" })
      ).toHaveAttr("href", "https://github.com/e2e-inc/e2e/pull/1979")
    );
  });
});
