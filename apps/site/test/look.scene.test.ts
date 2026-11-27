import {
  all,
  expect,
  expectAll,
  given,
  role,
  scene,
  selector,
} from "foldkit/scene";
import { describe, test } from "vitest";

import { works } from "../src/content/case-studies.ts";
import { portfolio } from "../src/content/portfolio.ts";
import { proofCards } from "../src/content/proof-cards.ts";
import { copy } from "../src/copy.ts";
import { AppRoute, update, view } from "../src/main.ts";
import { contactLinks } from "../src/pages/home.ts";

const routes = [
  ["home", AppRoute.Home()],
  ["shipped", AppRoute.Shipped()],
  ...works.map(
    (work) =>
      [
        `work/${work.caseStudy.slug}`,
        AppRoute.Work({ slug: work.caseStudy.slug }),
      ] as const
  ),
] as const;

describe("piste look", () => {
  test.each(routes)("%s: every icon is hidden decoration", (_name, route) => {
    scene(
      { update, view },
      given({ route }),
      expectAll(all.selector('svg:not([aria-hidden="true"])')).toHaveCount(0),
      expectAll(all.selector('svg:not([focusable="false"])')).toHaveCount(0)
    );
  });

  test("each contact link keeps its visible text beside its icon", () => {
    scene(
      { update, view },
      given({ route: AppRoute.Home() }),
      ...contactLinks(portfolio).flatMap((link) => [
        expect(selector(`nav a[href="${link.href}"]`)).toHaveText(link.label),
        expect(selector(`nav a[href="${link.href}"] svg`)).toHaveAttr(
          "aria-hidden",
          "true"
        ),
        expect(role("link", { name: link.label })).toHaveAttr(
          "href",
          link.href
        ),
      ])
    );
  });

  test("proof cards and the shipped link read as text, not icons", () => {
    scene(
      { update, view },
      given({ route: AppRoute.Home() }),
      ...proofCards.map((work) =>
        expect(
          selector(
            `[aria-label="Proof"] a[href="/work/${work.caseStudy.slug}"]`
          )
        ).toContainText(`${copy.proofCta}: ${work.caseStudy.title}`)
      ),
      expect(role("link", { name: copy.shippedAll })).toHaveAttr(
        "href",
        "/shipped"
      )
    );
  });

  test("trail markers name their depth for screen readers", () => {
    scene(
      { update, view },
      given({ route: AppRoute.Home() }),
      ...works.map((work) =>
        expect(selector(`[data-depth="${work.artifact.depth}"]`)).toContainText(
          copy.depthNames[work.artifact.depth]
        )
      )
    );
  });
});
