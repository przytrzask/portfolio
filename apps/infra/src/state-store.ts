import * as Cloudflare from "@alchemy.run/cloudflare";

export const portfolioStateStoreName = "alchemy-state-store-portfolio";

export const portfolioState = (state = Cloudflare.state) =>
  state({ workerName: portfolioStateStoreName });
