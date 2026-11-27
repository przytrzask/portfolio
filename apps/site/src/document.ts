import headlineFont from "@fontsource-variable/tasa-orbiter/files/tasa-orbiter-latin-wght-normal.woff2?url";
import { Option } from "effect";
import { Server } from "foldkit/experimental";
import { fromString } from "foldkit/url";

import { copy } from "./copy.ts";
import {
  absoluteUrl,
  metaForRoute,
  OG_IMAGE_PATH,
  OG_IMAGE_SIZE,
  type PageMeta,
  type PersonJsonLd,
  personJsonLd,
} from "./meta.ts";
import { AppRoute, urlToAppRoute } from "./route.ts";

export const fontPreloads: ReadonlyArray<string> = [headlineFont];

const escapeAttribute = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

export const jsonLdText = (value: PersonJsonLd): string =>
  JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026");

const preloadLink = (href: string) =>
  `<link rel="preload" href="${href}" as="font" type="font/woff2" crossorigin>`;

const metaName = (name: string, content: string) =>
  `<meta name="${name}" content="${escapeAttribute(content)}">`;

const metaProperty = (property: string, content: string) =>
  `<meta property="${property}" content="${escapeAttribute(content)}">`;

export const routeForCanonical = (maybeCanonical: string | undefined) =>
  Option.getOrElse(
    Option.map(
      Option.flatMap(Option.fromUndefinedOr(maybeCanonical), fromString),
      urlToAppRoute
    ),
    () => AppRoute.NotFound({ path: "" })
  );

export const headFor = (meta: PageMeta): string =>
  [
    ...fontPreloads.map(preloadLink),
    metaName("description", meta.description),
    `<meta name="theme-color" content="#e9eff7">`,
    `<link rel="icon" href="/favicon.ico" sizes="32x32">`,
    `<link rel="icon" href="/favicon.svg" type="image/svg+xml">`,
    metaProperty("og:type", "website"),
    metaProperty("og:site_name", copy.siteName),
    metaProperty("og:title", meta.title),
    metaProperty("og:description", meta.description),
    metaProperty("og:image", absoluteUrl(OG_IMAGE_PATH)),
    metaProperty("og:image:width", String(OG_IMAGE_SIZE.width)),
    metaProperty("og:image:height", String(OG_IMAGE_SIZE.height)),
    metaProperty("og:image:alt", copy.ogImageAlt),
    metaName("twitter:card", "summary_large_image"),
    ...Option.match(meta.maybeMarkdownPath, {
      onNone: () => [metaName("robots", "noindex")],
      onSome: (path) => [
        `<link rel="alternate" type="text/markdown" href="${escapeAttribute(path)}">`,
      ],
    }),
    `<script type="application/ld+json">${jsonLdText(personJsonLd())}</script>`,
  ].join("\n");

export const renderDocument: Server.DocumentRenderer = (application, assets) =>
  Server.renderDocument(application, assets, {
    head: headFor(metaForRoute(routeForCanonical(application.canonical))),
    lang: "en",
  });
