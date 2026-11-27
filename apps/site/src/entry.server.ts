import { Effect } from "effect";
import { Server } from "foldkit/experimental";

import { caseStudies } from "./content/case-studies.ts";
import { init, view } from "./main.ts";
import { shippedHref, workHref } from "./route.ts";

export const renderDocument = Server.renderDocument;

export const prerenderPaths: ReadonlyArray<string> = [
  "/",
  shippedHref(),
  ...caseStudies.map((caseStudy) => workHref(caseStudy.slug)),
];

export const renderPage = (request: Request): Promise<Server.EntryResult> =>
  Effect.runPromise(
    Server.renderToString(
      { init, routing: {}, view },
      { url: request.url }
    ).pipe(Effect.map(Server.Rendered))
  );
