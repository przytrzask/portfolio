import { Option } from "effect";

import { findWork } from "./content/case-studies.ts";
import { known, type Portfolio, portfolio } from "./content/portfolio.ts";
import { copy, HEADLINE } from "./copy.ts";
import { AppRoute, homeHref, shippedHref, workHref } from "./route.ts";

export type PageMeta = Readonly<{
  title: string;
  description: string;
  maybePath: Option.Option<string>;
  maybeMarkdownPath: Option.Option<string>;
}>;

export const OG_IMAGE_PATH = "/og.png";

export const OG_IMAGE_SIZE = { height: 630, width: 1200 } as const;

export const siteOrigin = (record: Portfolio = portfolio): string =>
  record.links.site.replace(/\/+$/u, "");

const sentence = (text: string): string =>
  `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

const withStop = (text: string): string =>
  /[.!?]$/u.test(text) ? text : `${text}.`;

export const siteDescription = sentence(HEADLINE);

export const githubHandle = (record: Portfolio = portfolio): string =>
  Option.match(known(record.links.github), {
    onNone: () => copy.siteName,
    onSome: (url) =>
      url.replace(/\/+$/u, "").split("/").at(-1) ?? copy.siteName,
  });

export const displayName = (record: Portfolio = portfolio): string =>
  Option.getOrElse(known(record.profile.name), () => githubHandle(record));

const notFoundMeta: PageMeta = {
  description: copy.notFoundDescription,
  maybeMarkdownPath: Option.none(),
  maybePath: Option.none(),
  title: `${copy.notFoundTitle} · ${copy.documentTitle}`,
};

export const markdownPath = (path: string): string => `${path}.md`;

export const metaForRoute = (route: AppRoute): PageMeta =>
  AppRoute.match(route, {
    Home: () => ({
      description: siteDescription,
      maybeMarkdownPath: Option.some("/llms.txt"),
      maybePath: Option.some(homeHref()),
      title: copy.documentTitle,
    }),
    NotFound: () => notFoundMeta,
    Shipped: () => ({
      description: copy.shippedIntro,
      maybeMarkdownPath: Option.some(markdownPath(shippedHref())),
      maybePath: Option.some(shippedHref()),
      title: copy.shippedTitle,
    }),
    Work: ({ slug }) => {
      const work = findWork(slug);

      return work === undefined
        ? notFoundMeta
        : {
            description: withStop(work.artifact.one_liner),
            maybeMarkdownPath: Option.some(markdownPath(workHref(slug))),
            maybePath: Option.some(workHref(slug)),
            title: copy.workTitle(work.caseStudy.title),
          };
    },
  });

export const absoluteUrl = (path: string): string =>
  path === "/" ? `${siteOrigin()}/` : `${siteOrigin()}${path}`;

export type PersonJsonLd = Readonly<{
  "@context": "https://schema.org";
  "@type": "Person";
  name: string;
  jobTitle: string;
  description: string;
  url: string;
  sameAs: ReadonlyArray<string>;
  email?: string;
}>;

export const personJsonLd = (record: Portfolio = portfolio): PersonJsonLd => {
  const person: PersonJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    description: sentence(record.profile.headline),
    jobTitle: record.profile.target_role,
    name: displayName(record),
    sameAs: [
      ...Option.toArray(known(record.links.github)),
      ...Option.toArray(known(record.links.linkedin)),
    ],
    url: `${siteOrigin(record)}/`,
  };

  return Option.match(known(record.profile.email), {
    onNone: () => person,
    onSome: (email) => ({ ...person, email: `mailto:${email}` }),
  });
};
