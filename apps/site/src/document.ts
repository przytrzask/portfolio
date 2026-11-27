import headlineFont from "@fontsource-variable/tasa-orbiter/files/tasa-orbiter-latin-wght-normal.woff2?url";
import { Server } from "foldkit/experimental";

export const fontPreloads: ReadonlyArray<string> = [headlineFont];

const preloadLink = (href: string) =>
  `<link rel="preload" href="${href}" as="font" type="font/woff2" crossorigin>`;

export const head = fontPreloads.map(preloadLink).join("\n");

export const renderDocument: Server.DocumentRenderer = (application, assets) =>
  Server.renderDocument(application, assets, { head });
