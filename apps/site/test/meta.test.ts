import { Option } from "effect";
import { describe, expect, test } from "vitest";

import { works } from "../src/content/case-studies.ts";
import { portfolio } from "../src/content/portfolio.ts";
import { headFor, jsonLdText } from "../src/document.ts";
import {
  normalizePath,
  prerenderPaths,
  statusFor,
} from "../src/entry.server.ts";
import { AppRoute } from "../src/main.ts";
import {
  displayName,
  metaForRoute,
  personJsonLd,
  siteOrigin,
} from "../src/meta.ts";
import { staticFiles } from "../src/static-files.ts";

const sources = import.meta.glob<string>("../../../case-studies/*.md", {
  eager: true,
  import: "default",
  query: "?raw",
});

const sourceOf = (slug: string): string =>
  Object.entries(sources).find(([path]) => path.endsWith(`/${slug}.md`))?.[1] ??
  "";

const files = staticFiles(prerenderPaths);

const fileAt = (path: string): string => {
  const found = files.find((file) => file.path === path);

  if (found === undefined) {
    throw new Error(`no static file at ${path}`);
  }

  return found.contents;
};

const routes = [
  AppRoute.Home(),
  AppRoute.Shipped(),
  ...works.map((work) => AppRoute.Work({ slug: work.caseStudy.slug })),
];

describe("crawler files", () => {
  test("sitemap.xml lists every prerendered path on the site origin", () => {
    const sitemap = fileAt("/sitemap.xml");

    for (const path of prerenderPaths) {
      const url = path === "/" ? `${siteOrigin()}/` : `${siteOrigin()}${path}`;
      expect(sitemap).toContain(`<loc>${url}</loc>`);
    }

    expect(sitemap.match(/<loc>/gu)).toHaveLength(prerenderPaths.length);
  });

  test("robots.txt allows crawling and points at the sitemap", () => {
    expect(fileAt("/robots.txt")).toContain("Allow: /");
    expect(fileAt("/robots.txt")).toContain(
      `Sitemap: ${siteOrigin()}/sitemap.xml`
    );
    expect(fileAt("/robots.txt")).not.toContain("Disallow: /\n");
  });
});

describe("agent-readable files", () => {
  test.each(works.map((work) => work.caseStudy.slug))(
    "/work/%s has a .md copy identical to its source",
    (slug) => {
      expect(fileAt(`/work/${slug}.md`)).toBe(sourceOf(slug));
    }
  );

  test("llms.txt names the person, the headline and each case study's .md", () => {
    const llms = fileAt("/llms.txt");

    expect(llms.startsWith(`# ${displayName()}\n`)).toBe(true);
    expect(llms).toContain(`> ${portfolio.profile.headline}`);

    for (const work of works) {
      expect(llms).toContain(`${siteOrigin()}/work/${work.caseStudy.slug}.md`);
    }

    expect(llms).toContain(`${siteOrigin()}/shipped.md`);
    expect(llms).not.toMatch(/\[ask:[^\]]*\]\(/u);
    expect(llms).not.toContain("- LinkedIn: [ask");
  });

  test("shipped.md lists every curated win", () => {
    expect(fileAt("/shipped.md")).toContain("# Shipped log");
    expect(fileAt("/shipped.md")).toContain("## ");
  });
});

describe("page metadata", () => {
  test("JSON-LD parses as a Person with no [ask] placeholder", () => {
    const text = jsonLdText(personJsonLd());
    const parsed: unknown = JSON.parse(text);

    expect(parsed).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Person",
      jobTitle: portfolio.profile.target_role,
    });
    expect(text).not.toContain("[ask");
    expect(text).not.toContain("<");
  });

  test("an [ask] name falls back to the GitHub handle", () => {
    const record = {
      ...portfolio,
      profile: { ...portfolio.profile, name: "[ask: name]" },
    };

    expect(personJsonLd(record).name).toBe("przytrzask");
  });

  test.each(routes)(
    "%s has a 50+ character description and og tags with no [ask]",
    (route) => {
      const meta = metaForRoute(route);
      const head = headFor(meta);

      expect(meta.description.length).toBeGreaterThanOrEqual(50);
      expect(head).not.toContain("[ask");
      expect(head).toContain(
        `<meta property="og:image" content="${siteOrigin()}/og.png">`
      );
      expect(head).toContain('<script type="application/ld+json">');
      expect(head).not.toContain("noindex");
      expect(Option.isSome(meta.maybePath)).toBe(true);
    }
  );

  test("the not found page is noindex and has no canonical path", () => {
    const meta = metaForRoute(AppRoute.NotFound({ path: "/nope" }));

    expect(headFor(meta)).toContain('<meta name="robots" content="noindex">');
    expect(Option.isNone(meta.maybePath)).toBe(true);
  });
});

describe("response status", () => {
  test.each(prerenderPaths)("%s answers 200", (path) => {
    expect(statusFor(`https://example.com${path}`)).toBe(200);
  });

  test.each(["/nope", "/work/nope", "/shipped/extra", "/favicon.png"])(
    "%s answers 404",
    (path) => {
      expect(statusFor(`https://example.com${path}`)).toBe(404);
    }
  );

  test("a trailing slash resolves to the same page", () => {
    expect(normalizePath("/shipped/")).toBe("/shipped");
    expect(statusFor("https://example.com/shipped/")).toBe(200);
  });
});
