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

import { HEADLINE } from "../src/copy.ts";
import { AppRoute, update, view } from "../src/main.ts";

describe("home page", () => {
  test("leads with the product engineer headline", () => {
    scene(
      { update, view },
      given({ route: AppRoute.Home() }),
      expect(role("heading", { level: 1, name: HEADLINE })).toExist()
    );
  });

  test("shows three proof cards, each linking to a case study", () => {
    scene(
      { update, view },
      given({ route: AppRoute.Home() }),
      expectAll(all.selector('[aria-label="Proof"] a')).toHaveCount(3),
      expectAll(
        all.selector('[aria-label="Proof"] a[href^="/work/"]')
      ).toHaveCount(3),
      expect(
        selector('[aria-label="Proof"] a[href="/work/suunto-coach"]')
      ).toContainText("40/40"),
      expect(
        selector('[aria-label="Proof"] a[href="/work/ticket-to-merge"]')
      ).toContainText("23"),
      expect(
        selector('[aria-label="Proof"] a[href="/work/business-insurance"]')
      ).toContainText("~3 mo")
    );
  });

  test("links GitHub and the resume, and hides links still marked [ask]", () => {
    scene(
      { update, view },
      given({ route: AppRoute.Home() }),
      expect(role("link", { name: "GitHub" })).toHaveAttr(
        "href",
        "https://github.com/przytrzask"
      ),
      expect(role("link", { name: "Resume (PDF)" })).toHaveAttr(
        "href",
        "/resume.pdf"
      ),
      expectAll(all.selector('a[href^="[ask"]')).toHaveCount(0),
      expectAll(all.selector('a[href^="mailto:[ask"]')).toHaveCount(0)
    );
  });

  test("teases all four case studies and the shipped log", () => {
    scene(
      { update, view },
      given({ route: AppRoute.Home() }),
      expectAll(all.selector('h3 a[href^="/work/"]')).toHaveCount(4),
      expect(role("link", { name: "All shipped work" })).toHaveAttr(
        "href",
        "/shipped"
      )
    );
  });

  test("each proof card names its project above the number", () => {
    scene(
      { update, view },
      given({ route: AppRoute.Home() }),
      ...[
        ["suunto-coach", "suunto-coach"],
        ["ticket-to-merge", "ticket → merge"],
        ["business-insurance", "business insurance"],
      ].map(([slug, label]) =>
        expect(
          selector(
            `[aria-label="Proof"] a[href="/work/${slug}"] [data-project]`
          )
        ).toHaveText(label ?? "")
      )
    );
  });

  test("shows no scroll hint until the skier exists", () => {
    scene(
      { update, view },
      given({ route: AppRoute.Home() }),
      expect(selector("main")).not.toContainText("scroll to drop in")
    );
  });
});
