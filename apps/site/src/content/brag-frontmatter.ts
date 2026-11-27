import { Schema } from "effect";

export const BragFrontmatter = Schema.Struct({
  period_end: Schema.String,
  period_start: Schema.String,
  status: Schema.String,
  type: Schema.Literal("brag-entry"),
});

export type BragFrontmatter = typeof BragFrontmatter.Type;
