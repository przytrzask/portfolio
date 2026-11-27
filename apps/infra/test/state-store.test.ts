import * as Cloudflare from "@alchemy.run/cloudflare";
import { expect, it } from "@effect/vitest";

import { portfolioState } from "../src/state-store.ts";

it("keeps Alchemy state in the portfolio state store Worker", () => {
  const requested: Parameters<typeof Cloudflare.state>[0][] = [];

  portfolioState((options) => {
    requested.push(options);

    return Cloudflare.state(options);
  });

  expect(requested).toEqual([{ workerName: "alchemy-state-store-portfolio" }]);
});
