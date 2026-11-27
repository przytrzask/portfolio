import { findWork, type Work } from "./case-studies.ts";

export const PROOF_CARD_SLUGS = [
  "suunto-coach",
  "ticket-to-merge",
  "business-insurance",
] as const;

export const proofCards: ReadonlyArray<Work> = PROOF_CARD_SLUGS.map((slug) => {
  const work = findWork(slug);

  if (work === undefined) {
    throw new Error(
      `Proof card ${slug} has no case study. Add case-studies/${slug}.md and its artifact in portfolio.json.`
    );
  }

  return work;
});
