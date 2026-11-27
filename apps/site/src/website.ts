import * as Cloudflare from "@alchemy.run/cloudflare";
import { Stage } from "alchemy/Stage";
import * as Effect from "effect/Effect";

export const prodWorkerName = "portfolio";

export class Website extends Cloudflare.Website.Foldkit<Website>()(
  "Website",
  Effect.gen(function* website() {
    const stage = yield* Stage;

    const base = {
      assets: { htmlHandling: "drop-trailing-slash" },
      rootDir: "../site",
      workersDev: true,
    } satisfies Cloudflare.Website.FoldkitProps;

    return stage === "prod" ? { ...base, name: prodWorkerName } : base;
  })
) {}
