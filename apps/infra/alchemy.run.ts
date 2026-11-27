import * as Cloudflare from "@alchemy.run/cloudflare";
import * as GitHub from "@alchemy.run/github";
import { Website } from "@portfolio/site/website";
import * as Alchemy from "alchemy";
import * as Output from "alchemy/Output";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import { portfolioState } from "./src/state-store.ts";

export default Alchemy.Stack(
  "Portfolio",
  {
    providers: Layer.mergeAll(Cloudflare.providers(), GitHub.providers()),
    state: portfolioState(),
  },
  Effect.gen(function* stack() {
    const website = yield* Website;
    const github = yield* GitHub.GitHubEnv;

    if (github?.pr !== undefined) {
      yield* GitHub.Comment("preview-comment", {
        body: Output.interpolate`
          ## Preview deployed

          **URL:** ${website.url}

          Built from commit ${github.sha.slice(0, 7)}.

          ---
          _This comment updates on every push._
        `,
        issueNumber: github.pr,
        owner: github.owner,
        repository: github.repository,
      });
    }

    return { url: website.url };
  })
);
