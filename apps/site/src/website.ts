import * as Cloudflare from "@alchemy.run/cloudflare";
import * as Effect from "effect/Effect";

export class Website extends Cloudflare.Website.Foldkit<Website>()(
  "Website",
  Effect.succeed({
    assets: { htmlHandling: "drop-trailing-slash" },
    rootDir: "../site",
    workersDev: true,
  } satisfies Cloudflare.Website.FoldkitProps)
) {}
