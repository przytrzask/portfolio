import { Option, Schema } from "effect";

import portfolioJson from "../../../../portfolio.json";

export const Proof = Schema.Struct({
  label: Schema.String,
  value: Schema.String,
});

export type Proof = typeof Proof.Type;

export const Depth = Schema.Literals([1, 2, 3, 4]);

export type Depth = typeof Depth.Type;

export const Artifact = Schema.Struct({
  case_study: Schema.String,
  depth: Depth,
  evidence: Schema.Array(Schema.String),
  name: Schema.String,
  one_liner: Schema.String,
  proof: Proof,
  repo: Schema.String,
  skills: Schema.Array(Schema.String),
  url: Schema.String,
});

export type Artifact = typeof Artifact.Type;

export const Experience = Schema.Struct({
  end: Schema.String,
  highlights: Schema.Array(Schema.String),
  org: Schema.String,
  start: Schema.String,
  title: Schema.String,
});

export const Profile = Schema.Struct({
  email: Schema.optionalKey(Schema.String),
  headline: Schema.String,
  location: Schema.String,
  name: Schema.String,
  onet_code: Schema.String,
  summary: Schema.String,
  target_role: Schema.String,
});

export const Links = Schema.Struct({
  github: Schema.String,
  linkedin: Schema.String,
  site: Schema.String,
});

export const Portfolio = Schema.Struct({
  artifacts: Schema.Array(Artifact),
  experience: Schema.Array(Experience),
  links: Links,
  profile: Profile,
});

export type Portfolio = typeof Portfolio.Type;

export const decodePortfolio = Schema.decodeUnknownSync(Portfolio);

export const portfolio: Portfolio = decodePortfolio(portfolioJson);

const ASK_PREFIX = "[ask:";

export const isAsk = (value: string): boolean => value.startsWith(ASK_PREFIX);

export const known = (value: string | undefined): Option.Option<string> =>
  Option.filter(
    Option.fromUndefinedOr(value),
    (present) => present !== "" && !isAsk(present)
  );

export const artifactSlug = (artifact: Artifact): string =>
  artifact.case_study.replace("case-studies/", "").replace(".md", "");
