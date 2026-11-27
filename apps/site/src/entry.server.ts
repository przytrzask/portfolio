import { Effect } from "effect";
import { Server } from "foldkit/experimental";

import { caseStudies } from "./content/case-studies.ts";
import { init, view } from "./main.ts";
import { shippedHref, workHref } from "./route.ts";

export { renderDocument } from "./document.ts";

export { staticFiles } from "./static-files.ts";

export const prerenderPaths: ReadonlyArray<string> = [
  "/",
  shippedHref(),
  ...caseStudies.map((caseStudy) => workHref(caseStudy.slug)),
];

export const NOT_FOUND_STATUS = 404;

export const normalizePath = (pathname: string): string =>
  pathname === "/" ? pathname : pathname.replace(/\/+$/u, "");

export const statusFor = (
  url: string,
  paths: ReadonlyArray<string> = prerenderPaths
): number =>
  paths.includes(normalizePath(new URL(url).pathname)) ? 200 : NOT_FOUND_STATUS;

export const renderPage = (request: Request): Promise<Server.EntryResult> =>
  Effect.runPromise(
    Server.renderToString(
      { init, routing: {}, view },
      { url: request.url }
    ).pipe(
      Effect.map((application) =>
        Server.Rendered(application, { status: statusFor(request.url) })
      )
    )
  );
