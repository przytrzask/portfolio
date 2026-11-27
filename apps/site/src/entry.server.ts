import { Effect } from "effect";
import { Server } from "foldkit/experimental";

import { init, view } from "./main.ts";

export const renderDocument = Server.renderDocument;

export const prerenderPaths: ReadonlyArray<string> = ["/"];

export const renderPage = (request: Request): Promise<Server.EntryResult> =>
  Effect.runPromise(
    Server.renderToString(
      { init, routing: {}, view },
      { url: request.url }
    ).pipe(Effect.map(Server.Rendered))
  );
